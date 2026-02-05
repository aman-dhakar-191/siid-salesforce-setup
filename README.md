# SIID Salesforce Setup

A comprehensive toolkit for managing Salesforce session IDs and automating Salesforce project setup, consisting of a Chrome extension and SIID extension that work together seamlessly.

**Note**: SIID is a fork of VSCode, so the extension works with SIID IDE using the `siid://` protocol handler.

## Project Structure

This repository is organized into separate packages:

```
├── chrome-extension/    # Chrome extension for extracting Salesforce session IDs
└── vscode-extension/    # SIID extension for project setup and metadata retrieval
```

## Chrome Extension

The Chrome extension extracts Salesforce session IDs and instance URLs from your browser and opens them using the SIID protocol handler with a single click.

### Features

1. **Salesforce-Only Activation**: Extension only works when a Salesforce org is opened
2. **Smart Session ID Detection**: Automatically detects session ID from cookies:
   - Checks for `sid` cookie on my.salesforce.com
   - Checks for `sid` cookie on lightning.force.com
3. **Instance URL Extraction**: Captures the full Salesforce instance URL
4. **One-Click Integration**: Click the extension icon to immediately open `siid://siid.siid-salesforce-vscode/setup?sessionId=...&instanceUrl=...`
5. **Automatic Icon State**: Icon is enabled only on Salesforce domains

### Quick Start

1. Navigate to the `chrome-extension/` directory
2. Follow the installation instructions in `chrome-extension/README.md`
3. Load the extension in Chrome
4. Visit any Salesforce org and click the extension icon

## SIID Extension

The SIID extension handles the SIID protocol and automates Salesforce project setup and metadata retrieval.

**Note**: Works with SIID IDE (a VSCode fork) or VSCode itself.

### Features

1. **URI Protocol Handler**: Receives session ID and instance URL from Chrome extension
2. **Automatic Project Detection**: Checks if workspace is a Salesforce project (sfdx-project.json)
3. **Project Creation**: Creates new Salesforce project if needed using `sf` CLI
4. **Org Authentication**: Authenticates to Salesforce org using the session ID
5. **Metadata Retrieval**: Automatically retrieves:
   - Apex Classes
   - Lightning Web Components (LWC)
   - Aura Components
   - Apex Triggers
   - Custom Objects and Lightning types

### Prerequisites

- VSCode 1.80.0 or higher
- Salesforce CLI (`sf`) installed and available in PATH

### Quick Start

1. Navigate to the `vscode-extension/` directory
2. Follow the installation instructions in `vscode-extension/README.md`
3. Open VSCode and load the extension
4. Use Chrome extension to trigger the workflow

## Installation

See individual package READMEs for detailed installation instructions:

- [Chrome Extension Installation](chrome-extension/README.md)
- [VSCode Extension Installation](vscode-extension/README.md)

## Usage

### Complete Workflow

1. **Install Both Extensions**
   - Chrome extension in your browser
   - VSCode extension in VSCode

2. **Open VSCode**
   - Can be with or without a workspace folder

3. **Navigate to Salesforce**
   - Open any Salesforce org in Chrome
   - Extension icon will be enabled (colored)

4. **Click Chrome Extension Icon**
   - Session ID and instance URL are captured
   - SIID protocol opens with: `siid://[sessionId]?instanceUrl=[url]`

5. **VSCode Extension Activates**
   - Receives the URI
   - Checks for Salesforce project
   - Creates project if needed
   - Authenticates to the org
   - Retrieves metadata

6. **Start Developing**
   - All metadata is now in your workspace
   - Org is authenticated and set as default
   - Begin making changes!

## Requirements

### Chrome Extension
- Recent version of Google Chrome (with Manifest V3 support)
- Salesforce org access

### VSCode Extension
- VSCode 1.80.0 or higher
- Salesforce CLI (`sf`) installed
- Node.js and npm (for development)

## Development

Each package has its own development setup. See the respective README files for details.

### Chrome Extension Development
```bash
cd chrome-extension
# Load as unpacked extension in chrome://extensions/
```

### VSCode Extension Development
```bash
cd vscode-extension
npm install
npm run compile
# Press F5 in VSCode to debug
```

## Architecture

```
┌─────────────────┐
│ Chrome Browser  │
│                 │
│  Salesforce Org │
│  ↓ Click Icon   │
└────────┬────────┘
         │
         │ siid://sessionId?instanceUrl=...
         │
         ▼
┌─────────────────┐
│ VSCode          │
│                 │
│ 1. Detect/Create│
│    SF Project   │
│                 │
│ 2. Authenticate │
│    with Session │
│                 │
│ 3. Retrieve     │
│    Metadata     │
└─────────────────┘
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Add your license here]