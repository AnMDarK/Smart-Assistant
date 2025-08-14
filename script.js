let mediaRecorder;
let audioChunks = [];

document.getElementById('recordBtn').addEventListener('click', async () => {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    startRecording();
  } else if (mediaRecorder.state === 'recording') {
    stopRecording();
  }
});

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.addEventListener("dataavailable", event => {
    audioChunks.push(event.data);
  });

  mediaRecorder.addEventListener("stop", () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    sendAudio(audioBlob);
  });

  mediaRecorder.start();
  document.getElementById('recordBtn').textContent = "⏹ Parar Gravação";
}

function stopRecording() {
  mediaRecorder.stop();
  document.getElementById('recordBtn').textContent = "🎤 Gravar Tarefa";
}

async function sendAudio(audioBlob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "gravacao.wav");

  const response = await fetch("/api/process-audio", {
    method: "POST",
    body: formData
  });

  const result = await response.json();
  document.getElementById('responseText').textContent = JSON.stringify(result, null, 2);
}
