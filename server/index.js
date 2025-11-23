// server/index.js
// Gemini API proxy using Axios
const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_KEY;
const PORT = process.env.PORT || 3001;

if (!GEMINI_KEY) {
  console.warn("GEMINI_API_KEY not set. /api/summarize will fail.");
}

app.post("/api/summarize", async (req, res) => {
  try {
    const texts = Array.isArray(req.body.texts)
      ? req.body.texts.slice(0, 50)
      : [];
    if (!texts.length) {
      return res.status(400).json({ error: "texts array required" });
    }

const prompt = `
Summarize the following highlights into 3–5 bullet points.
Each bullet MUST be on its own line and MUST start with an asterisk (*) followed by a space.

Highlights:

${texts.join("\n\n")}
    `.trim();

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    const response = await axios.post(
      `${geminiUrl}?key=${GEMINI_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const summary =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No summary generated";

    return res.json({ summary });
  } catch (err) {
    console.error("Gemini summarize error:", err.response?.data || err.message);
    return res.status(500).json({
      error: "Gemini API error",
      detail: err.response?.data || err.message,
    });
  }
});

app.listen(PORT, () =>
  console.log(`Gemini proxy running on ${process.env.PORT}`)
);
