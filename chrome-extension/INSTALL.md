# Installation Guide - SIID Salesforce Session Manager

## Prerequisites

- Recent version of Google Chrome (with Manifest V3 support)
- Active Salesforce org access
- SIID protocol handler installed (optional, for full functionality)

## Step-by-Step Installation

### 1. Download the Extension

Clone or download this repository:
```bash
git clone https://github.com/aman-dhakar-191/siid-salesforce-setup.git
cd siid-salesforce-setup/chrome-extension
```

### 2. Load Extension in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** using the toggle in the top right corner
4. Click the **Load unpacked** button
5. Navigate to and select the `chrome-extension` folder
6. The extension should now appear in your list of installed extensions

### 3. Verify Installation

1. Look for the "SIID Salesforce Session Manager" in your extensions list
2. The extension icon should appear in your Chrome toolbar
3. Pin the extension for easier access (click the puzzle piece icon → pin)

### 4. Test the Extension

1. Navigate to any Salesforce org (e.g., `https://yourorg.lightning.force.com`)
2. Log in to your Salesforce account
3. The extension icon should become enabled (colored, not grayed out)
4. Click the extension icon
5. You should see your session information displayed

## Permissions Explained

The extension requests the following permissions:

- **cookies**: Required to read the Salesforce session ID from cookies
- **activeTab**: Required to check if you're on a Salesforce domain
- **tabs**: Required to open the SIID protocol URL in a new tab
- **Host permissions** for `*.salesforce.com` and `*.force.com`: Required to access Salesforce domains

All permissions are necessary for the extension to function properly.

## Usage

### Basic Usage

1. Open any Salesforce org in Chrome
2. Click the extension icon
3. View your session information:
   - Current domain
   - Session ID
4. Click **"Open in SIID"** to launch the SIID protocol handler
5. Click **"Copy Session ID"** to copy the session ID to clipboard

### Supported Domains

The extension works on:
- `*.salesforce.com` (including my.salesforce.com, login.salesforce.com)
- `*.force.com` (including lightning.force.com, visual.force.com)

### Session ID Extraction

The extension looks for the `sid` cookie in the following order:
1. Current domain (e.g., yourorg.lightning.force.com)
2. Parent Salesforce domain (.salesforce.com)

This ensures the session ID is found regardless of which Salesforce domain you're currently on.

## Troubleshooting

### Extension Icon is Grayed Out

**Problem**: The extension icon appears disabled/grayed out.

**Solution**: 
- Make sure you're on a Salesforce domain (*.salesforce.com or *.force.com)
- Refresh the page
- Check that the extension is enabled in `chrome://extensions/`

### No Session ID Found

**Problem**: The extension shows "Session ID not found" error.

**Solutions**:
- Make sure you're logged into Salesforce
- Try refreshing the page
- Clear your browser cookies and log in again
- Check browser console for errors (F12 → Console tab)

### SIID Protocol Error

**Problem**: Clicking "Open in SIID" shows an error or doesn't open anything.

**Solution**:
- Install the SIID protocol handler on your system first
- Check that the protocol handler is properly registered
- Use "Copy Session ID" as an alternative to manually pass the ID

### Extension Not Loading

**Problem**: Extension doesn't appear after loading.

**Solutions**:
- Make sure you selected the `chrome-extension` folder, not the root folder
- Check that all files are present in the folder
- Look for errors in the extensions page
- Try reloading the extension

## Updating the Extension

If you make changes to the extension code:

1. Go to `chrome://extensions/`
2. Find "SIID Salesforce Session Manager"
3. Click the refresh/reload icon (circular arrow)
4. The changes should now be active

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "SIID Salesforce Session Manager"
3. Click **Remove**
4. Confirm the removal

## Security & Privacy

- The extension only runs on Salesforce domains
- Session IDs are only accessed when you click the extension icon
- No data is sent to external servers
- All processing happens locally in your browser
- Session IDs are never stored or logged

## Support

For issues or questions:
- Check the [README](README.md) for additional information
- Open an issue on the GitHub repository
- Review the [TESTING.html](TESTING.html) file for testing guidelines

## License

[Add license information]
