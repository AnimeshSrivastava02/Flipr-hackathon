console.log("Popup JS loaded");

document.getElementById('startBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'popup-start' });
  document.getElementById('status').innerText = 'Status: Recording...';
});

document.getElementById('stopBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'popup-stop' });
  document.getElementById('status').innerText = 'Status: Stopped';
});

chrome.runtime.onMessage.addListener((msg) => {
  console.log("Received message in popup:", msg);
  if (msg.type === 'TRANSCRIPT') {
    const el = document.getElementById('transcript');
    // Support both .text and .transcript (robust)
    el.innerText += '\n' + (msg.text || msg.transcript || '[No text]');
  }
});
