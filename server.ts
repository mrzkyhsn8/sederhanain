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

      const prompt = `Kamu adalah mesin backend berbasis AI untuk aplikasi bernama "Sederhanain". Ikuti instruksi di bawah ini dengan sangat ketat untuk memproses input dari pengguna.

1. TENTUKAN TASK
Tugasmu adalah menerima satu kata kunci konsep abstrak, baik di bidang teknologi (IT) maupun non-teknologi seperti sains, biologi, ekonomi, sosiologi, sejarah, dll (misalnya: "WebSockets", "Async vs Sync", "Black Hole", "Inflasi Ekonomi"). Terjemahkan konsep tersebut menjadi satu tema cerita analogi dunia nyata yang utuh, tentukan tata letak visualnya, pilih emoji pendukungnya, dan bagi cerita tersebut menjadi beberapa tahapan simulasi yang terstruktur dalam bentuk JSON.

2. BERI CONTEXT
Hasil JSON darimu akan dibaca oleh aplikasi Frontend (React + Tailwind) untuk merender komponen visual secara dinamis (Generative UI). 
- Kami menyediakan 3 jenis tata letak (layoutType): 
  1. "PIPELINE" (Alur horizontal kiri-kanan, cocok untuk proses mengalir/timbal balik).
  2. "SPLIT_LANES" (Alur vertikal atas-bawah, cocok untuk perbandingan paralel/balapan/simultan).
  3. "HUB_AND_SPOKE" (Satu pusat di tengah dikelilingi banyak cabang).
- Setiap entitas harus memiliki peran yang jelas agar tidak tumpang tindih secara logika di panggung visual. Gunakan Emoji (visualAsset) sebagai avatar unik untuk tiap entitas.
- Kami memisahkan dengan ketat antara apa yang dilihat manusia (tampilan UI) dan apa yang dibaca oleh kode robot Frontend (untuk animasi CSS).

3. BERI EXAMPLE
Jika pengguna memasukkan input: "Black Hole", maka hasil ideal yang harus kamu kembalikan adalah seperti ini:

{
  "techConcept": "Black Hole",
  "layoutType": "HUB_AND_SPOKE",
  "analogyTheme": "Raksasa di Kolam Renang",
  "overview": "Bayangkan Black Hole adalah sebuah lubang pembuangan super kuat di tengah kolam renang raksasa yang tidak punya dasar. Apapun yang berenang terlalu dekat, termasuk cahaya, bakal terisap masuk dan hilang selamanya.",
  "entities": [
    {
      "id": "ent-1",
      "techName": "Matter & Light",
      "analogyName": "Bebek Karet & Air",
      "description": "Objek malang yang berenang terlalu dekat dengan pusaran.",
      "visualAsset": "🦆"
    },
    {
      "id": "ent-2",
      "techName": "Event Horizon",
      "analogyName": "Bibir Pusaran",
      "description": "Batas aman terakhir. Jika melewati titik ini, tidak ada jalan kembali.",
      "visualAsset": "🌀"
    },
    {
      "id": "ent-3",
      "techName": "Singularity",
      "analogyName": "Lubang Tanpa Dasar",
      "description": "Titik inti pembuangan tempat semua materi hancur dan lenyap.",
      "visualAsset": "🕳️"
    }
  ],
  "simulationSteps": [
    {
      "step": 1,
      "title": "Suasana Kolam yang Tenang",
      "techAction": "Objek berada di ruang hampa udara jauh dari gaya tarik koordinat singularity.",
      "analogyAction": "Bebek karet mengapung santai di pojok kolam, belum menyadari adanya bahaya.",
      "visualState": "SETUP",
      "animationConfig": {
        "speed": "none",
        "direction": "none",
        "effect": "pulse"
      }
    },
    {
      "step": 2,
      "title": "Air Mulai Berputar",
      "techAction": "Objek mulai memasuki medan gravitasi luar dan terakselerasi.",
      "analogyAction": "Bebek karet mulai bergerak terseret arus pelan, berputar mengitari bibir pusaran.",
      "visualState": "PROCESSING",
      "animationConfig": {
        "speed": "slow",
        "direction": "forward",
        "effect": "spin"
      }
    },
    {
      "step": 3,
      "title": "Terjebak di Pusaran Maut",
      "techAction": "Materi melewati Event Horizon dan mengalami tarikan ekstrem menuju titik pusat.",
      "analogyAction": "Arus menjadi sangat deras! Bebek karet tersedot cepat berputar-putar menuju lubang inti.",
      "visualState": "ACTIVE",
      "animationConfig": {
        "speed": "fast",
        "direction": "forward",
        "effect": "stream"
      }
    },
    {
      "step": 4,
      "title": "Hilang Ditelan Kegelapan",
      "techAction": "Materi hancur total dan menyatu di titik singularitas.",
      "analogyAction": "Bebek karet masuk ke dalam lubang pembuangan dan hilang sama sekali dari pandangan.",
      "visualState": "BROKEN",
      "animationConfig": {
        "speed": "none",
        "direction": "none",
        "effect": "shake"
      }
    }
  ]
}

4. ATUR FORMAT
- Keluaran HARUS berupa JSON murni yang valid sesuai dengan struktur pada contoh di atas.
- Jangan berikan kalimat pengantar di awal (seperti "Tentu, ini hasilnya:") atau kalimat penutup di akhir.
- Seluruh teks penjelasan wajib ditulis menggunakan Bahasa Indonesia yang santai, edukatif, mudah dipahami orang awam, namun tetap akurat secara analogi.
- Aturan Ketat Properti "title" di dalam "simulationSteps": Tulis judul langkah secara kreatif, fleksibel, puitis, dan natural sesuai konteks cerita (Contoh: "Suasana Kolam yang Tenang", "Terjebak di Pusaran Maut"). DILARANG KERAS memasukkan kata "SETUP", "PROCESSING", "ACTIVE", atau "BROKEN" ke dalam properti "title" ini.
- Kamu HARUS mematuhi batasan nilai (Enum) berikut untuk kebutuhan mesin Frontend:
  * \`layoutType\` hanya boleh berisi: "PIPELINE", "SPLIT_LANES", atau "HUB_AND_SPOKE".
  * \`visualState\` hanya boleh berisi: "SETUP", "PROCESSING", "ACTIVE", atau "BROKEN".
  * \`animationConfig.speed\` hanya boleh berisi: "none", "slow", atau "fast".
  * \`animationConfig.direction\` hanya boleh berisi: "none", "forward", "backward", atau "bidirectional".
  * \`animationConfig.effect\` hanya boleh berisi: "none", "ping", "pulse", "stream", "spin", "shake", atau "race".

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
