let mediaRecorder;
let audioChunks = [];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "start-mic-recording") {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        audioChunks = [];

        const base64Audio = await blobToBase64(audioBlob);
        await fetch("http://127.0.0.1:8000/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64Audio })
        });
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 60000); // stop after 60 sec
    }).catch(err => {
      console.error("Mic access denied:", err);
    });
  }

  if (msg.action === "stop-mic-recording" && mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
  }
});

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(blob);
  });
}