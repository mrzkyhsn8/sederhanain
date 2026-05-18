/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  // Add other VITE_ variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
