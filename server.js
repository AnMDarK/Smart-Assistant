import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import cors from "cors";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: "uploads/" });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Rota principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rota para processar áudio
app.post("/process-audio", upload.single("audio"), async (req, res) => {
    try {
        const filePath = path.join(__dirname, req.file.path);

        // Transcreve áudio
        const transcription = await client.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "gpt-4o-mini-transcribe"
        });

        // Gera lista de tarefas a partir da transcrição
        const aiResponse = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Você é um assistente que organiza tarefas." },
                { role: "user", content: `Transforme o seguinte texto em uma lista de tarefas: ${transcription.text}` }
            ]
        });

        const tasks = aiResponse.choices[0].message.content
            .split("\n")
            .filter(t => t.trim() !== "");

        res.json({ tasks });

        fs.unlinkSync(filePath); // Apaga arquivo temporário
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao processar áudio" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));