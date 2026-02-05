// Content script that runs on Salesforce pages

// Function to get cookies from the current page
function getCookieValue(name) {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
}

// Check if we're on a Salesforce domain
const hostname = window.location.hostname;
// Check if hostname ends with salesforce.com or force.com to prevent false positives
const isSalesforce = hostname.endsWith('.salesforce.com') || 
                     hostname === 'salesforce.com' ||
                     hostname.endsWith('.force.com') || 
                     hostname === 'force.com';

if (isSalesforce) {
  console.log('SIID Extension: Running on Salesforce domain:', hostname);
  
  // Try to get session ID from cookies
  const sessionId = getCookieValue('sid');
  
  if (sessionId) {
    console.log('SIID Extension: Found session ID in cookies');
  } else {
    console.log('SIID Extension: Session ID not found in cookies');
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkDomain') {
    sendResponse({ 
      isSalesforce: isSalesforce,
      hostname: hostname
    });
  }
});
