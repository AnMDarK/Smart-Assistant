
// app.js - protótipo frontend
const recordBtn = document.getElementById('recordBtn');
const statusEl = document.getElementById('status');
const jsonOutput = document.getElementById('jsonOutput');
const listsContainer = document.getElementById('listsContainer');

let mediaRecorder;
let audioChunks = [];

async function initRecorder(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.addEventListener('dataavailable', e => {
      audioChunks.push(e.data);
    });
    mediaRecorder.addEventListener('stop', async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioChunks = [];
      statusEl.textContent = 'Enviando áudio para o backend...';
      await sendAudioToServer(audioBlob);
    });
    statusEl.textContent = 'Pronto para gravar';
  }catch(err){
    console.error(err);
    statusEl.textContent = 'Erro: sem permissão de microfone';
    recordBtn.disabled = true;
  }
}

recordBtn.addEventListener('click', () => {
  if(!mediaRecorder) return;
  if(mediaRecorder.state === 'recording'){
    mediaRecorder.stop();
    recordBtn.classList.remove('recording');
    recordBtn.textContent = '🎤 Gravar';
    statusEl.textContent = 'Processando áudio...';
  } else {
    mediaRecorder.start();
    recordBtn.classList.add('recording');
    recordBtn.textContent = '⏹ Parar';
    statusEl.textContent = 'Gravando... fale agora';
  }
});

async function sendAudioToServer(blob){
  try{
    const form = new FormData();
    form.append('file', blob, 'voice.webm');
    const res = await fetch('/transcribe', { method: 'POST', body: form });
    if(!res.ok) throw new Error('Falha no servidor');
    const data = await res.json();
    jsonOutput.textContent = JSON.stringify(data, null, 2);
    renderListsFromJson(data);
    statusEl.textContent = 'Resposta recebida';
  }catch(err){
    console.error(err);
    statusEl.textContent = 'Erro ao enviar áudio: ' + err.message;
  }
}

function renderListsFromJson(data){
  listsContainer.innerHTML = '';
  if(!data.listas || data.listas.length === 0){
    listsContainer.innerHTML = '<div class="list-card">Nenhuma lista criada ainda</div>';
    return;
  }
  data.listas.forEach(lst => {
    const card = document.createElement('div');
    card.className = 'list-card';
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><strong>${lst.nome_lista}</strong><span style="color:var(--muted)">${lst.tipo}</span></div>`;
    lst.tarefas.forEach(t => {
      const tdiv = document.createElement('div');
      tdiv.className = 'task';
      tdiv.innerHTML = \`<div><div class="title">\${t.titulo}</div><div class="meta">\${t.prioridade} • \${t.prazo || 'sem prazo'}</div></div><div><button onclick='markDone("${t.id}")'>Concluir</button></div>\`;
      card.appendChild(tdiv);
    });
    listsContainer.appendChild(card);
  });
}

function markDone(id){
  alert('Protótipo: marcar id ' + id + ' como concluída (simulação)');
}

// init
initRecorder();
