# SIID Salesforce Setup - Installation & Testing Guide

This guide walks you through setting up and testing the complete Chrome + VSCode extension solution.

## Prerequisites

### Required Software

1. **Google Chrome** (with Manifest V3 support)
   - Recent version recommended
   
2. **Visual Studio Code** (1.80.0 or higher)
   - Download from: https://code.visualstudio.com/

3. **Salesforce CLI**
   ```bash
   # Install using npm
   npm install -g @salesforce/cli
   
   # Verify installation
   sf --version
   ```

4. **Node.js & npm** (for VSCode extension development)
   ```bash
   node --version  # Should be v18 or higher
   npm --version
   ```

### Salesforce Access

- Access to a Salesforce org (Developer Edition, Sandbox, or Production)
- Admin or equivalent permissions to view metadata

---

## Part 1: Chrome Extension Installation

### Step 1: Load the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`

2. Enable **Developer mode** (toggle in top right corner)

3. Click **Load unpacked**

4. Navigate to and select:
   ```
   /path/to/siid-salesforce-setup/chrome-extension/
   ```

5. The extension should appear in your extensions list

6. (Optional) Pin the extension to your toolbar for easy access

### Step 2: Verify Chrome Extension

1. Visit any website (e.g., google.com)
   - Extension icon should be **grayed out/disabled**

2. Navigate to a Salesforce org
   - Log in to: https://login.salesforce.com
   - Or your org's URL: https://yourorg.lightning.force.com

3. Extension icon should become **enabled/colored**

4. Click the extension icon
   - Should attempt to open: `siid://...`
   - Browser may show "Open VSCode?" or similar prompt

✅ Chrome extension is working if icon state changes correctly!

---

## Part 2: VSCode Extension Installation

### Step 1: Build the Extension

```bash
cd /path/to/siid-salesforce-setup/vscode-extension/

# Install dependencies
npm install

# Compile TypeScript to JavaScript
npm run compile

# Verify compilation
ls -la out/extension.js
```

### Step 2: Load Extension in VSCode (Development Mode)

#### Option A: Debug Mode (Recommended for Testing)

1. Open VSCode
2. Open the `vscode-extension` folder in VSCode:
   ```
   File → Open Folder → Select vscode-extension/
   ```
3. Press **F5** to launch Extension Development Host
4. A new VSCode window will open with the extension loaded

#### Option B: Package and Install

```bash
# Install vsce if not already installed
npm install -g @vscode/vsce

# Package the extension
cd vscode-extension
vsce package

# This creates: siid-salesforce-vscode-1.0.0.vsix
```

Then in VSCode:
1. Go to Extensions view (Ctrl+Shift+X or Cmd+Shift+X)
2. Click the `...` menu → Install from VSIX
3. Select the generated `.vsix` file

---

## Part 3: Testing the Complete Workflow

### Test Case 1: Basic URI Handling

**Setup:**
1. Have VSCode open (any folder or no folder)
2. Have Chrome open with Salesforce org

**Steps:**
1. In Chrome, navigate to Salesforce org
2. Click the SIID extension icon
3. Browser should show protocol handler prompt
4. Click "Open VSCode" or "Always allow"

**Expected Result:**
- VSCode activates and shows notification: "Starting Salesforce setup..."
- Check VSCode notifications for progress

---

### Test Case 2: New Project Creation

**Setup:**
1. Create a new empty folder: `mkdir ~/test-siid-project`
2. Open VSCode with NO workspace open

**Steps:**
1. In Chrome, click SIID extension on Salesforce org
2. When prompted, select the empty folder as workspace
3. VSCode will:
   - Create Salesforce project structure
   - Authenticate to org
   - Retrieve metadata

**Expected Result:**
```
test-siid-project/
├── sfdx-project.json
├── force-app/
│   └── main/
│       └── default/
│           ├── classes/         # Apex Classes
│           ├── lwc/             # Lightning Web Components
│           ├── aura/            # Aura Components
│           ├── triggers/        # Apex Triggers
│           └── objects/         # Custom Objects
└── config/
```

**Verify:**
```bash
cd ~/test-siid-project

# Check project was created
cat sfdx-project.json

# Check org is authenticated
sf org list

# Should show "siid-org" as default org
```

---

### Test Case 3: Existing Project

**Setup:**
1. Have existing Salesforce project open in VSCode
2. Or use project from Test Case 2

**Steps:**
1. In Chrome, click SIID extension on same or different org
2. VSCode will:
   - Detect existing project (skip creation)
   - Re-authenticate to org
   - Retrieve/update metadata

**Expected Result:**
- No project creation step
- Existing metadata updated
- Org re-authenticated

---

### Test Case 4: Multiple Metadata Types

**Verify all metadata types are retrieved:**

```bash
cd your-project-folder

# Check for Apex Classes
ls -la force-app/main/default/classes/

# Check for LWC
ls -la force-app/main/default/lwc/

# Check for Aura
ls -la force-app/main/default/aura/

# Check for Triggers
ls -la force-app/main/default/triggers/

# Check for Objects
ls -la force-app/main/default/objects/
```

---

## Part 4: Troubleshooting

### Issue: Chrome Extension Not Working

**Symptoms:**
- Icon always grayed out
- Icon doesn't respond to clicks

**Solutions:**
1. Check that you're on a Salesforce domain (*.salesforce.com or *.force.com)
2. Refresh the Salesforce page
3. Check Chrome console for errors (F12 → Console)
4. Reload the extension in chrome://extensions/

---

### Issue: VSCode Not Opening

**Symptoms:**
- Browser shows error when clicking extension
- Nothing happens when clicking extension

**Solutions:**
1. Verify VSCode extension is installed and active
2. Check VSCode is set as default handler for `siid://` protocol:
   ```bash
   # On Linux
   xdg-settings set default-url-scheme-handler siid code-url-handler.desktop
   
   # On macOS
   # VSCode should register automatically
   
   # On Windows
   # Check Registry for siid:// protocol handler
   ```
3. Try launching VSCode manually first, then clicking Chrome extension

---

### Issue: Authentication Fails

**Symptoms:**
- "Failed to authenticate org" error
- Session ID not accepted

**Solutions:**
1. Verify Salesforce CLI is installed:
   ```bash
   sf --version
   ```
2. Check session ID is being passed correctly:
   - Open VSCode Developer Tools (Help → Toggle Developer Tools)
   - Check console for session ID length
3. Try manually authenticating:
   ```bash
   sf org login web --set-default --alias test-org
   ```
4. Session might have expired - log out and back into Salesforce

---

### Issue: Metadata Retrieval Fails

**Symptoms:**
- "Metadata retrieval completed with warnings"
- Missing metadata folders

**Solutions:**
1. Check that org has the metadata types:
   ```bash
   sf org list metadata --metadata-type ApexClass
   ```
2. Some orgs might not have all metadata types (normal)
3. Check SF CLI version:
   ```bash
   sf --version
   # Should be 2.0.0 or higher
   ```
4. Try manual retrieval:
   ```bash
   sf project retrieve start --metadata ApexClass
   ```

---

### Issue: Permission Errors

**Symptoms:**
- Cannot create project
- Cannot write files

**Solutions:**
1. Check folder permissions:
   ```bash
   ls -la /path/to/workspace
   ```
2. Try running VSCode with elevated permissions
3. Check disk space is available

---

## Part 5: Debugging

### Chrome Extension Debugging

1. Go to `chrome://extensions/`
2. Find "SIID Salesforce Session Manager"
3. Click "background.html" or "service worker" link
4. View console logs for debugging info

**Key Log Messages:**
```
Extension icon clicked on tab: [url]
Found sid cookie: [sessionId]
Instance URL: [url]
Opening SIID URL: siid://...
```

---

### VSCode Extension Debugging

1. When running in debug mode (F5), console logs appear in Debug Console
2. Check Output panel: View → Output → Select "Extension Host"

**Key Log Messages:**
```
SIID Salesforce extension is now active
Received URI: siid://...
Creating Salesforce project...
Authenticating Salesforce org...
Retrieving metadata from org...
```

---

### Command-Line Testing

Test individual components:

```bash
# Test SF CLI
sf --version
sf org list

# Test project creation
mkdir test-project
cd test-project
sf project generate --name test-project

# Test authentication (use real session ID)
sf org login access-token \
  --instance-url "https://yourorg.salesforce.com" \
  --access-token "YOUR_SESSION_ID" \
  --alias test-org

# Test metadata retrieval
sf project retrieve start --metadata ApexClass --target-org test-org
```

---

## Part 6: Verification Checklist

### Chrome Extension
- [ ] Extension loads without errors
- [ ] Icon state changes on Salesforce domains
- [ ] Click opens protocol handler
- [ ] Session ID is extracted correctly
- [ ] Instance URL is extracted correctly

### VSCode Extension
- [ ] Extension activates in VSCode
- [ ] URI handler receives data
- [ ] Project detection works
- [ ] Project creation works (if needed)
- [ ] Org authentication succeeds
- [ ] Metadata retrieval completes

### End-to-End
- [ ] One-click from Chrome to VSCode
- [ ] Complete project setup automated
- [ ] All metadata types retrieved
- [ ] Ready to start development

---

## Part 7: Next Steps

Once everything is working:

1. **Start Developing**
   - Modify Apex classes, LWC components, etc.
   - Use VSCode Salesforce extensions for code intelligence

2. **Deploy Changes**
   ```bash
   sf project deploy start --source-dir force-app/
   ```

3. **Retrieve Updates**
   ```bash
   sf project retrieve start --metadata ApexClass,LightningComponentBundle
   ```

---

## Support

If you encounter issues not covered in this guide:

1. Check the console logs (both Chrome and VSCode)
2. Verify all prerequisites are installed
3. Try the manual command-line steps to isolate the issue
4. Open an issue on the GitHub repository with:
   - Error messages
   - Console logs
   - Steps to reproduce

---

## Summary

You now have a complete automated workflow:

```
Chrome (Salesforce) → Click → VSCode (Project Setup) → Start Coding!
```

No manual project setup, no manual authentication, no manual metadata retrieval!
