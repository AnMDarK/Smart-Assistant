const recordBtn = document.getElementById("recordBtn");
const statusEl  = document.getElementById("status");
const tasksEl   = document.getElementById("tasks");

let mediaRecorder;
let chunks = [];

// Escolhe o tipo de áudio mais compatível (iOS precisa de mp4/opus em alguns casos)
function pickMime() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/webm",
    "audio/ogg"
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return ""; // deixa o navegador escolher
}

recordBtn.addEventListener("click", async () => {
  try {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      await startRecording();
    } else {
      stopRecording();
    }
  } catch (err) {
    alert("Erro ao acessar o microfone: " + err.message);
  }
});

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = pickMime();
  mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
  chunks = [];

  mediaRecorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  mediaRecorder.onstop = () => {
    const type = mediaRecorder.mimeType || "audio/webm";
    const blob = new Blob(chunks, { type });
    sendAudio(blob);
  };

  mediaRecorder.start();
  recordBtn.textContent = "⏹ Parar";
  statusEl.textContent = "🎙️ Gravando...";
}

function stopRecording() {
  mediaRecorder.stop();
  recordBtn.textContent = "🎤 Gravar Tarefa";
  statusEl.textContent = "Processando...";
}

async function sendAudio(blob) {
  const fd = new FormData();
  fd.append("audio", blob, "voz.webm");

  const resp = await fetch("/process-audio", { method: "POST", body: fd });
  if (!resp.ok) {
    statusEl.textContent = "Falha ao processar o áudio.";
    return;
  }
  const data = await resp.json();
  statusEl.textContent = data.mensagem_ao_usuario || "Ok!";

  renderTasks(data.tarefas || []);
  trySpeak(data.tarefas);
}

function renderTasks(tarefas) {
  tasksEl.innerHTML = "";
  tarefas.forEach((t, idx) => {
    const card = document.createElement("div");
    card.className = "task";

    const left = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = t.titulo || "Tarefa";
    const desc = document.createElement("p");
    const when = `${t.data} • ${t.hora_inicio} • ${t.duracao_minutos || 30}min • ${t.lista || "pessoal"}`;
    desc.textContent = when;
    left.appendChild(title);
    left.appendChild(desc);

    const actions = document.createElement("div");
    actions.className = "actions";

    // Botão Calendário (gera download .ics)
    const btnICS = document.createElement("button");
    btnICS.className = "small";
    btnICS.textContent = "Adicionar ao calendário";
    btnICS.onclick = () => downloadICS(t);

    // Botão Lembrete simples (enquanto a aba estiver aberta)
    const btnRemind = document.createElement("button");
    btnRemind.className = "small";
    btnRemind.textContent = "Lembrar";
    btnRemind.onclick = () => scheduleReminder(t);

    actions.appendChild(btnICS);
    actions.appendChild(btnRemind);

    card.appendChild(left);
    card.appendChild(actions);
    tasksEl.appendChild(card);
  });
}

function downloadICS(task) {
  if (!task?.ics) return;
  const blob = new Blob([task.ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(task.titulo || "tarefa").replace(/\s+/g,"_")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Lembrete (simples) usando Notifications API enquanto a aba está aberta
async function scheduleReminder(task) {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      alert("Permita notificações para ativar lembretes.");
      return;
    }
    // agenda para o horário da tarefa (ou 1min antes, se houver lembrete)
    const dateStr = `${task.data}T${task.hora_inicio}:00`;
    let when = new Date(dateStr);
    const deltaMin = (task.lembretes_minutos_antes?.[0]) || 1;
    when = new Date(when.getTime() - deltaMin * 60000);

    const ms = when.getTime() - Date.now();
    if (ms <= 0) {
      new Notification("Lembrete", { body: task.titulo || "Tarefa" });
      return;
    }
    setTimeout(() => {
      new Notification("Lembrete", { body: task.titulo || "Tarefa" });
    }, ms);

    alert(`Lembrete agendado para ${when.toLocaleString()}. (Funciona com a aba aberta)`);
  } catch (e) {
    alert("Não foi possível agendar a notificação.");
  }
}

// Voz: lê as tarefas para o usuário
function trySpeak(tarefas) {
  if (!tarefas?.length || !("speechSynthesis" in window)) return;
  const texto = "Suas tarefas são: " + tarefas.map(t => `${t.titulo} em ${t.data} às ${t.hora_inicio}`).join(", ");
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "pt-BR";
  window.speechSynthesis.speak(u);
}
