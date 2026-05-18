<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sederhanain
> **AI Concept Visualizer v2.0** — Simplify Compex Concepts.

**Sederhanain** is an interactive platform powered by **Generative UI** that leverages AI (Gemini API) to transform dry theories, complex IT jargon, and scientific phenomena into real-world analogical simulations in real-time. With a premium interface, fluid transitions, and vivid interactive visualizations, complex concepts become much easier to grasp.

---

## ✨ Key Features

- **Google Gen AI Integration**: Powered by Google's Gemini API, providing highly accurate, contextual, and creative real-world analogies to simplify any complex concept or term you throw at it.
- **Dynamic Generative UI**: Supports 3 dynamic visual layout strategies generated dynamically:
  - `PIPELINE` (Flowing horizontal flow / feedback loop).
  - `SPLIT_LANES` (Parallel comparison / vertical race).
  - `HUB_AND_SPOKE` (A single central node surrounded by multiple branches).
- **Google OAuth 2.0 Authentication**: Seamlessly integrated authentication. The login prompt only appears in an action-driven manner (when a user clicks the "Analysis" button for the first time).
- **Rate Limiting**: Restricts each user to a maximum of **5 requests per 24 hours**, securely locked on the backend using their Google email address.
- **Tester Whitelist**: Testers can be exempted from daily rate limits via environment variable configuration (`WHITELIST_EMAILS`).
- **Local Analysis History (Instant Cache)**: Securely stores up to the last 5 search histories in the browser's `localStorage`. Reopening past histories works instantly and **does not consume the daily rate limit quota**!

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
