// Background service worker for the Chrome extension

// Function to check if the URL is a Salesforce domain
function isSalesforceDomain(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    // Check if hostname ends with salesforce.com or force.com to prevent false positives
    return hostname.endsWith('.salesforce.com') || 
           hostname === 'salesforce.com' ||
           hostname.endsWith('.force.com') || 
           hostname === 'force.com';
  } catch (e) {
    return false;
  }
}

// Function to get session ID from cookies
async function getSessionId(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Extract the instance identifier (e.g., 'co1754479384179' from 'co1754479384179.lightning.force.com')
    const instanceMatch = hostname.match(/^([^.]+)\./);
    const instanceId = instanceMatch ? instanceMatch[1] : null;
    
    console.log('Looking for sid cookie for instance:', instanceId);
    
    // Priority order for trying different domains:
    // 1. .my.salesforce.com (preferred for SF CLI)
    // 2. .lightning.force.com (Lightning Experience)
    // 3. .file.force.com (Files)
    // 4. Current domain
    
    let sessionId = null;
    const domainsToTry = [];
    
    if (instanceId) {
      // Construct URLs for each domain to try
      domainsToTry.push(
        `https://${instanceId}.my.salesforce.com`,
        `https://${instanceId}.lightning.force.com`,
        `https://${instanceId}.file.force.com`
      );
    }
    
    // Add current URL as fallback
    domainsToTry.push(url);
    
    // Try each domain in order
    for (const domainUrl of domainsToTry) {
      console.log('Trying to get sid cookie from:', domainUrl);
      const cookies = await chrome.cookies.getAll({ url: domainUrl });
      
      for (const cookie of cookies) {
        if (cookie.name === 'sid') {
          sessionId = cookie.value;
          console.log('Found sid cookie from', domainUrl, ':', sessionId);
          return sessionId;
        }
      }
    }
    
    console.log('No sid cookie found in any domain');
    return null;
  } catch (error) {
    console.error('Error getting session ID:', error);
    return null;
  }
}

// Function to open the SIID IDE with session ID and instance URL
function openSiidIDE(sessionId, instanceUrl) {
  if (!sessionId) {
    console.error('No session ID provided');
    return;
  }
  
  if (!instanceUrl) {
    console.error('No instance URL provided');
    return;
  }
  
  // Create SIID URL with extension ID
  // Format: siid://publisher.extension-name/path?sessionId=value&instanceUrl=value
  // Both parameters in query string, not in authority
  const encodedSessionId = encodeURIComponent(sessionId);
  const encodedInstanceUrl = encodeURIComponent(instanceUrl);
  const siidUrl = `siid://siid.siid-salesforce-vscode/setup?sessionId=${encodedSessionId}&instanceUrl=${encodedInstanceUrl}`;
  console.log('Opening SIID URL:', siidUrl);
  
  // Open the protocol handler URL
  chrome.tabs.create({ url: siidUrl }, (tab) => {
    if (chrome.runtime.lastError) {
      console.error('Error opening SIID protocol:', chrome.runtime.lastError);
    }
  });
}

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSessionId') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs.length === 0) {
        sendResponse({ error: 'No active tab found' });
        return;
      }
      
      const currentTab = tabs[0];
      const url = currentTab.url;
      
      if (!isSalesforceDomain(url)) {
        sendResponse({ error: 'Not a Salesforce domain' });
        return;
      }
      
      const sessionId = await getSessionId(url);
      
      if (sessionId) {
        sendResponse({ sessionId: sessionId, url: url });
      } else {
        sendResponse({ error: 'Session ID not found' });
      }
    });
    
    return true; // Required for async response
  }
  
  if (request.action === 'openSiid') {
    openSiidIDE(request.sessionId, request.instanceUrl);
    sendResponse({ success: true });
    return true;
  }
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked on tab:', tab.url);
  
  // Check if we're on a Salesforce domain
  if (!isSalesforceDomain(tab.url)) {
    console.log('Not a Salesforce domain, ignoring click');
    return;
  }
  
  // Get session ID from cookies
  const sessionId = await getSessionId(tab.url);
  
  if (sessionId) {
    console.log('Session ID found, opening SIID IDE');
    
    // Extract instance URL (up to .com) from the current tab URL
    try {
      const urlObj = new URL(tab.url);
      const hostname = urlObj.hostname;
      
      // Construct the instance URL (protocol + hostname)
      const instanceUrl = `${urlObj.protocol}//${hostname}`;
      console.log('Instance URL:', instanceUrl);
      
      openSiidIDE(sessionId, instanceUrl);
    } catch (error) {
      console.error('Error extracting instance URL:', error);
    }
  } else {
    console.error('Session ID not found in cookies');
  }
});

// Listen for tab updates to enable/disable extension icon
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (isSalesforceDomain(tab.url)) {
      chrome.action.enable(tabId);
    } else {
      chrome.action.disable(tabId);
    }
  }
});

// Listen for tab activation to enable/disable extension icon
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      if (isSalesforceDomain(tab.url)) {
        chrome.action.enable(activeInfo.tabId);
      } else {
        chrome.action.disable(activeInfo.tabId);
      }
    }
  });
});

console.log('SIID Salesforce Session Manager background script loaded');
