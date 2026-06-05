import { useState, useEffect } from "react";
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { HistoryItem, SederhanainData } from "../types";

/**
 * Custom hook to manage Google OAuth authentication state and user search history.
 */
export function useGoogleAuth(onLoginSuccess?: (token: string, profileSub?: string) => void) {
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ email: string; sub: string; name?: string; picture?: string } | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("sederhanain_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fetchUserProfile = async (accessToken: string) => {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const profile = await res.json();
      if (profile.sub) {
        setUserProfile(profile);
        // Load history for this specific Google user
        const saved = localStorage.getItem(`sederhanain_history_${profile.sub}`);
        setHistory(saved ? JSON.parse(saved) : []);
        return profile;
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
    return null;
  };

  const handleLogout = () => {
    googleLogout();
    setToken(null);
    setUserProfile(null);
    // Reset history to anonymous local storage
    try {
      const saved = localStorage.getItem("sederhanain_history");
      setHistory(saved ? JSON.parse(saved) : []);
    } catch {
      setHistory([]);
    }
  };

  const deleteHistoryItem = (conceptToDelete: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.concept.toLowerCase() !== conceptToDelete.toLowerCase());
      try {
        const sub = userProfile?.sub;
        const key = sub ? `sederhanain_history_${sub}` : "sederhanain_history";
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const saveToHistory = (concept: string, data: SederhanainData) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item.concept.toLowerCase() !== concept.toLowerCase());
      const updated = [{ concept, data, timestamp: Date.now() }, ...filtered].slice(0, 5);
      try {
        const sub = userProfile?.sub;
        const key = sub ? `sederhanain_history_${sub}` : "sederhanain_history";
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setToken(tokenResponse.access_token);
      const profile = await fetchUserProfile(tokenResponse.access_token);
      if (onLoginSuccess) {
        onLoginSuccess(tokenResponse.access_token, profile?.sub);
      }
    },
    onError: () => alert('Google Login Failed'),
  });

  return {
    token,
    userProfile,
    history,
    login,
    handleLogout,
    deleteHistoryItem,
    saveToHistory,
    setHistory,
  };
}
