<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sederhanain
> **AI Concept Visualizer v2.0** — Simplify Compex Concepts.

**Sederhanain** is an interactive platform powered by **Generative UI** that leverages AI (Gemini API) to transform dry theories, complex IT jargon, and scientific phenomena into real-world analogical simulations in real-time. With a premium interface, fluid transitions, and vivid interactive visualizations, complex concepts become much easier to grasp.

---

## ✨ Key Features

- **Google Gen AI Integration**: Powered by Google's latest Gemini API (`gemini-3-flash-preview`), dynamically producing highly accurate, creative, and context-aware real-world analogies to simplify any abstract or complex technical term.
- **Dynamic Interactive Simulations**: Leverages Generative UI to construct an interactive network diagram of components with custom inline SVGs representing normal and broken states, combined with animated flow connections.
- **Bilingual Support (English & Indonesian)**: Full localization across UI elements and AI prompts, allowing users to toggle seamlessly between English (`en`) and Indonesian (`id`) with instant adaptation of generated results.
- **Smart Audio Storytelling (TTS)**: Built-in narration system with full media controls (Play, Pause, Stop) that reads your analogies aloud. It automatically detects and employs high-quality natural/online voices matching the selected language, with an optional auto-advance mode.
- **Universal Command Palette (`Ctrl+K`)**: Keyboard-shortcut driven modal to search past query histories, browse FAQs, or trigger key app actions instantly.
- **Share & Export Center**: Easily save and distribute your analogies:
  - Generate and download beautiful high-resolution PNG infographic cards (via `html2canvas`).
  - Copy structured text summaries directly to the clipboard.
  - Instantly share insights to Twitter (X) and WhatsApp.
- **Google OAuth 2.0 Authentication**: Seamless, action-driven login flow. Authentication is only required on-demand when a user clicks the "Analysis" button for the first time.
- **Secure Backend Rate Limiting**: Restricts users to a maximum of **5 requests per 24 hours**, locked securely on the Express backend using verified Google OAuth email addresses.
- **Namespaced User History Cache**: Securely caches up to 5 analysis histories per user inside namespaced browser storage (`sederhanain_history_${google_user_sub}`). Reopening past histories loads instantly and **does not consume the daily rate limit quota**!
- **Tester Whitelist**: Bypass rate limits for specific testing accounts using a comma-separated list of emails in environment variables (`WHITELIST_EMAILS`).

---

## 🚀 Getting Started (Run Locally)

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS version)
- A [Google Cloud Console](https://console.cloud.google.com/) account (to generate OAuth 2.0 Client ID)

### Setup Steps

1. **Clone the Project & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Fill in the following variables inside `.env`:
   * `GEMINI_API_KEY`: Your Gemini API Key.
   * `VITE_GOOGLE_CLIENT_ID`: The OAuth 2.0 Client ID obtained from the Google Cloud Console.
   * `WHITELIST_EMAILS`: A comma-separated list of tester email addresses that should be exempted from limits (e.g., `mrzkyhsn8@gmail.com`).

3. **Run the Application Locally**:
   ```bash
   npm run dev
   ```
   Your application will now be running at `http://localhost:5173`.

---

## ☁️ Deployment (Google Cloud Run)

This project is ready to be deployed directly to **Google Cloud Run** using Docker:

```bash
gcloud run deploy sederhanain --source . --region us-central1 --allow-unauthenticated --min-instances 0
```

> [!NOTE]
> Make sure you have configured the environment variables in the Google Cloud Run Console and added your Cloud Run URL to the **Authorized JavaScript origins** in your Google Cloud Console credentials so that Google OAuth works seamlessly in the production environment.

---
<div align="center">
Made with ❤️ by the Sederhanain Team
</div>
