// background.js - MV3 service worker for tab audio capture with offscreen document

const OFFSCREEN_URL = 'offscreen.html';
let isRecording = false;

async function setupOffscreen() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (!contexts || contexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ['USER_MEDIA'],
      justification: 'Audio transcription needs hidden page.'
    });
  }
}

async function startCapture(tabId) {
  if (isRecording) {
    console.warn('Already recording (background)');
    return;
  }
  await setupOffscreen();
  try {
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
    chrome.runtime.sendMessage({ type: 'START_RECORDING', streamId });
    isRecording = true;
  } catch (err) {
    console.error('Failed to get media stream ID:', err);
  }
}

async function stopCapture() {
  if (!isRecording) return;
  chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
  isRecording = false;
}

// Listen for popup commands (from popup.js)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'popup-start') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) startCapture(tabs[0].id);
    });
  } else if (msg.action === 'popup-stop') {
    stopCapture();
  }
  // No async response
});
