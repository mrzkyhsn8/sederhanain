import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

async function init() {
  let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data.googleClientId) {
      clientId = data.googleClientId;
    }
  } catch (error) {
    console.warn("Failed to fetch runtime config, falling back to build-time vars", error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <GoogleOAuthProvider clientId={clientId || 'YOUR_GOOGLE_CLIENT_ID'}>
        <App />
      </GoogleOAuthProvider>
    </StrictMode>,
  );
}

init();
