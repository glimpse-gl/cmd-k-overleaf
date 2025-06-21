# Cmd+K Overleaf

AI-powered command palette for Overleaf LaTeX editor. This Chrome extension enhances the Overleaf experience by providing AI assistance directly in your document.

<p align="center">
  <img src="assets/demo.gif" alt="Demo" width="800">
</p>

## Features

- Access AI assistance with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
- Get intelligent suggestions based on selected text or current context
- View, edit, and accept AI-generated completions
- Works with OpenAI or OpenRouter API providers

## Installation

### From Source (Development)

1. Clone this repository
   ```
   git clone https://github.com/glimpse-gl/cmd-k-overleaf.git
   cd cmd-k-overleaf
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Build the extension
   ```
   npm run build
   ```

4. Load the extension in Chrome
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner
   - Click "Load unpacked" and select the `dist` directory

5. **Configure the keyboard shortcut** (Required)
   - Navigate to `chrome://extensions/shortcuts`
   - Find "Cmd+K Overleaf" in the list
   - Click the pencil icon next to "Trigger command palette"
   - Press Cmd+K (Mac) or Ctrl+K (Windows/Linux) to set the shortcut
   - The shortcut won't work without this manual configuration step

### Configuration

1. Click the extension icon in your browser toolbar
2. Choose your preferred AI provider (OpenAI or OpenRouter)
3. Enter your API key and model name
4. Click "Save Configuration"
5. Optionally, test your connection to verify the API is working

## Usage

1. Open an Overleaf project
2. Select text for context-aware suggestions
3. Press Cmd+K (Mac) or Ctrl+K (Windows/Linux) to open the command palette
4. Type your request
5. Review the AI-generated content
6. Accept all changes or selectively approve/reject them

## Development

- `npm run dev` - Development build with watch mode
- `npm run build` - Production build
- `npm run clean` - Remove dist directory contents