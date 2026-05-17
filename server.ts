import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

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
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/analogize", async (req, res) => {
    try {
      const { concept } = req.body;
      if (!concept) {
        return res.status(400).json({ error: "Concept is required" });
      }

      const prompt = `Kamu adalah mesin backend berbasis AI untuk aplikasi bernama "Sederhanain". Ikuti instruksi di bawah ini dengan sangat ketat untuk memproses input dari pengguna. Tugasmu adalah menerima satu kata kunci konsep abstrak, teknis, atau ilmiah dari pengguna. Terjemahkan konsep tersebut menjadi satu tema cerita analogi dunia nyata yang utuh dan logis, lalu bagi cerita tersebut menjadi beberapa tahapan simulasi yang terstruktur.

Frontend kami menggunakan komponen geometri universal (Lingkaran sebagai entitas, Garis sebagai konektor, dan Titik Menyala sebagai energi/data). Oleh karena itu, kamu wajib memetakan setiap langkah cerita ke dalam salah satu dari 4 status visual baku di bawah ini (gunakan huruf kapital):
A) SETUP: Tahap persiapan. Entitas diperkenalkan di layar, namun belum ada hubungan/aksi.
B) PROCESSING: Tahap inisiasi atau pengiriman sinyal. Ada pergerakan awal antar entitas.
C) ACTIVE: Tahap sistem bekerja penuh. Aliran energi/data sedang berjalan lancar secara terus-menerus.
D) BROKEN: Tahap penutup, atau simulasi selesai, atau kondisi ketika sistem sengaja dirusak/dimatikan untuk melihat efeknya.

Seluruh teks penjelasan wajib ditulis menggunakan Bahasa Indonesia yang santai, mudah dipahami orang awam, namun tetap akurat secara analogi.

Tambahan aturan ketat:
1. "layoutType": Pilih salah satu dari: "PIPELINE" (Alur horizontal kiri-kanan), "SPLIT_LANES" (Alur vertikal atas-bawah), atau "HUB_AND_SPOKE" (Satu pusat di tengah dikelilingi cabang).
2. "visualAsset": Berikan 1 EMOJI yang paling menggambarkan peran fisik entitas tersebut di setiap objek entitas.
3. "animationConfig": Untuk tiap step simulasi, berikan objek konfigurasi animasi dengan properti speed ("none", "slow", "fast"), direction ("none", "forward", "backward", "bidirectional"), dan effect ("none", "ping", "pulse", "stream", "spin", "shake", "race").
4. Aturan Ketat untuk Objek di dalam "simulationSteps":
   - "title" adalah JUDUL LANGKAH YANG DILIHAT MANUSIA. Tulis secara kreatif, natural, dan sepenuhnya fleksibel sesuai dengan konteks topik. DILARANG keras memasukkan kata "SETUP", "PROCESSING", "ACTIVE", atau "BROKEN" ke dalam properti "title" ini.
   - "visualState" adalah KODE ROBOT UNTUK FRONTEND. Ini adalah variabel tersembunyi untuk mengatur animasi CSS. Nilainya wajib berupa ENUM kaku ("SETUP" | "PROCESSING" | "ACTIVE" | "BROKEN") yang paling mendekati situasi mekanis pada langkah tersebut.

Input pengguna yang harus kamu eksekusi saat ini adalah: "${concept}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              techConcept: { type: Type.STRING },
              analogyTheme: { type: Type.STRING },
              overview: { type: Type.STRING },
              layoutType: {
                type: Type.STRING,
                enum: ["PIPELINE", "SPLIT_LANES", "HUB_AND_SPOKE"]
              },
              entities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    techName: { type: Type.STRING },
                    analogyName: { type: Type.STRING },
                    description: { type: Type.STRING },
                    visualAsset: { type: Type.STRING },
                  },
                  required: ["id", "techName", "analogyName", "description", "visualAsset"],
                },
              },
              simulationSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    techAction: { type: Type.STRING },
                    analogyAction: { type: Type.STRING },
                    visualState: {
                      type: Type.STRING,
                      enum: ["SETUP", "PROCESSING", "ACTIVE", "BROKEN"],
                    },
                    animationConfig: {
                      type: Type.OBJECT,
                      properties: {
                        speed: { type: Type.STRING, enum: ["none", "slow", "fast"] },
                        direction: { type: Type.STRING, enum: ["none", "forward", "backward", "bidirectional"] },
                        effect: { type: Type.STRING, enum: ["none", "ping", "pulse", "stream", "spin", "shake", "race"] },
                      },
                      required: ["speed", "direction", "effect"],
                    },
                  },
                  required: ["step", "title", "techAction", "analogyAction", "visualState", "animationConfig"],
                },
              },
            },
            required: ["techConcept", "analogyTheme", "overview", "layoutType", "entities", "simulationSteps"],
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
