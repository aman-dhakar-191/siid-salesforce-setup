// Background service worker for the Chrome extension

// Function to check if the URL is a Salesforce domain
function isSalesforceDomain(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    return hostname.includes('salesforce.com') || hostname.includes('force.com');
  } catch (e) {
    return false;
  }
}

// Function to get session ID from cookies
async function getSessionId(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Try to get cookies from the current domain
    const cookies = await chrome.cookies.getAll({ url: url });
    
    // Look for 'sid' cookie
    let sessionId = null;
    
    for (const cookie of cookies) {
      if (cookie.name === 'sid') {
        sessionId = cookie.value;
        console.log('Found sid cookie:', sessionId);
        break;
      }
    }
    
    // If not found, try to get from my.salesforce.com domain
    if (!sessionId && domain.includes('lightning.force.com')) {
      const mySalesforceCookies = await chrome.cookies.getAll({ 
        domain: '.salesforce.com' 
      });
      
      for (const cookie of mySalesforceCookies) {
        if (cookie.name === 'sid') {
          sessionId = cookie.value;
          console.log('Found sid cookie from .salesforce.com:', sessionId);
          break;
        }
      }
    }
    
    return sessionId;
  } catch (error) {
    console.error('Error getting session ID:', error);
    return null;
  }
}

// Function to open the SIID protocol with session ID
function openSiidProtocol(sessionId) {
  if (!sessionId) {
    console.error('No session ID provided');
    return;
  }
  
  const siidUrl = `siid://${sessionId}`;
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
    openSiidProtocol(request.sessionId);
    sendResponse({ success: true });
    return true;
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
