import OpenAI from 'openai';
import INSTRUCTION_PROMPT from './prompts'


async function getConfig() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['provider', 'modelName', 'apiKey'], (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}

async function createClient(config: any) {
    if (!config.apiKey || !config.provider) {
        throw new Error('Configuration not found. Please set up your API key and provider in the extension popup.');
    }
    
    const baseURL = config.provider === 'openai' 
        ? 'https://api.openai.com/v1'
        : 'https://openrouter.ai/api/v1';
    
    return new OpenAI({
        apiKey: config.apiKey,
        baseURL: baseURL,
        defaultHeaders: config.provider === 'openrouter' ? {
            'HTTP-Referer': 'chrome-extension://' + chrome.runtime.id,
        } : {}
    });
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function openPopup() {
    let tab = await getCurrentTab()
    if (!tab?.url?.match(/https:\/\/www\.overleaf\.com\/project\/[a-zA-Z0-9]+/) || !tab.id) {
        return
    }
    console.log(tab.url)
    const response = await chrome.tabs.sendMessage(tab.id, {
        type: "show_popup",
        url: tab.url
    })
    console.log(response)
    
}

chrome.commands.onCommand.addListener((command) => {
    console.log(command)
    if (command == "command-k") {
        openPopup()
    }
});

async function getCompletion(input: string) {
    const config: any = await getConfig();
    const client = await createClient(config);
    
    const response = await client.chat.completions.create({
        model: config.modelName,
        messages: [
            {
                role: "system",
                content: INSTRUCTION_PROMPT
            },
            {
                role: "user", 
                content: input
            }
        ],
        max_tokens: 16384
    });
    
    return response.choices[0]?.message?.content || '';
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const userPrompt = message?.userPrompt
    const selectedText = message?.selectedText
    if (userPrompt) {
        const input = selectedText 
        ? `SELECTED TEXT: ${selectedText}\n\nREQUEST: ${userPrompt}`
        : `REQUEST: ${userPrompt}\n\nCONTEXT: This will be inserted at the current cursor position in my LaTeX document.`;
        console.log(input)
        getCompletion(input).then(completion => {
            if (sender?.tab?.id) {
                chrome.tabs.sendMessage(sender.tab.id, 
                    { type: "completion", 
                      selectedText: selectedText, 
                      completion: completion})
            } else {
                console.error("No tab ID available in sender");
            }
        }).catch(error => {
            console.error("Error getting completion:", error);
            if (sender?.tab?.id) {
                chrome.tabs.sendMessage(sender.tab.id, 
                    { type: "completion", 
                      selectedText: selectedText, 
                      completion: "Error: " + error.message})
            }
        })
    }
})