// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const { Readable } = require("stream");

// OpenAI SDK v4 (node)
const OpenAI = require("openai");

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Página inicial
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Saúde
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Util: cria ICS em texto
function buildICS({ title, description = "", dtStartISO, dtEndISO }) {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@smart-assistant`;
  const dtStart = dtStartISO.replace(/[-:]/g, "").split(".")[0] + "Z";
  const dtEnd = dtEndISO.replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Smart Assistant//PT-BR//",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

// POST /process-audio — recebe áudio, transcreve e gera tarefas estruturadas
app.post("/process-audio", upload.single("audio"), async (req, res) => {
  const filePath = req.file?.path;
  if (!filePath) return res.status(400).json({ error: "Áudio não recebido" });

  try {
    // 1) Transcrever
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "gpt-4o-mini-transcribe",
      // idioma português ajuda o modelo
      language: "pt"
    });

    const transcriptText = transcription.text?.trim() || "";

    // 2) Extrair tarefas (JSON estrito)
    const system = `
Você é um assistente que converte comandos de voz em tarefas organizadas.
Responda **APENAS** com JSON válido no seguinte formato:

{
  "mensagem_ao_usuario": "texto curto em pt-BR",
  "tarefas": [
    {
      "titulo": "string",
      "descricao": "string",
      "data": "YYYY-MM-DD",
      "hora_inicio": "HH:MM",
      "duracao_minutos": 30,
      "lista": "pessoal" | "casa" | "trabalho" | "compartilhada",
      "lembretes_minutos_antes": [60, 10]
    }
  ]
}

- Extraia datas relativas (ex.: "amanhã", "segunda", "às 14h") para data/hora.
- Se não houver hora, use 09:00. Se não houver duração, use 30 min.
- Se não houver categoria, use "pessoal".
    `.trim();

    const user = `Transcreva em tarefas: """${transcriptText}"""`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      response_format: { type: "json_object" }
    });

    let payload = {};
    try {
      payload = JSON.parse(completion.choices[0].message.content);
    } catch {
      payload = { mensagem_ao_usuario: "Não consegui entender.", tarefas: [] };
    }

    // 3) Gerar ICS para cada tarefa (cliente baixa e adiciona ao calendário)
    const tasksWithICS = (payload.tarefas || []).map((t) => {
      // monta datas ISO
      const startISO = new Date(`${t.data}T${t.hora_inicio || "09:00"}:00Z`);
      const endISO = new Date(startISO.getTime() + (t.duracao_minutos || 30) * 60000);

      const ics = buildICS({
        title: t.titulo,
        description: t.descricao || "",
        dtStartISO: startISO.toISOString(),
        dtEndISO: endISO.toISOString()
      });

      return { ...t, ics };
    });

    // 4) Resposta final
    res.json({
      transcricao: transcriptText,
      mensagem_ao_usuario: payload.mensagem_ao_usuario || "Tudo certo!",
      tarefas: tasksWithICS
    });
  } catch (err) {
    console.error("Erro /process-audio:", err?.message || err);
    res.status(500).json({ error: "Falha ao processar áudio" });
  } finally {
    // limpa arquivo temporário
    try { fs.unlinkSync(filePath); } catch {}
  }
});

app.listen(PORT, () => {
  console.log(`Smart Assistant on :${PORT}`);
});
