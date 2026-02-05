# SIID Chrome Extension - New Behavior

## 🎯 Direct Click Action (No UI)

### Before (Old Behavior)
```
User on Salesforce → Clicks Extension Icon → Popup Opens
  ↓
View Session Info in Popup
  ↓
Click "Open in SIID" Button
  ↓
Protocol Opens: siid://session-id
```

### After (New Behavior) ✨
```
User on Salesforce → Clicks Extension Icon → Protocol Opens Immediately!
                                              ↓
                                         siid://session-id
                                         (No popup, no UI)
```

## 🔧 Key Changes

### Removed
- ❌ popup.html
- ❌ popup.js
- ❌ popup.css
- ❌ PREVIEW.html
- ❌ `default_popup` from manifest.json

### Added
- ✅ `chrome.action.onClicked` listener in background.js
- ✅ Direct protocol launch on click

## 🎨 Icon States

### On Salesforce Domains (*.salesforce.com, *.force.com)
```
🟢 Icon: ENABLED (Colored)
Click Action: Opens siid://[session-id] immediately
```

### On Other Domains
```
⚫ Icon: DISABLED (Grayed out)
Click Action: Nothing happens (icon is disabled)
```

## 🚀 Usage Flow

1. **Navigate to Salesforce**
   - Example: https://yourorg.lightning.force.com
   
2. **Icon Automatically Enables**
   - Extension detects Salesforce domain
   - Icon becomes colored and clickable
   
3. **Click Once**
   - Single click on extension icon
   
4. **Instant Action**
   - Session ID extracted from cookies
   - Protocol opens: `siid://00D5g000008kI2F!AQcAQ...`
   - No popup, no intermediate steps

## 🔐 Security

- ✅ 0 CodeQL security alerts
- ✅ Proper hostname validation (endsWith check)
- ✅ Minimal permissions
- ✅ No external requests

## 📋 Technical Details

### Session ID Extraction Logic
1. Check current domain cookies for 'sid' cookie
2. If not found and on *.force.com, fallback to .salesforce.com domain
3. Pass session ID to `siid://` protocol handler

### Domain Detection
- Uses `hostname.endsWith('.salesforce.com')` pattern
- Prevents false positives (e.g., evil.com?redirect=salesforce.com)
- Automatically enables/disables icon based on current tab

### Click Handler
```javascript
chrome.action.onClicked.addListener(async (tab) => {
  if (!isSalesforceDomain(tab.url)) return;
  
  const sessionId = await getSessionId(tab.url);
  if (sessionId) {
    openSiidProtocol(sessionId); // Opens siid://[session-id]
  }
});
```

## 🧪 Testing

1. Load extension in Chrome (chrome://extensions/)
2. Navigate to any Salesforce org
3. Verify icon is enabled (colored)
4. Click icon once
5. Protocol should open immediately
6. Check service worker logs for debug info

## 📝 Files Modified

- `manifest.json` - Removed default_popup
- `background.js` - Added onClicked listener
- `README.md` - Updated documentation
- `INSTALL.md` - Updated usage instructions
- `TESTING.html` - Updated test procedures

## 📝 Files Deleted

- `popup.html` - No longer needed
- `popup.js` - No longer needed
- `popup.css` - No longer needed
- `PREVIEW.html` - No longer relevant
