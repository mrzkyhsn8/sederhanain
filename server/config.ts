import { GoogleGenAI } from "@google/genai";
import { OAuth2Client } from "google-auth-library";
import "dotenv/config";

export const PORT = Number(process.env.PORT) || 3000;

export const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;

export const WHITELIST_EMAILS = process.env.WHITELIST_EMAILS
  ? process.env.WHITELIST_EMAILS.split(",").map(e => e.trim().toLowerCase())
  : [];

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
