# SIID Salesforce Setup

A comprehensive toolkit for managing Salesforce session IDs, consisting of a Chrome extension and VSCode extension.

## Project Structure

This repository is organized into separate packages:

```
├── chrome-extension/    # Chrome extension for extracting Salesforce session IDs
└── vscode-extension/   # VSCode extension (coming soon)
```

## Chrome Extension

The Chrome extension extracts Salesforce session IDs from your browser and opens them using the SIID protocol handler.

### Features

1. **Salesforce-Only Activation**: Extension only works when a Salesforce org is opened
2. **Smart Session ID Detection**: Automatically detects session ID from cookies:
   - Checks for `sid` cookie on my.salesforce.com
   - Checks for `sid` cookie on lightning.force.com
3. **SIID Protocol Integration**: Opens `siid://` URI with the session ID
4. **User-Friendly Interface**: Clean popup showing session information

### Quick Start

1. Navigate to the `chrome-extension/` directory
2. Follow the installation instructions in `chrome-extension/README.md`
3. Load the extension in Chrome
4. Visit any Salesforce org and click the extension icon

## VSCode Extension

Coming soon! Will provide protocol handler registration and additional Salesforce development tools.

## Installation

See individual package READMEs for detailed installation instructions:

- [Chrome Extension Installation](chrome-extension/README.md)
- [VSCode Extension Installation](vscode-extension/README.md)

## Usage

1. Install the Chrome extension
2. Navigate to any Salesforce organization
3. Click the extension icon
4. Click "Open in SIID" to launch the protocol handler

## Requirements

- Chrome browser (version 88 or higher for Manifest V3 support)
- Salesforce org access
- SIID protocol handler installed on your system (for the "Open in SIID" feature)

## Development

Each package has its own development setup. See the respective README files for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Add your license here]