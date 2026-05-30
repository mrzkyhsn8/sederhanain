import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set('trust proxy', 1);

  app.use(express.json());

  const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

  const authMiddleware = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Silakan login dengan Google terlebih dahulu." });
    }

    const token = authHeader.split(" ")[1];
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Invalid token response from Google");
      }

      const payload = await response.json();
      if (payload && payload.email) {
        req.userEmail = payload.email;
        next();
      } else {
        res.status(401).json({ error: "Token tidak valid atau tidak memiliki email." });
      }
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(401).json({ error: "Gagal memverifikasi login Google. Silakan login kembali." });
    }
  };

  const apiLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 jam
    max: 5, // Batas 5 request per user
    message: { error: "Limit tercapai. Anda hanya bisa melakukan 5 pencarian dalam 24 jam. Silakan coba lagi besok." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
      return req.userEmail || "anonymous";
    },
    skip: (req: any) => {
      if (!req.userEmail) return false;
      const whitelist = process.env.WHITELIST_EMAILS
        ? process.env.WHITELIST_EMAILS.split(",").map(e => e.trim().toLowerCase())
        : [];
      return whitelist.includes(req.userEmail.toLowerCase());
    }
  });

  app.post("/api/analogize", authMiddleware, apiLimiter, async (req, res) => {
    try {
      const { concept, lang = "id" } = req.body;
      if (!concept) {
        return res.status(400).json({ error: "Concept is required" });
      }

      const isEnglish = lang === "en";
      const languageInstruction = isEnglish
        ? "All explanation texts (tema, deskripsi, komponen label & analogi, and langkah judul, ibaratnya, & kenyataannya) MUST be written in casual, educational, and analogically accurate English."
        : "Seluruh teks penjelasan (tema, deskripsi, komponen label & analogi, dan langkah judul, ibaratnya, & kenyataannya) wajib ditulis menggunakan Bahasa Indonesia yang santai, edukatif, dan akurat secara analogi.";

      const prompt = `Kamu adalah mesin backend berbasis AI untuk aplikasi bernama "Sederhanain". Ikuti instruksi di bawah ini dengan sangat ketat untuk memproses input dari pengguna.

1. TENTUKAN TASK
Tugasmu adalah menerima satu kata kunci konsep abstrak (misalnya: "WebSockets", "Async vs Sync", "Black Hole", "Inflasi Ekonomi"). Terjemahkan konsep tersebut menjadi satu tema cerita analogi dunia nyata yang utuh, dan bagi cerita tersebut menjadi beberapa tahapan simulasi yang terstruktur dalam bentuk JSON. Buat analogi dengan tepat 3 komponen utama.

2. ATURAN SVG (WAJIB DIIKUTI)
Untuk setiap komponen, buat 2 versi ikon SVG ("svgNormal" dan "svgBroken"):
- svgNormal : kondisi awal/stabil (dipakai di langkah 1-3)
- svgBroken : kondisi rusak/hancur/gagal (dipakai di langkah 4)
ATURAN KRITIS SVG:
- viewBox selalu "0 0 60 60"
- Gunakan HANYA elemen dasar XML murni (tanpa camelCase): <rect>, <circle>, <ellipse>, <line>, <polyline>, <polygon>, <path>
- Semua atribut warna (stroke dan fill) HARUS menggunakan nilai "currentColor" agar bisa di-override oleh CSS. (contoh: stroke="currentColor" fill="none")
- stroke-width antara 1.5-2.5
- Gunakan fill="none" untuk outline, atau fill="currentColor" dengan fill-opacity untuk area solid/glowing (contoh: fill-opacity="0.2").
- Jangan gunakan tag <svg> pembungkus di dalam string svgContent.
- svgBroken harus tampak berbeda: sobek, runtuh, retak, atau terputus.

3. STRUKTUR JSON
Hasil JSON darimu harus memiliki format persis seperti ini:
{
  "tema": "judul analogi max 8 kata",
  "deskripsi": "2-3 kalimat penjelasan",
  "komponen": [
    {
      "label": "nama elemen konsep (singkat, uppercase)",
      "analogi": "nama benda/entitas dalam analogi",
      "svgNormal": "<path ... /><circle ... />",
      "svgBroken": "<path ... /><line ... />"
    }
  ],
  "langkah": [
    {
      "kode": "SETUP",
      "judul": "judul langkah 1 (5-7 kata)",
      "ibaratnya": "1-2 kalimat narasi analogi untuk langkah ini",
      "kenyataannya": "1-2 kalimat penjelasan teknis/nyata",
      "nodeStates": [true, true, true],
      "connections": ["deskripsi aliran komponen 1 ke 2 (max 3 kata)", "deskripsi aliran komponen 2 ke 3 (max 3 kata)"]
    },
    {
      "kode": "PROCESS",
      "judul": "judul langkah 2",
      "ibaratnya": "...",
      "kenyataannya": "...",
      "nodeStates": [true, true, true],
      "connections": ["...", "..."]
    },
    {
      "kode": "CRITICAL",
      "judul": "judul langkah 3",
      "ibaratnya": "...",
      "kenyataannya": "...",
      "nodeStates": [true, true, false],
      "connections": ["...", "..."]
    },
    {
      "kode": "BROKEN",
      "judul": "judul langkah 4",
      "ibaratnya": "...",
      "kenyataannya": "...",
      "nodeStates": [false, false, false],
      "connections": ["koneksi terputus/gagal", "koneksi terputus/gagal"]
    }
  ]
}

4. ATURAN FORMAT
- Keluaran HARUS berupa JSON murni yang valid.
- Pastikan ada tepat 4 langkah di dalam array "langkah", dengan kode: "SETUP", "PROCESS", "CRITICAL", dan "BROKEN".
- "nodeStates" adalah array boolean dengan panjang 3 (karena ada 3 komponen), menandakan apakah komponen tersebut masih aktif (true) atau mati (false) pada langkah tersebut.
- "connections" adalah array string dengan panjang 2, menjelaskan data flow atau hubungan aksi antar komponen (Node 1 -> Node 2, dan Node 2 -> Node 3) pada langkah ini. Wajib disesuaikan dengan bahasa terpilih (Bahasa Inggris jika 'en', Bahasa Indonesia jika 'id').
- ${languageInstruction}

Input pengguna yang harus kamu eksekusi saat ini adalah: "${concept}"`;


      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tema: { type: Type.STRING },
              deskripsi: { type: Type.STRING },
              komponen: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    analogi: { type: Type.STRING },
                    svgNormal: { type: Type.STRING },
                    svgBroken: { type: Type.STRING },
                  },
                  required: ["label", "analogi", "svgNormal", "svgBroken"],
                },
              },
              langkah: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    kode: { type: Type.STRING },
                    judul: { type: Type.STRING },
                    ibaratnya: { type: Type.STRING },
                    kenyataannya: { type: Type.STRING },
                    nodeStates: {
                      type: Type.ARRAY,
                      items: { type: Type.BOOLEAN },
                    },
                    connections: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ["kode", "judul", "ibaratnya", "kenyataannya", "nodeStates", "connections"],
                },
              },
            },
            required: ["tema", "deskripsi", "komponen", "langkah"],
          },
        },
      });

      const parsedJSON = JSON.parse(response.text || "{}");
      res.json(parsedJSON);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to generate analogy" });
    }
  });

  app.get("/api/config", (req, res) => {
    res.json({
      googleClientId: process.env.VITE_GOOGLE_CLIENT_ID,
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
