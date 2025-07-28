let recorderTabId = null;

document.getElementById("start").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  recorderTabId = tab.id;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: startRecording
  });
  document.getElementById("status").textContent = "🎙️ Recording started...";
});

document.getElementById("stop").addEventListener("click", () => {
  if (!recorderTabId) return;
  chrome.tabs.sendMessage(recorderTabId, { action: "stop-recording" });
  document.getElementById("status").textContent = "✅ Sent stop signal.";
});

// This is injected into the page:
function startRecording() {
  if (window.__recorderActive) return; // Avoid duplicates
  window.__recorderActive = true;

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const base64 = await blobToBase64(blob);

      const res = await fetch("http://127.0.0.1:8000/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64 })
      });

      if (res.ok) {
        const data = await res.json();
        console.log("✅ Transcription Response:", data);
        alert("✅ Transcription complete. Check console or backend.");
      } else {
        console.error("❌ Backend error");
        alert("❌ Error from backend");
      }

      window.__recorderActive = false;
    };

    mediaRecorder.start();
    window.__mediaRecorder = mediaRecorder;
  }).catch(err => {
    alert("❌ Mic access failed. Check permissions.");
    console.error(err);
    window.__recorderActive = false;
  });

  function blobToBase64(blob) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "stop-recording" && window.__mediaRecorder) {
      window.__mediaRecorder.stop();
    }
  });
}
