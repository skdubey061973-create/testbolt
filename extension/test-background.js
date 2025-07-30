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
    const response = await fetch('https://fce2901e-6020-4c23-97dc-13c7fd7f97c3-00-15wzli1eenkr6.picard.replit.dev/api/health');
    console.log('API health check:', response.ok ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.error('API connection failed:', error);
  }
}

testConnection();