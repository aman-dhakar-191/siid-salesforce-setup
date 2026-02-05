# SIID Salesforce Session Manager - Chrome Extension

A Chrome extension that extracts Salesforce session IDs and instance URLs, then opens them in the SIID protocol handler with a single click.

## Features

1. **Salesforce Domain Detection**: The extension only activates when you're on a Salesforce domain (*.salesforce.com or *.force.com)
2. **Session ID Extraction**: Automatically extracts the session ID from cookies:
   - First checks for `sid` cookie on the current domain
   - Falls back to checking my.salesforce.com domain if needed
3. **Instance URL Capture**: Extracts the full Salesforce instance URL (e.g., https://yourorg.lightning.force.com)
4. **One-Click Integration**: Click the extension icon to immediately open the `siid://` protocol handler with both session ID and instance URL
5. **Automatic Icon State**: Extension icon is enabled only on Salesforce domains, disabled elsewhere

## Installation

### From Source

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `chrome-extension` directory from this repository

## Usage

1. Navigate to any Salesforce organization (e.g., https://yourorg.lightning.force.com)
2. The extension icon will be enabled (colored, not grayed out)
3. Click the extension icon
4. The SIID protocol handler will open immediately with: `siid://[session-id]?instanceUrl=[encoded-url]`
5. VSCode extension (if installed) will receive this and set up your development environment

**Note**: The extension icon will be disabled (grayed out) when not on a Salesforce domain.

## Permissions

The extension requires the following permissions:

- `cookies`: To read the session ID from Salesforce cookies
- `activeTab`: To check if the current tab is on a Salesforce domain and extract the URL
- `tabs`: To open the SIID protocol URL
- Host permissions for `*.salesforce.com` and `*.force.com`

## File Structure

```
chrome-extension/
├── manifest.json        # Extension manifest (Manifest V3)
├── background.js        # Background service worker
├── content.js          # Content script for Salesforce pages
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

### Click Behavior

When you click the extension icon on a Salesforce domain:
1. The extension extracts the session ID from cookies
2. Opens `siid://[session-id]` in a new tab
3. No popup or additional UI is shown

## Development

To modify the extension:

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card

## Notes

- This extension uses Manifest V3, the latest Chrome extension format
- The extension icon will be disabled (grayed out) when not on a Salesforce domain
- Make sure you have the SIID protocol handler registered on your system for the extension to work
- No popup UI - clicking the icon directly triggers the protocol handler

## License

[Add your license here]
