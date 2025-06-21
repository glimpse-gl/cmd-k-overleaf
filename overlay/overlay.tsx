import {diffWords} from 'diff';

let selectedText = ''
let popupTop: number = -1
let popupLeft: number = -1
let mouseTop: number = -1
let mouseLeft: number = -1
let isMouseDown: boolean = false
let originalWidth: number = -1
let originalHeight: number = -1
const minPopupHeight: number = 100
let completionRange: Range | null

function createPopup() {
  if (document.querySelector("body > div.popup")) {
    console.log("Popup already exists!")
    return
  }
  
  const selection = document.getSelection()
  if (selection && selection.rangeCount > 0 && selection.anchorNode) {
    completionRange = selection.getRangeAt(0).cloneRange()
    selectedText = selection.getRangeAt(0).toString()
    console.log("Selected text:", selectedText)
  }
  
  const popup = document.createElement("div")
  popup.className = "popup"
  const popupWidthPercentage = 30;
  const popupActualWidth = window.innerWidth * (popupWidthPercentage / 100);
  popup.style.top = window.innerHeight * 0.25 + "px"
  popup.style.left = (window.innerWidth / 2 - (popupActualWidth / 2)) + "px"

  const row = document.createElement("div")
  row.className = "popup__row"

  const textarea = document.createElement("textarea")
  textarea.className = "popup__input"
  textarea.placeholder = "Suggest edits here"
  textarea.rows = 1
  textarea.addEventListener("input", function() {
    console.log(textarea.style.height, textarea.scrollHeight)
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px'
  })

  const sendBtn = document.createElement("button")
  sendBtn.className = "icon-btn popup__send"
  sendBtn.setAttribute('aria-label', 'Send')
  sendBtn.innerHTML = '&#8593;'
  sendBtn.addEventListener("click", function() {
    chrome.runtime.sendMessage({
      userPrompt: textarea.value,
      selectedText: selectedText
    })
    sendBtn.style.display = 'none'
    const spinnerElement = document.createElement("div")
    spinnerElement.className = 'popup__spinner'
    sendBtn.replaceWith(spinnerElement)
  })
  popup.addEventListener("keypress", function(event) {
    if (event.key === "Enter" && document.activeElement == textarea && !event.shiftKey) {
      event.preventDefault()
      sendBtn.click()
    }
  })

  const closeBtn = document.createElement('button');
  closeBtn.className = 'icon-btn popup__close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '&times;'
  closeBtn.addEventListener("click", function() {
    popup.parentNode?.removeChild(popup);
  })

  row.appendChild(textarea)
  row.appendChild(sendBtn)
  row.appendChild(closeBtn)

  let popupWrapper = document.createElement('div')
  popupWrapper.className = 'popup__wrapper'
  popupWrapper.appendChild(row)
  popup.appendChild(popupWrapper)

  setTimeout(() => {
    textarea.focus();
  }, 10);
  textarea.focus()

  popup.addEventListener("mousedown", function(event) {
    if (event?.target && (event.target as HTMLElement).className === "popup") {
      event.preventDefault()
      var rect = popup.getBoundingClientRect();
      popupTop = rect.top
      popupLeft = rect.left
      mouseTop = event.clientY
      mouseLeft = event.clientX
      isMouseDown = true
      const val = getClosestSide(rect, event) 

      const myResizeMouseMoveHandler = function(event: MouseEvent) {
        event.preventDefault()

        if (val === 'left') {
          let newLeft = popupLeft + (event.clientX - mouseLeft)
          let newWidth = originalWidth - (event.clientX - mouseLeft)
          if (newLeft >= 0 && newLeft + newWidth < window.innerWidth && newWidth >= 0.1 * window.innerWidth) {
            popup.style.left = newLeft + "px"
            popup.style.width = newWidth + "px"
          }
        }
        else if (val == 'top') {
          let newTop = popupTop + (event.clientY - mouseTop)
          let newHeight = originalHeight - (event.clientY - mouseTop)
          if (newTop >= 0 && newTop + newHeight < window.innerHeight && newHeight >= minPopupHeight) {
            popup.style.top = newTop + "px"
            popup.style.height = newHeight + 'px'
          }
        }
        else if (val === 'right') {
          let newWidth = originalWidth + (event.clientX - mouseLeft)
          if (newWidth >= 0.1 * window.innerWidth && newWidth + popup.offsetLeft <= window.innerWidth) {
            popup.style.width = newWidth + 'px'
          }
        }
        else if (val === 'bottom') {
          let newHeight = originalHeight + (event.clientY - mouseTop)
          if (newHeight >= minPopupHeight && newHeight + popup.offsetTop <= window.innerHeight) {
            popup.style.height = newHeight + 'px'
          }
        }
      }

      const myMouseMoveHandler = function(event: MouseEvent) {
        if (isMouseDown) {
          let newTop = popupTop + (event.clientY - mouseTop)
          let newLeft = popupLeft + (event.clientX - mouseLeft)
          event.preventDefault()
          popup.style.top = newTop + "px"
          popup.style.left = newLeft + "px"
        }
      }

      const myMouseUpHandler = function(event: MouseEvent) {
        document.removeEventListener("mousemove", myMouseMoveHandler)
        document.removeEventListener("mouseup", myMouseUpHandler)
        document.removeEventListener("mousemove", myResizeMouseMoveHandler)
        isMouseDown = false
      }

      if (val) {
        originalHeight = popup.offsetHeight
        originalWidth = popup.offsetWidth
        document.addEventListener("mousemove", myResizeMouseMoveHandler)
        document.addEventListener("mouseup", myMouseUpHandler)
      }
      else {
        document.addEventListener("mousemove", myMouseMoveHandler)
        document.addEventListener("mouseup", myMouseUpHandler)
      }
    }
  })
  return popup
}


const borderThreshold = 5

function getClosestSide(rect: DOMRect, event: MouseEvent) {
  if (Math.abs(rect.top - event.clientY) < borderThreshold) {
    return 'top'
  }
  if (Math.abs(rect.bottom - event.clientY) < borderThreshold) {
    return 'bottom'
  }
  if (Math.abs(rect.right - event.clientX) < borderThreshold) {
    return 'right'
  }
  if (Math.abs(rect.left - event.clientX) < borderThreshold) {
    return 'left'
  }
  return null
}

function renderDiff(diff: any[]) {
  let div = document.createElement('div');
  for (let i = 0; i < diff.length; i += 1) {
    let newSpanDecoration = document.createElement('span');
    let className = 'diff-unchanged';
    if (diff[i].added) {
        className = 'diff-added';
    } else if (diff[i].removed) {
        className = 'diff-removed';
    }
    if (className == 'diff-added' || className == 'diff-removed') {
      newSpanDecoration.addEventListener("mouseover", function(event: MouseEvent) {
        document.querySelectorAll('.diff-popup').forEach(popup => popup.remove());
        let coords = null;
        let location = newSpanDecoration.getClientRects();
        if (location.length > 1) {
          const tolerance = 2;
          for (let i = 0; i < location.length; i++) {            
            if (event.clientY <= location[i].bottom + tolerance + 1 && event.clientY >= location[i].top - tolerance 
              && event.clientX >= location[i].left - tolerance && event.clientX <= location[i].right + tolerance) {
                coords = location[i]
                break;
            }
          }
        }
        else if (location.length == 1) {
          coords = location[0]          
        }
        else {
          console.log("No coords found!")
        }        
        if (coords) {
          let newSpanButtonsDiv = document.createElement('div');
          newSpanButtonsDiv.className = 'diff-popup';
          newSpanButtonsDiv.style.top = coords.bottom - 6 + 'px';
          newSpanButtonsDiv.style.left = (coords.left + coords.right) / 2 + 'px';
          newSpanButtonsDiv.style.zIndex = '10000' 
          newSpanButtonsDiv.style.position = 'fixed'
          newSpanButtonsDiv.style.transform = 'translateX(-50%)';
          let acceptButton = document.createElement('button')
          acceptButton.className = "accept__small"
          acceptButton.textContent = "Accept"
          acceptButton.addEventListener("click", function() {
            if (newSpanDecoration.className == 'diff-removed') {
              newSpanDecoration.remove()
            }
            else if (newSpanDecoration.className == 'diff-added') {
              newSpanDecoration.className = 'diff-unchanged'
            }
            newSpanButtonsDiv.remove()
          })
          let rejectButton = document.createElement('button')
          rejectButton.className = "reject__small"
          rejectButton.textContent = "Reject"
          rejectButton.addEventListener("click", function() {
            if (newSpanDecoration.className == 'diff-removed')
              newSpanDecoration.className = 'diff-unchanged'
            else if (newSpanDecoration.className == 'diff-added')
              newSpanDecoration.remove()
            newSpanButtonsDiv.remove()
          })
          newSpanButtonsDiv.appendChild(acceptButton)
          newSpanButtonsDiv.appendChild(rejectButton)
          document.body.appendChild(newSpanButtonsDiv);
        }
      })
      newSpanDecoration.addEventListener("mouseout", function(event: MouseEvent) {
        let popup = document.querySelector("body > div.diff-popup")
        let relatedTarget = event.relatedTarget;
        if (popup) {
          if (relatedTarget && popup.contains(relatedTarget as Node)) {
            return;
          }
          popup.remove()
        }
      })
    }
    newSpanDecoration.className = className;
    newSpanDecoration.textContent = diff[i].value;
    div.appendChild(newSpanDecoration)
  }
  return div;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    sendResponse({ status: "success", receivedMessage: message });
    if (message?.type === "show_popup") {
      let popup = createPopup()
      if (popup) {
        document.body.appendChild(popup)
      }
    }
    else if (message?.type === "completion") {
      const popupElement = document.querySelector("body > div.popup > div.popup__wrapper")
      if (popupElement) {
        console.log("popupElement found:", popupElement)
        while (popupElement.firstChild)
          popupElement.firstChild.remove()
        let popupDiv = document.createElement('div')
        
        let acceptButton = document.createElement('button')
        acceptButton.className = "accept__button"
        acceptButton.textContent = "Accept All"

        let rejectButton = document.createElement('button')
        rejectButton.className = "reject__button"
        rejectButton.textContent = "Reject All"
        
        rejectButton.addEventListener("click", function() {
          (popupElement.parentNode as Element)?.remove()
        })
        
        let topRow = document.createElement('div')
        topRow.className = 'popup__row'
        topRow.appendChild(acceptButton)
        topRow.appendChild(rejectButton)
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'icon-btn popup__close';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.innerHTML = '&times;'
        closeBtn.addEventListener("click", function() {
          (popupElement.parentNode as Element)?.remove()
        })
        topRow.appendChild(closeBtn)
        
        let bottomRow = document.createElement('div')
        bottomRow.className = 'popup__row'
        popupDiv = renderDiff(diffWords(message?.selectedText, message?.completion))
        popupDiv.className = 'popup__output'
        
        console.log("Selected text received:", message?.selectedText)
        console.log("Completion received:", message?.completion)
        
        acceptButton.addEventListener("click", function() {
          if (completionRange) {
            completionRange.deleteContents()
            let newTextToRender = '';
            for (let span of popupDiv.children) {
              if (span.className == 'diff-added' || span.className == 'diff-unchanged') {
                newTextToRender += span.textContent
              }
            }
            let completionTextNode = document.createTextNode(newTextToRender)
            completionRange.insertNode(completionTextNode)
          }
          (popupElement.parentNode as Element)?.remove()
        })
        
        bottomRow.appendChild(popupDiv)
        popupElement?.append(topRow)
        popupElement?.append(bottomRow)
      }
      else {
        console.error("No popup element found or unknown message type");
      }
    }
    return true;
  }
)