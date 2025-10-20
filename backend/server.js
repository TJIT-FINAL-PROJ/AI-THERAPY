// server.js
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// ✅ Supabase admin client (service role key required)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Serve frontend static (adjust path if needed)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Your existing /api/chat route (kept as-is)
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
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

/**
 * POST /api/send-email
 * body: { email, subject, content }
 *
 * Uses Supabase Admin sendLink() (auth.admin.sendLink) if available.
 * If not available (SDK mismatch), automatically falls back to REST API.
 */
app.post("/api/send-email", async (req, res) => {
  try {
    const { email, subject, content } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Missing or invalid recipient email." });
    }

    // Basic subject/content defaults
    const safeSubject = subject || "Notification from Your App";
    const safeContent =
      content ||
      "Hello! This is a notification from your AI assistant. Open the app to see more.";

    try {
      // Try using SDK-based sendLink (if available in this version)
      if (typeof supabase.auth.admin.sendLink === "function") {
        const { data, error } = await supabase.auth.admin.sendLink({
          email,
          options: {
            redirectTo: process.env.FRONTEND_URL || "http://localhost:5173",
            data: {
              subject: safeSubject,
              content: safeContent,
            },
          },
        });

        if (error) {
          console.error("❌ Supabase admin.sendLink error:", error);
          console.error(
            "❌ Full error object:",
            JSON.stringify(error, Object.getOwnPropertyNames(error))
          );
          return res
            .status(500)
            .json({ error: "Failed to send email via Supabase mailer." });
        }

        console.log("📧 Supabase admin.sendLink result:", data);
        return res.json({ success: true, message: "Email triggered via Supabase mailer." });
      }

      // ✅ Fallback: use Supabase REST API if sendLink() is missing
      console.warn("⚠️ admin.sendLink not found — using REST fallback.");
      const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/recover`, {
        method: "POST",
        headers: {
          apiKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Supabase REST error: ${errText}`);
      }

      console.log("✅ Email sent successfully via REST API fallback");
      return res.json({ success: true, message: "Email sent successfully via REST fallback." });
    } catch (innerErr) {
      console.error("❌ admin.sendLink call failed (possibly SDK mismatch):", innerErr);
      // Fallback to REST in case of error
      try {
        const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/recover`, {
          method: "POST",
          headers: {
            apiKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Supabase REST error: ${errText}`);
        }

        console.log("✅ Email sent successfully via REST API fallback (after SDK error)");
        return res.json({
          success: true,
          message: "Email sent successfully via REST API fallback.",
        });
      } catch (fallbackErr) {
        console.error("❌ Fallback email send failed:", fallbackErr);
        return res.status(500).json({
          error: "Email sending failed completely.",
          details: fallbackErr.message || fallbackErr,
        });
      }
    }
  } catch (err) {
    console.error("❌ Email send error (outer catch):", err);
    return res.status(500).json({ error: "Something went wrong while sending email." });
  }
});

// catch-all for react-router (adjust if your build dir differs)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
