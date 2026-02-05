// Popup script for the Chrome extension

document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const infoDiv = document.getElementById('info');
  const errorDiv = document.getElementById('error');
  const errorMessage = document.getElementById('errorMessage');
  const domainSpan = document.getElementById('domain');
  const sessionIdSpan = document.getElementById('sessionId');
  const openSiidBtn = document.getElementById('openSiid');
  const copySessionIdBtn = document.getElementById('copySessionId');
  
  let currentSessionId = null;
  
  // Function to show error
  function showError(message) {
    statusDiv.style.display = 'none';
    infoDiv.style.display = 'none';
    errorDiv.style.display = 'block';
    errorMessage.textContent = message;
    openSiidBtn.style.display = 'none';
    copySessionIdBtn.style.display = 'none';
  }
  
  // Function to show info
  function showInfo(domain, sessionId) {
    statusDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    infoDiv.style.display = 'block';
    domainSpan.textContent = domain;
    sessionIdSpan.textContent = sessionId;
    openSiidBtn.style.display = 'block';
    copySessionIdBtn.style.display = 'block';
    currentSessionId = sessionId;
  }
  
  // Get session ID from background script
  try {
    chrome.runtime.sendMessage({ action: 'getSessionId' }, (response) => {
      if (chrome.runtime.lastError) {
        showError('Error communicating with extension');
        return;
      }
      
      if (response.error) {
        showError(response.error);
        return;
      }
      
      if (response.sessionId) {
        const url = new URL(response.url);
        showInfo(url.hostname, response.sessionId);
      } else {
        showError('Could not retrieve session ID');
      }
    });
  } catch (error) {
    showError('An error occurred: ' + error.message);
  }
  
  // Open SIID button click handler
  openSiidBtn.addEventListener('click', () => {
    if (currentSessionId) {
      chrome.runtime.sendMessage({ 
        action: 'openSiid', 
        sessionId: currentSessionId 
      }, (response) => {
        if (response && response.success) {
          // Show feedback
          openSiidBtn.textContent = 'Opening...';
          setTimeout(() => {
            openSiidBtn.textContent = 'Open in SIID';
          }, 1000);
        }
      });
    }
  });
  
  // Copy session ID button click handler
  copySessionIdBtn.addEventListener('click', async () => {
    if (currentSessionId) {
      try {
        await navigator.clipboard.writeText(currentSessionId);
        const originalText = copySessionIdBtn.textContent;
        copySessionIdBtn.textContent = 'Copied!';
        copySessionIdBtn.style.background = '#28a745';
        copySessionIdBtn.style.color = 'white';
        copySessionIdBtn.style.borderColor = '#28a745';
        
        setTimeout(() => {
          copySessionIdBtn.textContent = originalText;
          copySessionIdBtn.style.background = '';
          copySessionIdBtn.style.color = '';
          copySessionIdBtn.style.borderColor = '';
        }, 1500);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  });
});
