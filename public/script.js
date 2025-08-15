const recordBtn = document.getElementById('record-btn');
const statusDiv = document.getElementById('status');
const taskList = document.getElementById('task-list');

recordBtn.addEventListener('click', () => {
    statusDiv.textContent = "🎤 Gravando... (simulação)";
    setTimeout(() => {
        statusDiv.textContent = "✅ Tarefa adicionada!";
        addTask("Tarefa exemplo gerada pela gravação");
    }, 2000);
});

function addTask(task) {
    const li = document.createElement('li');
    li.textContent = task;
    taskList.appendChild(li);
}
