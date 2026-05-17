<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sederhanain.
> **AI Concept Visualizer v2.0** — Bikin Konsep Rumit Jadi Sederhana.

**Sederhanain** adalah platform interaktif berbasis **Generative UI** yang menggunakan AI (Gemini API) untuk mengubah teori kaku, istilah IT, hingga fenomena sains menjadi simulasi analogi dunia nyata secara real-time. Dengan antarmuka premium, transisi halus, dan visualisasi interaktif yang hidup, konsep rumit akan terasa jauh lebih mudah dipahami.

---

## ✨ Fitur Utama

- **Generative UI Dinamis**: Mendukung 3 tata letak visual dinamis:
  - `PIPELINE` (Alur horizontal mengalir/timbal balik).
  - `SPLIT_LANES` (Perbandingan paralel / balapan vertikal).
  - `HUB_AND_SPOKE` (Satu pusat dikelilingi banyak cabang).
- **Google OAuth 2.0 Authentication**: Otentikasi yang terintegrasi secara mulus. Form login hanya akan muncul secara *action-driven* (ketika user mengklik tombol Analisis pertama kali).
- **Rate Limiting**: Membatasi penggunaan Gemini API milik owner dengan membatasi setiap user maksimal **5 request per 24 jam**, dikunci secara aman di backend menggunakan alamat email Google mereka.
- **Tester Whitelist**: Tester dapat dibebaskan dari batasan rate limit harian melalui konfigurasi environment variable (`WHITELIST_EMAILS`).
- **Riwayat Analisis Lokal (Instant Cache)**: Menyimpan hingga 5 riwayat pencarian terakhir secara aman di `localStorage` browser. Membuka kembali riwayat pencarian berjalan secara instan dan **tidak memakan kuota rate limit harian**!

---

## 🚀 Memulai (Run Locally)

### Prasyarat
- [Node.js](https://nodejs.org/) (Versi LTS terbaru)
- Akun [Google Cloud Console](https://console.cloud.google.com/) (Untuk membuat OAuth 2.0 Client ID)

### Langkah Setup

1. **Clone Proyek & Install Dependensi**:
   ```bash
   npm install
   ```

2. **Konfigurasi Environment Variables**:
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Isi nilai-nilai variabel berikut di dalam `.env`:
   * `GEMINI_API_KEY`: API Key Gemini Anda.
   * `VITE_GOOGLE_CLIENT_ID`: Client ID OAuth 2.0 yang didapatkan dari Google Cloud Console.
   * `WHITELIST_EMAILS`: Daftar email tester/owner yang ingin dibebaskan dari limit (dipisahkan koma, misal: `mrzkyhsn8@gmail.com`).

3. **Jalankan Aplikasi secara Lokal**:
   ```bash
   npm run dev
   ```
   Aplikasi Anda sekarang berjalan di `http://localhost:5173`.

---

## ☁️ Deployment (Google Cloud Run)

Proyek ini siap dideploy langsung ke **Google Cloud Run** menggunakan Docker:

```bash
gcloud run deploy sederhanain --source . --region us-central1 --allow-unauthenticated --min-instances 0
```

> [!NOTE]
> Pastikan Anda telah mengonfigurasi variabel lingkungan di Google Cloud Run Console dan menambahkan URL Cloud Run Anda ke bagian **Authorized JavaScript origins** di Google Cloud Console credentials Anda agar OAuth Google dapat berjalan lancar di versi produksi.

---
<div align="center">
Dibuat dengan ❤️ oleh Tim Sederhanain
</div>
