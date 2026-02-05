# SIID Salesforce Session Manager - Chrome Extension

A Chrome extension that extracts Salesforce session IDs and opens them in the SIID protocol handler.

## Features

1. **Salesforce Domain Detection**: The extension only activates when you're on a Salesforce domain (*.salesforce.com or *.force.com)
2. **Session ID Extraction**: Automatically extracts the session ID from cookies:
   - First checks for `sid` cookie on the current domain
   - Falls back to checking my.salesforce.com domain if needed
3. **SIID Protocol Integration**: Opens the session ID using the `siid://` protocol handler
4. **User-Friendly Interface**: Simple popup UI showing session information and actions

## Installation

### From Source

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `chrome-extension` directory from this repository

## Usage

1. Navigate to any Salesforce organization (e.g., https://yourorg.lightning.force.com)
2. Click the extension icon in the Chrome toolbar
3. The extension will display:
   - Current Salesforce domain
   - Extracted session ID
4. Click "Open in SIID" to launch the SIID protocol handler with the session ID
5. Alternatively, click "Copy Session ID" to copy the session ID to your clipboard

## Permissions

The extension requires the following permissions:

- `cookies`: To read the session ID from Salesforce cookies
- `activeTab`: To check if the current tab is on a Salesforce domain
- `tabs`: To manage tabs and open the SIID protocol URL
- Host permissions for `*.salesforce.com` and `*.force.com`

## File Structure

```
chrome-extension/
├── manifest.json        # Extension manifest (Manifest V3)
├── background.js        # Background service worker
├── content.js          # Content script for Salesforce pages
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── popup.css           # Popup styles
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

## Technical Details

### Session ID Extraction Logic

1. The extension checks cookies on the current domain for a cookie named `sid`
2. If not found and on a lightning.force.com domain, it checks .salesforce.com domain
3. The session ID is then passed to the SIID protocol handler

### Domain Detection

The extension automatically enables/disables based on the current tab's URL:
- Enabled on: `*.salesforce.com` and `*.force.com` domains
- Disabled on: All other domains

## Development

To modify the extension:

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card

## Notes

- This extension uses Manifest V3, the latest Chrome extension format
- The extension icon will be disabled (grayed out) when not on a Salesforce domain
- Make sure you have the SIID protocol handler registered on your system for the "Open in SIID" feature to work

## License

[Add your license here]
