// Simple test background script
console.log('AutoJobr background script loaded successfully');

// Set up basic event listeners
chrome.runtime.onInstalled.addListener(() => {
  console.log('AutoJobr extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  sendResponse({success: true});
  return true;
});

// Test API connection
async function testConnection() {
  try {
    const response = await fetch('https://cf942c1a-8aa1-4eb6-b16c-28a387fd4b1e-00-feprbstml9g6.worf.replit.dev/api/health');
    console.log('API health check:', response.ok ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.error('API connection failed:', error);
  }
}

testConnection();