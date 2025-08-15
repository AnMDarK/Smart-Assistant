require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para receber áudio (simulação por enquanto)
app.post('/api/audio', upload.single('audio'), (req, res) => {
    console.log("Áudio recebido:", req.file);
    res.json({ message: "Áudio processado com sucesso (simulação)" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
