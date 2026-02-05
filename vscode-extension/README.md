# SIID Salesforce VSCode Extension

A VSCode extension that handles the `siid://` protocol for automatic Salesforce project setup and metadata retrieval.

## Features

- **URI Protocol Handler**: Receives session ID and instance URL from Chrome extension
- **Automatic Project Detection**: Checks if current workspace is a Salesforce project
- **Project Creation**: Creates new Salesforce project if needed using `sf` CLI
- **Org Authentication**: Authenticates to Salesforce org using session ID
- **Metadata Retrieval**: Automatically retrieves:
  - Apex Classes
  - Lightning Web Components (LWC)
  - Aura Components
  - Apex Triggers
  - Custom Objects (Lightning types)

## Prerequisites

- VSCode 1.80.0 or higher
- Salesforce CLI (`sf`) installed and available in PATH
- Chrome extension for SIID Salesforce Session Manager

## Installation

### From Source

1. Navigate to the `vscode-extension` directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the extension:
   ```bash
   npm run compile
   ```
4. Press F5 in VSCode to launch the extension in debug mode

## Usage

1. Install the Chrome extension and this VSCode extension
2. Open VSCode (with or without a workspace)
3. Navigate to a Salesforce org in Chrome
4. Click the Chrome extension icon
5. The extension will:
   - Receive the session ID and instance URL
   - Check if current workspace is a Salesforce project
   - Create a new project if needed
   - Authenticate to the org
   - Retrieve metadata components

## How It Works

### URI Format

The Chrome extension opens a URI in this format:
```
siid://[sessionId]?instanceUrl=https://instance.salesforce.com
```

### Workflow

1. **Workspace Check**: Verifies if a workspace folder is open
2. **Project Detection**: Looks for `sfdx-project.json` file
3. **Project Creation**: Runs `sf project generate` if not a Salesforce project
4. **Authentication**: Executes `sf org login access-token` with the session ID
5. **Metadata Retrieval**: Runs `sf project retrieve start` for specified metadata types

## Troubleshooting

### Extension Not Activating

- Make sure the URI scheme `siid://` is registered
- Check VSCode developer tools for errors (Help > Toggle Developer Tools)

### Authentication Fails

- Verify Salesforce CLI is installed: `sf --version`
- Check that the session ID is valid
- Ensure instance URL is accessible

## License

[Add license information]
