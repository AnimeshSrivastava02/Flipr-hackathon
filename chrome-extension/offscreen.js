// offscreen.js - hidden page to capture audio and send to backend
let mediaRecorder = null;
const BACKEND_URL = 'http://127.0.0.1:8000/upload_chunk';

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === 'START_RECORDING') {
    await startRecording(msg.streamId);
  } else if (msg.type === 'STOP_RECORDING') {
    stopRecording();
  }
});

async function startRecording(streamId) {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    console.warn('Already recording');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: false
    });

    // Always prefer Opus
    let mimeType = '';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      mimeType = 'audio/webm';
      alert('audio/webm;codecs=opus not supported, using audio/webm.');
    } else {
      alert('No supported audio recording format found!');
      return;
    }

    mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size === 0) return;
      const blob = e.data;
      const formData = new FormData();
      formData.append('file', blob, `chunk-${Date.now()}.webm`);
      try {
        const res = await fetch(BACKEND_URL, { method: 'POST', body: formData });
        const json = await res.json();
        chrome.runtime.sendMessage({ type: 'TRANSCRIPT', text: json.transcript || '[No transcript]' });
      } catch (error) {
        console.error('Upload error', error);
      }
    };

    mediaRecorder.onstop = function() {
      stream.getTracks().forEach(t => t.stop());
      mediaRecorder = null;
      console.log('MediaRecorder stopped and cleaned up');
    };

    mediaRecorder.start(5000); // 5-second chunks
    console.log('Recording started, mimeType:', mimeType);
  } catch (err) {
    console.error('Failed to start recording', err);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    console.log('Recording stopped');
  }
}
