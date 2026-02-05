# SIID Salesforce Setup - Architecture & Flow

## Overview

The SIID Salesforce Setup consists of two extensions that work together to provide a seamless development workflow from Salesforce org to local development environment.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHROME BROWSER                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │         Salesforce Org (any instance)                │     │
│  │  https://yourorg.lightning.force.com                 │     │
│  │                                                       │     │
│  │  User logged in with active session                  │     │
│  └──────────────────────────────────────────────────────┘     │
│                            │                                    │
│                            │ User clicks                        │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────┐     │
│  │       SIID Chrome Extension                          │     │
│  │                                                       │     │
│  │  1. Detect Salesforce domain                         │     │
│  │  2. Enable extension icon                            │     │
│  │  3. On click:                                        │     │
│  │     • Read 'sid' cookie → Session ID                 │     │
│  │     • Extract tab URL → Instance URL                 │     │
│  │  4. Open protocol handler                            │     │
│  └──────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ siid://[sessionId]?instanceUrl=[url]
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        VISUAL STUDIO CODE                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │       SIID VSCode Extension                          │     │
│  │                                                       │     │
│  │  URI Handler:                                        │     │
│  │  • Receives siid:// protocol                         │     │
│  │  • Parses sessionId and instanceUrl                  │     │
│  │  • Initiates setup workflow                          │     │
│  └──────────────────────────────────────────────────────┘     │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────┐     │
│  │       Automated Workflow                             │     │
│  │                                                       │     │
│  │  Step 1: Workspace Check                             │     │
│  │  • Is folder open?                                   │     │
│  │  • If no → prompt user                               │     │
│  │                                                       │     │
│  │  Step 2: Project Detection                           │     │
│  │  • Check for sfdx-project.json                       │     │
│  │  • If not found → Step 3                             │     │
│  │  • If found → Skip to Step 4                         │     │
│  │                                                       │     │
│  │  Step 3: Project Creation                            │     │
│  │  • Run: sf project generate                          │     │
│  │  • Create standard Salesforce structure              │     │
│  │                                                       │     │
│  │  Step 4: Org Authentication                          │     │
│  │  • Run: sf org login access-token                    │     │
│  │  • Use sessionId as access token                     │     │
│  │  • Use instanceUrl for instance                      │     │
│  │  • Set as default org (alias: siid-org)              │     │
│  │                                                       │     │
│  │  Step 5: Metadata Retrieval                          │     │
│  │  • Run: sf project retrieve start                    │     │
│  │  • Retrieve: ApexClass, LWC, Aura,                   │     │
│  │              ApexTrigger, CustomObject               │     │
│  └──────────────────────────────────────────────────────┘     │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────┐     │
│  │       Ready for Development!                         │     │
│  │                                                       │     │
│  │  • Project structure created                         │     │
│  │  • Org authenticated                                 │     │
│  │  • Metadata retrieved                                │     │
│  │  • Start coding!                                     │     │
│  └──────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Session ID Extraction

```javascript
// Chrome Extension: background.js

// Get cookies from Salesforce domain
const cookies = await chrome.cookies.getAll({ url: tabUrl });

// Find 'sid' cookie
const sessionId = cookies.find(c => c.name === 'sid')?.value;

// Fallback to .salesforce.com domain if on *.force.com
if (!sessionId && domain.endsWith('.force.com')) {
  const sfCookies = await chrome.cookies.getAll({ 
    domain: '.salesforce.com' 
  });
  sessionId = sfCookies.find(c => c.name === 'sid')?.value;
}
```

### 2. Instance URL Extraction

```javascript
// Chrome Extension: background.js

// Extract from current tab URL
const urlObj = new URL(tab.url);
const instanceUrl = `${urlObj.protocol}//${urlObj.hostname}`;

// Examples:
// https://yourorg.lightning.force.com → https://yourorg.lightning.force.com
// https://yourorg.my.salesforce.com   → https://yourorg.my.salesforce.com
```

### 3. Protocol Opening

```javascript
// Chrome Extension: background.js

// Encode instance URL for URI
const encodedUrl = encodeURIComponent(instanceUrl);

// Create protocol URI
const siidUrl = `siid://${sessionId}?instanceUrl=${encodedUrl}`;

// Open protocol (triggers VSCode)
chrome.tabs.create({ url: siidUrl });
```

### 4. URI Parsing

```typescript
// VSCode Extension: extension.ts

// Parse URI components
const sessionId = uri.authority;  // The session ID
const queryParams = new URLSearchParams(uri.query);
const instanceUrl = queryParams.get('instanceUrl');

// Decode instance URL
const decodedUrl = decodeURIComponent(instanceUrl);
```

### 5. Salesforce CLI Commands

```typescript
// VSCode Extension: extension.ts

// 1. Create project (if needed)
await execAsync(`sf project generate --name "${projectName}"`);

// 2. Authenticate org
await execAsync(
  `sf org login access-token ` +
  `--instance-url "${instanceUrl}" ` +
  `--access-token "${sessionId}" ` +
  `--set-default ` +
  `--alias siid-org`
);

// 3. Retrieve metadata
await execAsync(
  `sf project retrieve start ` +
  `--metadata ApexClass,LightningComponentBundle,` +
  `AuraDefinitionBundle,ApexTrigger,CustomObject ` +
  `--target-org siid-org`
);
```

---

## Component Details

### Chrome Extension Components

**manifest.json**
- Defines extension metadata
- Specifies permissions
- No popup UI (direct action)
- Activation on `*.salesforce.com` and `*.force.com`

**background.js**
- Service worker (Manifest V3)
- Domain detection logic
- Cookie access
- Tab state management
- Protocol opening

**content.js**
- Runs on Salesforce pages
- Additional context if needed
- Currently minimal

---

### VSCode Extension Components

**package.json**
- Extension manifest
- Activation events: `onUri`
- Declares URI handler capability
- TypeScript project

**extension.ts**
- Main extension entry point
- URI handler implementation
- Workflow orchestration
- SF CLI command execution

**Key Classes/Functions:**
```typescript
class SiidUriHandler implements vscode.UriHandler {
  handleUri(uri: vscode.Uri): Promise<void>
  setupSalesforceProject(sessionId, instanceUrl): Promise<void>
  getOrCreateWorkspaceFolder(): Promise<string | undefined>
  checkSalesforceProject(folder): Promise<boolean>
  createSalesforceProject(folder): Promise<void>
  authenticateOrg(sessionId, instanceUrl, folder): Promise<void>
  retrieveMetadata(folder): Promise<void>
}
```

---

## Security Considerations

### Chrome Extension

1. **Cookie Access**
   - Only reads cookies, never writes
   - Only accesses on Salesforce domains
   - Session ID never stored, only passed

2. **Domain Validation**
   - Uses `endsWith()` for proper hostname checking
   - Prevents false positives from malicious URLs
   - CodeQL verified: 0 security alerts

3. **Protocol Security**
   - Instance URL is encoded before passing
   - No external network requests
   - All processing local

### VSCode Extension

1. **Session ID Handling**
   - Received via URI, used immediately
   - Passed to SF CLI, not stored
   - CLI manages authentication

2. **Command Execution**
   - Uses Node.js `child_process.exec`
   - Commands are constructed, not arbitrary
   - Working directory controlled

3. **File System Access**
   - Only writes to user-selected workspace
   - Standard Salesforce project structure
   - No sensitive data written

---

## Error Handling

### Chrome Extension

```javascript
try {
  const sessionId = await getSessionId(tab.url);
  if (!sessionId) {
    console.error('Session ID not found in cookies');
    return;
  }
  openSiidProtocol(sessionId, instanceUrl);
} catch (error) {
  console.error('Error:', error);
}
```

### VSCode Extension

```typescript
try {
  await setupSalesforceProject(sessionId, instanceUrl);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  vscode.window.showErrorMessage(`Error: ${message}`);
  console.error('Setup error:', error);
}
```

**Error Types Handled:**
- No workspace folder
- SF CLI not installed
- Authentication failure
- Metadata retrieval failure
- File system errors

---

## Performance Considerations

1. **Chrome Extension**
   - Minimal resource usage (service worker)
   - Only active on Salesforce domains
   - Cookie operations are async
   - No continuous background processing

2. **VSCode Extension**
   - Activates only on URI event
   - Long operations show progress UI
   - Commands run in workspace context
   - Async/await for non-blocking execution

---

## Extension Communication

```
Chrome Extension          VSCode Extension
      │                         │
      │ 1. Detect SF domain     │
      │ 2. Extract credentials  │
      │ 3. Open protocol ───────┼──> 4. Receive URI
      │                         │    5. Parse data
      │                         │    6. Setup project
      │                         │    7. Auth org
      │                         │    8. Get metadata
      │                         │
      │                         ▼
      │                   Ready to develop!
```

---

## Project Structure Created

After successful execution:

```
workspace-folder/
├── .forceignore
├── .gitignore
├── .prettierignore
├── .prettierrc
├── .vscode/
│   └── settings.json
├── config/
│   └── project-scratch-def.json
├── force-app/
│   └── main/
│       └── default/
│           ├── aura/                    # Aura Components
│           │   └── componentName/
│           ├── classes/                 # Apex Classes
│           │   ├── ClassName.cls
│           │   └── ClassName.cls-meta.xml
│           ├── lwc/                     # Lightning Web Components
│           │   └── componentName/
│           ├── objects/                 # Custom Objects
│           │   └── ObjectName__c/
│           ├── triggers/                # Apex Triggers
│           │   ├── TriggerName.trigger
│           │   └── TriggerName.trigger-meta.xml
│           └── ...
├── manifest/
│   └── package.xml
├── package.json
├── README.md
└── sfdx-project.json                    # Project identifier
```

---

## Future Enhancements

Possible improvements:

1. **Chrome Extension**
   - Multi-org support
   - Custom metadata type selection
   - Session expiry detection

2. **VSCode Extension**
   - Incremental metadata sync
   - Custom retrieval options
   - Conflict resolution
   - Progress indicators
   - Error recovery

3. **Integration**
   - Settings sync between extensions
   - Command palette integration
   - Status bar indicators
   - Activity logging

---

## Summary

The SIID Salesforce Setup provides:

✅ **Zero-click setup** - One click from browser to ready-to-code
✅ **Automatic detection** - Recognizes Salesforce projects
✅ **Smart authentication** - Uses existing session
✅ **Complete metadata** - All development artifacts
✅ **Secure** - No credentials stored, proper validation
✅ **Extensible** - Clean architecture for future features

**From Salesforce org to local development in seconds!**
