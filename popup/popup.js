document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('settingsForm');
    const providerSelect = document.getElementById('provider');
    const modelNameInput = document.getElementById('modelName');
    const apiKeyInput = document.getElementById('apiKey');
    const testBtn = document.getElementById('testBtn');
    const statusDiv = document.getElementById('status');
    const modelHelp = document.getElementById('modelHelp');
    const modelHelpPopup = document.getElementById('modelHelpPopup');
    const modelExamples = document.getElementById('modelExamples');
    const modelDocsLink = document.getElementById('modelDocsLink');

    loadConfiguration();

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveConfiguration();
    });

    testBtn.addEventListener('click', function() {
        testConnection();
    });

    providerSelect.addEventListener('change', function() {
        updateModelHelp();
        updatePlaceholder();
    });

    modelHelp.addEventListener('click', function() {
        const isVisible = modelHelpPopup.style.display !== 'none';
        modelHelpPopup.style.display = isVisible ? 'none' : 'block';
    });

    modelExamples.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            modelNameInput.value = e.target.textContent;
            modelHelpPopup.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!modelHelp.contains(e.target) && !modelHelpPopup.contains(e.target)) {
            modelHelpPopup.style.display = 'none';
        }
    });

    function loadConfiguration() {
        chrome.storage.local.get(['provider', 'modelName', 'apiKey'], function(result) {
            if (result.provider) providerSelect.value = result.provider;
            if (result.modelName) modelNameInput.value = result.modelName;
            if (result.apiKey) apiKeyInput.value = result.apiKey;
            
            updateModelHelp();
            updatePlaceholder();
        });
    }

    function saveConfiguration() {
        const config = {
            provider: providerSelect.value,
            modelName: modelNameInput.value,
            apiKey: apiKeyInput.value
        };

        chrome.storage.local.set(config, function() {
            showStatus('Configuration saved!', 'success');
        });
    }

    async function testConnection() {
        const provider = providerSelect.value;
        const modelName = modelNameInput.value;
        const apiKey = apiKeyInput.value;

        if (!modelName || !apiKey) {
            showStatus('Please fill in all fields before testing.', 'error');
            return;
        }

        showStatus('Testing connection...', 'info');
        testBtn.disabled = true;

        try {
            const url = provider === 'openai' 
                ? 'https://api.openai.com/v1/chat/completions'
                : 'https://openrouter.ai/api/v1/chat/completions';

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };

            if (provider === 'openrouter') {
                headers['HTTP-Referer'] = window.location.origin;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: modelName,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 1
                })
            });

            if (response.ok) {
                showStatus('Connection test successful!', 'success');
            } else {
                const error = await response.text();
                showStatus(`Connection failed: ${response.status} - ${error}`, 'error');
            }
        } catch (error) {
            showStatus(`Connection failed: ${error.message}`, 'error');
        } finally {
            testBtn.disabled = false;
        }
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        statusDiv.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    function updateModelHelp() {
        const provider = providerSelect.value;
        
        if (provider === 'openrouter') {
            modelExamples.innerHTML = `
                <li>anthropic/claude-3-5-sonnet-20241022</li>
                <li>google/gemini-2.0-flash-001</li>
            `;
            modelDocsLink.href = 'https://openrouter.ai/models';
            modelDocsLink.textContent = 'View all OpenRouter models →';
        } else {
            modelExamples.innerHTML = `
                <li>gpt-4.1</li>
                <li>gpt-4o-mini</li>
            `;
            modelDocsLink.href = 'https://platform.openai.com/docs/models';
            modelDocsLink.textContent = 'View all OpenAI models →';
        }
    }

    function updatePlaceholder() {
        const provider = providerSelect.value;
        
        if (provider === 'openrouter') {
            modelNameInput.placeholder = 'e.g., anthropic/claude-3-5-sonnet-20241022, google/gemini-2.0-flash-exp';
        } else {
            modelNameInput.placeholder = 'e.g., gpt-4o, gpt-4-turbo';
        }
    }
}); 