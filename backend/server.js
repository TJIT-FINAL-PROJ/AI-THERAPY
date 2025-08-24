import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// ✅ Setup for serving frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// API route (Groq)
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`, // ✅ Using Groq API key
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // ✅ Active model
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI assistant. Always reply concisely in 3–4 sentences max. Keep answers short, friendly, and easy to read. Avoid long paragraphs or numbered lists.",
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();
    console.log("🤖 Groq raw response:", data);

    const aiReply = data?.choices?.[0]?.message?.content || "⚠️ AI didn’t reply.";
    res.json({ reply: aiReply });
  } catch (err) {
    console.error("❌ Groq API error:", err);
    res.status(500).json({ error: "Something went wrong with AI." });
  }
});

// ✅ Catch-all so React Router works
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
