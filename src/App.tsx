/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ChevronRight, ChevronLeft, LogOut, Command, Search, X, AlertOctagon, Sparkles, Lock } from "lucide-react";
import { useGoogleLogin, googleLogout } from '@react-oauth/google';

interface StepVisual {
  svgContent: string;
  primaryColor: string;
}

interface Entity {
  id: string;
  techName: string;
  analogyName: string;
  description: string;
  visualAsset: string;
  stepVisuals?: StepVisual[];
}

interface AnimationConfig {
  speed: "none" | "slow" | "fast";
  direction: "none" | "forward" | "backward" | "bidirectional";
  effect: "none" | "ping" | "pulse" | "stream" | "spin" | "shake" | "race";
}

interface SimulationStep {
  step: number;
  title: string;
  techAction: string;
  analogyAction: string;
  visualState: "SETUP" | "PROCESSING" | "ACTIVE" | "BROKEN";
  animationConfig: AnimationConfig;
}

interface SederhanainData {
  techConcept: string;
  analogyTheme: string;
  overview: string;
  layoutType: "PIPELINE" | "SPLIT_LANES" | "HUB_AND_SPOKE";
  entities: Entity[];
  simulationSteps: SimulationStep[];
}

interface HistoryItem {
  concept: string;
  data: SederhanainData;
  timestamp: number;
}

function sanitizeTitle(title: string) {
  return title.replace(/^(SETUP|PROCESSING|ACTIVE|BROKEN):\s*/i, "").trim();
}

export default function App() {
  const [conceptInput, setConceptInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SederhanainData | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ email: string; sub: string; name?: string; picture?: string } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("sederhanain_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClose = () => setIsProfileOpen(false);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [isProfileOpen]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!data) return;
      if (e.key === "ArrowLeft") {
        setCurrentStepIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentStepIdx((prev) => Math.min(data.simulationSteps.length - 1, prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setToken(tokenResponse.access_token);
      const profile = await fetchUserProfile(tokenResponse.access_token);
      executeAnalysis(conceptInput, tokenResponse.access_token, profile?.sub);
    },
    onError: () => alert('Google Login Failed'),
  });

  const executeAnalysis = async (concept: string, currentToken?: string, activeProfileSub?: string) => {
    if (!concept.trim()) return;

    const activeToken = currentToken || token;
    if (!activeToken) {
      login();
      return;
    }

    setIsLoading(true);
    setData(null);
    setCurrentStepIdx(0);

    try {
      const res = await fetch("/api/analogize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify({ concept }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);

      // Save successful result to local storage history (namespaced by Google user profile if logged in)
      setHistory(prev => {
        const filtered = prev.filter(item => item.concept.toLowerCase() !== concept.toLowerCase());
        const updated = [{ concept, data: json, timestamp: Date.now() }, ...filtered].slice(0, 5);
        try {
          const sub = activeProfileSub || userProfile?.sub;
          const key = sub ? `sederhanain_history_${sub}` : "sederhanain_history";
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      login();
      return;
    }
    executeAnalysis(conceptInput);
  };

  const handleSuggest = (topic: string) => {
    const cleanTopic = topic.split(" ").slice(1).join(" ");
    setConceptInput(cleanTopic);
  };

  const filteredHistory = history.filter(item =>
    item.concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.data.analogyTheme.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProfileMenu = () => {
    if (!token || !userProfile) return null;

    const initial = (userProfile.name || userProfile.email || "?").charAt(0).toUpperCase();

    return (
      <div className="relative z-50 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileOpen((prev) => !prev);
          }}
          className="w-9 h-9 rounded-full border border-white/10 hover:border-emerald-500/50 shadow-md hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all duration-300 relative overflow-hidden flex items-center justify-center shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-zinc-950"
        >
          {userProfile.picture ? (
            <img
              src={userProfile.picture}
              alt={userProfile.name || userProfile.email}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-sm font-mono font-bold text-white uppercase select-none">
              {initial}
            </div>
          )}
        </button>

        {isProfileOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 mt-2.5 w-60 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-2 z-[999] animate-in fade-in slide-in-from-top-2 duration-150 origin-top-right text-left"
          >
            {/* User details */}
            <div className="px-3 py-2.5">
              {userProfile.name && (
                <div className="text-xs font-bold text-zinc-100 truncate mb-0.5">
                  {userProfile.name}
                </div>
              )}
              <div className="text-[10px] font-mono text-zinc-500 truncate">
                {userProfile.email}
              </div>
            </div>

            <div className="border-t border-zinc-800 my-1"></div>

            {/* Logout button */}
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false);
                handleLogout();
              }}
              className="w-full text-left p-2.5 rounded-xl hover:bg-red-500/10 text-zinc-400 hover:text-red-400 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors duration-150"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-white ${data ? "md:h-screen md:overflow-hidden" : ""}`}>
      <AnimatePresence>
        {(data || isLoading) && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            className="h-20 px-8 flex items-center justify-between border-b border-white/10 shrink-0"
          >
            <div className="flex items-baseline gap-3">
              <button
                onClick={() => { setData(null); setIsLoading(false); setConceptInput(''); }}
                className="text-2xl font-black tracking-tighter uppercase text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Sederhanain.
              </button>
              <span className="hidden md:inline text-[10px] uppercase tracking-[0.3em] font-medium text-white/40">AI Concept Visualizer</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCommandOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-mono text-emerald-400 font-semibold shadow-lg transition duration-200 cursor-pointer shrink-0"
              >
                <Command className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CARI RIWAYAT</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] bg-black border border-white/10 text-zinc-500 rounded font-bold">
                  Ctrl + K
                </kbd>
              </button>

              <motion.form layoutId="search-form" onSubmit={handleSubmit} className="flex gap-2 w-full max-w-[300px] md:max-w-md hidden md:flex">
                <motion.input
                  layoutId="search-input"
                  type="text"
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-emerald-400 transition-colors placeholder:text-white/40 font-mono"
                  placeholder="Ketik konsep..."
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                />
                <motion.button
                  layoutId="search-button"
                  type="submit"
                  disabled={isLoading}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full font-bold uppercase tracking-wider text-[10px] hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[100px]"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analisis"}
                </motion.button>
              </motion.form>

              {renderProfileMenu()}
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className={`flex-1 flex flex-col-reverse md:flex-row relative ${data ? "md:h-[calc(100vh-80px)] md:overflow-hidden" : ""}`}>
        {!data && !isLoading && (
          <div className="w-full flex flex-col items-center relative z-10">
            {/* LOGOUT BUTTON FOR LOGGED IN USERS ON LANDING PAGE */}
            {token && (
              <div className="absolute top-6 right-8 z-50">
                {renderProfileMenu()}
              </div>
            )}

            {/* BACKGROUND GRID */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              {/* Fixed gradients so they don't block the grid below */}
              <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#050505] to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-[#050505] to-transparent"></div>

              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-[100%] blur-[120px]"></div>
              <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-[100%] blur-[150px]"></div>
            </div>

            {/* FOLD 1: HERO SECTION */}
            <div className="min-h-screen flex flex-col items-center justify-center pt-12 pb-24 px-6 w-full relative z-10">
              <div className="flex flex-col items-center text-center max-w-4xl w-full">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  SEDERHANAIN.
                </h1>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                  Bikin Konsep Rumit Jadi Sederhana.
                </h2>
                <p className="text-sm md:text-lg text-white/60 max-w-2xl mb-12 leading-relaxed font-medium">
                  Platform interaktif berbasis Generative UI yang mengubah teori kaku, istilah IT, hingga fenomena sains menjadi simulasi analogi dunia nyata secara real-time.
                </p>

                <motion.form layoutId="search-form" onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 w-full max-w-3xl relative z-10">
                  <motion.input
                    layoutId="search-input"
                    type="text"
                    autoFocus
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-full px-8 py-5 text-lg focus:outline-none focus:border-emerald-400 focus:bg-white/[0.05] focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-white/30 font-mono text-center md:text-left shadow-inner"
                    placeholder="Ketik topik: Misal WebSockets..."
                    value={conceptInput}
                    onChange={(e) => setConceptInput(e.target.value)}
                  />
                  <motion.button
                    layoutId="search-button"
                    type="submit"
                    disabled={isLoading || !conceptInput.trim()}
                    className="bg-emerald-500 text-black px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-emerald-400 transition-all disabled:opacity-50 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 shrink-0 border border-emerald-400 relative overflow-hidden group min-w-[160px]"
                  >
                    <span className="relative z-10">Analisis</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </motion.button>
                </motion.form>

                {!token && (
                  <div className="mt-6 flex justify-center relative z-20">
                    <button
                      type="button"
                      onClick={() => login()}
                      className="flex items-center gap-2.5 px-4 py-2 bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-xl font-mono text-xs text-zinc-600 hover:text-zinc-300 transition-all duration-300 shadow-md animate-in fade-in cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-zinc-700 animate-pulse" />
                      <span>Lihat Riwayat Analisis Anda <strong className="text-emerald-500 font-semibold hover:underline">• Masuk</strong></span>
                    </button>
                  </div>
                )}

                {history.length > 0 && (
                  <div className="mt-8 flex justify-center relative z-20">
                    <button
                      type="button"
                      onClick={() => setIsCommandOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-mono text-emerald-400 font-semibold shadow-lg transition duration-200 cursor-pointer"
                    >
                      <Command className="w-3.5 h-3.5" />
                      <span>CARI RIWAYAT ANDA ({history.length})</span>
                    </button>
                  </div>
                )}

                {/* TOPIK POPULER SECTION */}
                <div className="mt-14 flex flex-col items-center relative z-10 w-full overflow-hidden">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 mb-4">Topik Populer:</span>

                  {/* Marquee Container with Gradient Mask */}
                  <div className="relative flex flex-col gap-3 w-full max-w-5xl overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-16 before:bg-gradient-to-r before:from-[#050505] before:to-transparent before:z-10 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-16 after:bg-gradient-to-l after:from-[#050505] after:to-transparent after:z-10">

                    {/* Row 1: Left */}
                    <div className="flex w-fit animate-marquee-left hover:[animation-play-state:paused]">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex gap-2 px-1">
                          {[
                            "🌐 WebSockets", "🪐 Black Hole", "💸 Inflasi Ekonomi", "🍃 Fotosintesis", "🪐 Entanglement Kuantum",
                            "🌠 Supernova", "📈 Supply & Demand", "🛑 Deadlock Mutual", "⚖️ Load Balancer", "🐈 Kucing Schrödinger"
                          ].map((topic, j) => (
                            <button
                              key={`${i}-${j}`}
                              type="button"
                              onClick={() => handleSuggest(topic)}
                              className="bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/50 px-4 py-2 rounded-full text-xs font-medium transition-all text-white/70 hover:text-emerald-400 whitespace-nowrap"
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Row 2: Right */}
                    <div className="flex w-fit animate-marquee-right hover:[animation-play-state:paused]">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex gap-2 px-1">
                          {[
                            "🔄 Asynchronous vs Synchronous", "⚛️ Quantum Computing", "🔄 Compound Interest", "🛡️ Sistem Imun", "🐳 Docker Container",
                            "⏳ Teori Relativitas", "🔒 SSL/TLS Handshake", "🧠 Efek Placebo", "🏎️ Race Condition", "🔥 Burnout"
                          ].map((topic, j) => (
                            <button
                              key={`${i}-${j}`}
                              type="button"
                              onClick={() => handleSuggest(topic)}
                              className="bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/50 px-4 py-2 rounded-full text-xs font-medium transition-all text-white/70 hover:text-emerald-400 whitespace-nowrap"
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              </div>

              {/* Scroll indicator down */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/20 hidden md:block">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* FOLD 2+: CARA KERJA SECTION & OTHERS */}
            <div className="w-full flex flex-col items-center px-6 pb-0 relative z-10">
              <div className="w-full max-w-5xl pt-16 mt-16 mb-12 relative flex flex-col items-center">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-center">Bagaimana Sederhanain Bekerja? 🤔</h2>
                <p className="text-white/50 text-center max-w-xl leading-relaxed">Hanya butuh tiga langkah simpel untuk mengubah teks buku yang membosankan menjadi cerita visual yang nempel di otak.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full pb-20 relative z-10">
                <div className="group bg-gradient-to-b from-emerald-500/[0.02] hover:from-emerald-500/[0.08] to-transparent border border-emerald-500/10 hover:border-emerald-500/30 p-8 rounded-3xl flex flex-col items-center text-center relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.3)] md:pointer-events-auto cursor-default">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent group-hover:w-2/3 transition-all duration-700 opacity-0 group-hover:opacity-100"></div>
                  <div className="w-14 h-14 bg-white/5 group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:ring-1 group-hover:ring-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1">⌨️</div>
                  <h3 className="font-bold text-lg mb-3 tracking-tight group-hover:text-emerald-400 transition-colors duration-300">Ketik Topikmu</h3>
                  <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/70 transition-colors duration-300">Masukkan istilah abstrak apa saja, mulai dari WebSockets, Inflasi, hingga Black Hole.</p>
                </div>
                <div className="group bg-gradient-to-b from-emerald-500/[0.02] hover:from-emerald-500/[0.08] to-transparent border border-emerald-500/10 hover:border-emerald-500/30 p-8 rounded-3xl flex flex-col items-center text-center relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.3)] md:pointer-events-auto cursor-default">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent group-hover:w-2/3 transition-all duration-700 opacity-0 group-hover:opacity-100"></div>
                  <div className="w-14 h-14 bg-white/5 group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:ring-1 group-hover:ring-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1">🧠</div>
                  <h3 className="font-bold text-lg mb-3 tracking-tight group-hover:text-emerald-400 transition-colors duration-300">AI Meracik Analogi</h3>
                  <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/70 transition-colors duration-300">Mesin Sederhanain menerjemahkan teori kaku menjadi skenario cerita sehari-hari.</p>
                </div>
                <div className="group bg-gradient-to-b from-emerald-500/[0.02] hover:from-emerald-500/[0.08] to-transparent border border-emerald-500/10 hover:border-emerald-500/30 p-8 rounded-3xl flex flex-col items-center text-center relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.3)] md:pointer-events-auto cursor-default">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent group-hover:w-2/3 transition-all duration-700 opacity-0 group-hover:opacity-100"></div>
                  <div className="w-14 h-14 bg-white/5 group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:ring-1 group-hover:ring-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1">🚀</div>
                  <h3 className="font-bold text-lg mb-3 tracking-tight group-hover:text-emerald-400 transition-colors duration-300">Mainkan Simulasi</h3>
                  <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/70 transition-colors duration-300">Lihat visualisasi interaktif langkah-demi-langkah yang bergerak dinamis di layarmu.</p>
                </div>
              </div>

              {/* SEKILAS SHOWCASE SECTION */}
              <div className="w-full max-w-5xl mt-12 mb-32 relative z-10 flex flex-col items-center">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4 text-center">Dari Teori Kaku Menjadi Cerita Seru</h2>
                <p className="text-white/50 mb-12 text-center max-w-2xl leading-relaxed">Bandingkan sendiri bagaimana Sederhanain mengubah bahasa teknis yang membosankan menjadi analogi visual yang mudah dicerna otak.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                  {/* Sebelum */}
                  <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl opacity-80 filter grayscale hover:grayscale-0 transition-all duration-500 group">
                    <span className="inline-block bg-white/10 text-white/50 text-xs px-3 py-1 rounded-full mb-6 font-mono font-medium">Buku Teks / Wikipedia</span>
                    <h3 className="text-xl font-bold mb-4 font-serif group-hover:text-white transition-colors">Definisi WebSockets</h3>
                    <p className="text-sm text-white/40 leading-relaxed font-mono">
                      "WebSocket adalah protokol komunikasi komputer, yang menyediakan full-duplex communication channels atas koneksi TCP tunggal. Protokol WebSocket distandarisasi oleh IETF sebagai RFC 6455..."
                    </p>
                    <div className="mt-8 flex items-center justify-center text-5xl py-8 opacity-20 group-hover:opacity-50 transition-opacity">😴</div>
                  </div>

                  {/* Sesudah */}
                  <div className="bg-gradient-to-b from-emerald-500/[0.08] to-transparent border border-emerald-500/30 p-8 rounded-3xl relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_15px_40px_-20px_rgba(16,185,129,0.3)] transition-all duration-500">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <span className="text-7xl">🔥</span>
                    </div>
                    <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full mb-6 font-mono font-medium border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">Hasil Sederhanain</span>
                    <h3 className="text-xl font-bold mb-4 text-white">Analogi: Pipa Air 2 Arah</h3>
                    <p className="text-sm text-white/80 leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5">
                      "Bayangkan sebuah <b className="text-emerald-400 font-bold">pipa air ajaib</b> di mana air bisa mengalir dari dua arah sekaligus tanpa harus menunggu giliran. Tidak perlu cape bertanya 'halo, apakah ada air?' setiap detik (polling). Begitu air siap, ia akan langsung menyembur ke arahmu!"
                    </p>
                    <div className="mt-8 flex gap-3 text-sm font-medium">
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Intuitif</span>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg">Real-time</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TESTIMONIAL SECTION */}
              <div className="w-full max-w-5xl mb-32 relative z-10 flex flex-col items-center">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-12 text-center">Telah Membantu Ribuan Otak Mencerna Teori</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors duration-300">
                    <div className="flex gap-1 text-emerald-400 mb-6 text-xs">★★★★★</div>
                    <p className="text-sm text-white/70 leading-relaxed mb-8">"Gue mahasiswa IT tapi suka blank kalau baca dokumentasi AWS. Masukin ke sini, tiba-tiba ngerti konsep Load Balancer lewat analogi tukang parkir. Gila sih!"</p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white/10 shadow-lg">AJ</div>
                      <div>
                        <div className="text-sm font-bold">Aji Pangestu</div>
                        <div className="text-xs text-white/40">Mahasiswa Ilmu Komputer</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors duration-300">
                    <div className="flex gap-1 text-emerald-400 mb-6 text-xs">★★★★★</div>
                    <p className="text-sm text-white/70 leading-relaxed mb-8">"Dulu susah banget jelasin inflasi ke murid SMA. Berkat Sederhanain, mereka ngerti lewat simulasi harga cilok yang makin naik karena uang yang beredar bertambah."</p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white/10 shadow-lg">SM</div>
                      <div>
                        <div className="text-sm font-bold">Sarah Monica</div>
                        <div className="text-xs text-white/40">Guru Ekonomi SMA</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors duration-300">
                    <div className="flex gap-1 text-emerald-400 mb-6 text-xs">★★★★★</div>
                    <p className="text-sm text-white/70 leading-relaxed mb-8">"Aplikasi ini parah kerennya. Gue yang orang bisnis jadi paham bedanya API sama Webhook cuma dalam 10 detik baca analogi pelayan restoran. Sangat membantu kerja!"</p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white/10 shadow-lg">BW</div>
                      <div>
                        <div className="text-sm font-bold">Budi Waseso</div>
                        <div className="text-xs text-white/40">Product/Project Manager</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ SECTION */}
              <div className="w-full max-w-3xl mb-32 relative z-10 flex flex-col items-center">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-center">Pertanyaan yang Sering Muncul 🤔</h2>
                <p className="text-white/50 mb-10 text-center text-sm md:text-base">Mungkin kamu punya salah satu pertanyaan ini.</p>

                <div className="w-full flex flex-col gap-4">
                  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl group hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-300">
                    <h3 className="font-bold text-emerald-400 mb-2 flex justify-between items-center">
                      Apakah Sederhanain 100% gratis?
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed mt-2">Ya! Karena ini masih versi Beta eksploratif, kamu bisa menganalisis topik apa saja tanpa batasan kuota pencarian setiap hari.</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl group hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-300">
                    <h3 className="font-bold text-emerald-400 mb-2 flex justify-between items-center">
                      Teknologi gila apa yang ada di baliknya?
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed mt-2">Kami mengandalkan kombinasi ajaib dari <b>Google Gemini API</b> (untuk bernalar luar biasa dan meracik analogi), serta <b>React & Tailwind</b> untuk merender UI yang interaktif (Generative UI) secara instan.</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl group hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-300">
                    <h3 className="font-bold text-emerald-400 mb-2 flex justify-between items-center">
                      Topik apa yang pas dicoba?
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed mt-2">Bebas! Cobalah memasukkan kata kunci bidang IT (seperti Docker, Kubernetes, React Effect), Teori Fisika (Relativitas, Kucing Schrödinger), sampai istilah Finansial (Inflasi, Deflasi, Reksadana).</p>
                  </div>
                </div>
              </div>


              <div className="w-full shrink-0 relative z-10 mt-auto">
                {/* CTA SECTION */}
                <div className="max-w-4xl mx-auto px-6 py-20 md:py-24 flex flex-col items-center text-center">
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-6">
                    Siap Mencerna <span className="text-emerald-400">Konsep Rumit?</span>
                  </h2>
                  <p className="text-white/60 mb-10 max-w-xl leading-relaxed">
                    Berhenti membuang waktu memahami dokumentasi yang membosankan. Biarkan AI kami yang menerjemahkannya ke dalam bahasa manusia untukmu.
                  </p>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="bg-emerald-500 hover:bg-emerald-400 text-[#050505] px-8 py-4 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                  >
                    Mulai Coba Gratis 🚀
                  </button>
                </div>

                {/* FOOTER */}
                <footer className="w-full border-t border-white/5 px-6 py-12 md:px-12 relative z-10">
                  <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
                      {/* Brand & Description */}
                      <div className="col-span-1 md:col-span-4 flex flex-col gap-4">
                        <span className="text-2xl font-black tracking-tighter uppercase text-emerald-400">
                          Sederhanain.
                        </span>
                        <p className="text-sm text-white/50 leading-relaxed pr-4">
                          Mengubah konsep abstrak dan teori yang rumit menjadi analogi interaktif yang menyenangkan. Belajar tidak pernah se-intuitif ini.
                        </p>
                      </div>

                      {/* Quick Links & Disclaimer */}
                      <div className="col-span-1 md:col-span-8 flex flex-col sm:flex-row gap-10 md:justify-end">
                        <div className="flex flex-col gap-4">
                          <h4 className="text-emerald-400 font-bold mb-1 uppercase tracking-wider text-xs">Quick Links</h4>
                          <a href="#" className="text-sm text-white/60 hover:text-emerald-400 hover:translate-x-1 transition-all w-fit">Tentang Kami</a>
                          <a href="#" className="text-sm text-white/60 hover:text-emerald-400 hover:translate-x-1 transition-all w-fit">GitHub Repository</a>
                          <a href="#" className="text-sm text-white/60 hover:text-emerald-400 hover:translate-x-1 transition-all w-fit">Privacy Policy</a>
                        </div>

                        <div className="flex flex-col gap-4 max-w-sm">
                          <h4 className="text-emerald-400 font-bold mb-1 uppercase tracking-wider text-xs">AI Disclaimer 🤖</h4>
                          <p className="text-xs text-white/40 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                            Platform ini ditenagai oleh Generative AI. Analogi yang dihasilkan mungkin tidak 100% akurat secara teknis atau saintifik. Gunakan aplikasi ini sebagai jembatan pemahaman awal, bukan sumber kebenaran mutlak.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Copyright */}
                    <div className="border-t border-white/10 pt-8 flex flex-col-reverse md:flex-row justify-between items-center gap-4 text-xs text-white/40 font-mono tracking-wide">
                      <p>© 2026 Sederhanain. All rights reserved.</p>
                      <p>Built with Google AI Studio</p>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-emerald-400">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="animate-pulse tracking-[0.2em] text-[11px] uppercase font-bold">Merakit Analogi...</p>
          </div>
        )}

        {data && (
          <>
            <aside className="w-full md:w-[340px] border-r border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md p-6 md:p-8 flex flex-col shrink-0 relative z-20 shadow-2xl md:h-full md:overflow-y-auto md:[&::-webkit-scrollbar]:w-1.5 md:[&::-webkit-scrollbar-track]:bg-transparent md:[&::-webkit-scrollbar-thumb]:bg-white/10 md:[&::-webkit-scrollbar-thumb]:rounded-full md:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
              <div className="mb-8">
                <h2 className="text-[11px] uppercase tracking-[0.2em] text-emerald-400 font-bold mb-2">Tema Analogi</h2>
                <h3 className="text-2xl md:text-3xl font-light leading-tight mb-3">{data.analogyTheme}</h3>
                <p className="text-sm text-white/50 leading-relaxed font-light">
                  {data.overview}
                </p>
              </div>

              <div className="space-y-1 mb-6 flex-1 md:overflow-y-visible overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                {data.simulationSteps.map((step, idx) => {
                  const isActive = idx === currentStepIdx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setCurrentStepIdx(idx)}
                      className={`relative pl-8 border-l py-2 cursor-pointer transition-all duration-300 group
                        ${idx <= currentStepIdx ? 'border-emerald-500' : 'border-white/10'}
                      `}
                    >
                      {/* Timeline dot */}
                      {isActive ? (
                        <div className="absolute -left-[7px] top-2.5 w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                      ) : (
                        <div className={`absolute -left-[5px] top-3 w-2 h-2 rounded-full transition-colors duration-300 
                          ${idx < currentStepIdx ? 'bg-emerald-500/50' : 'bg-white/20 group-hover:bg-white/40'}
                        `}></div>
                      )}

                      {/* Step label */}
                      <h4 className={`text-[10px] uppercase tracking-widest mb-1 transition-colors duration-300 
                        ${isActive ? 'text-emerald-400' : 'text-white/40 group-hover:text-white/60'}
                      `}>Langkah {String(idx + 1).padStart(2, '0')}</h4>

                      {/* Step title — no visualState label */}
                      <p className={`text-sm transition-all duration-300 
                        ${isActive ? 'font-bold text-white' : idx < currentStepIdx ? 'font-medium text-white/70' : 'font-medium text-white/40 group-hover:text-white/60'}
                      `}>
                        {sanitizeTitle(step.title)}
                      </p>

                      {/* Accordion: inline analogy + tech (only for active step) */}
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            key={`detail-${idx}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 flex flex-col gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-4">
                              {/* Analogy */}
                              <div>
                                <span className="text-[9px] uppercase tracking-widest text-emerald-400/70 font-bold block mb-1.5">Ibaratnya:</span>
                                <p className="text-sm text-white/80 leading-relaxed italic py-0.5 font-serif">
                                  "{step.analogyAction}"
                                </p>
                              </div>
                              {/* Reality */}
                              <div>
                                <span className="text-[9px] uppercase tracking-widest font-bold block mb-1.5 text-amber-500">Kenyataannya:</span>
                                <p className="text-[11px] text-white/50 leading-relaxed font-mono">
                                  {step.techAction}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-5">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
                    disabled={currentStepIdx === 0}
                    className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-20 transition-all text-white/70 shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {currentStepIdx < data.simulationSteps.length - 1 ? (
                    <button
                      onClick={() => setCurrentStepIdx(currentStepIdx + 1)}
                      className="flex-1 rounded-xl bg-emerald-500 text-black py-3.5 flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98]"
                    >
                      {/* <span>Langkah {currentStepIdx + 2} dari {data.simulationSteps.length}</span> */}
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { setData(null); setCurrentStepIdx(0); setConceptInput(''); }}
                      className="flex-1 rounded-xl bg-white/10 text-white py-3.5 flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest hover:bg-white/15 transition-all border border-white/10"
                    >
                      <span>Selesai ✓</span>
                    </button>
                  )}
                </div>
              </div>
            </aside>

            <section className="flex-1 relative bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:32px_32px] md:h-full md:overflow-y-auto flex flex-col items-center p-6 md:p-8 md:[&::-webkit-scrollbar]:w-1.5 md:[&::-webkit-scrollbar-track]:bg-transparent md:[&::-webkit-scrollbar-thumb]:bg-white/10 md:[&::-webkit-scrollbar-thumb]:rounded-full md:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
              {/* Status Header */}
              <div className="w-full flex justify-between items-center mb-6 z-30 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data.simulationSteps[currentStepIdx].visualState === 'BROKEN' ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${data.simulationSteps[currentStepIdx].visualState === 'BROKEN' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">ACTIVE STATE SIMULATION</span>
                </div>
                <div className={`px-3 py-1 border rounded-lg text-xs font-mono font-bold tracking-wider ${data.simulationSteps[currentStepIdx].visualState === 'SETUP'
                  ? 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30'
                  : data.simulationSteps[currentStepIdx].visualState === 'PROCESSING'
                    ? 'text-amber-400 bg-amber-950/50 border-amber-500/30'
                    : data.simulationSteps[currentStepIdx].visualState === 'ACTIVE'
                      ? 'text-red-500 bg-red-950/50 border-red-500/30 animate-pulse'
                      : 'text-rose-600 bg-rose-950/60 border-rose-500/40 border-dashed animate-pulse'
                  }`}>
                  {data.simulationSteps[currentStepIdx].visualState === 'SETUP' ? 'SYSTEM READY'
                    : data.simulationSteps[currentStepIdx].visualState === 'PROCESSING' ? 'WARNING: PROCESSING'
                      : data.simulationSteps[currentStepIdx].visualState === 'ACTIVE' ? 'CRITICAL: ACTIVE'
                        : 'DISCONNECTED / FAILURE'}
                </div>
              </div>

              <div className="w-full flex-1 flex flex-col justify-center items-center my-auto pb-6 md:pb-10 z-10">
                {/* System Container Box */}
                <div className={`w-full p-6 rounded-2xl border transition-all duration-500 relative ${data.simulationSteps[currentStepIdx].visualState === 'SETUP'
                  ? 'bg-zinc-950/40 border-white/10'
                  : data.simulationSteps[currentStepIdx].visualState === 'PROCESSING'
                    ? 'bg-amber-950/5 border-amber-950/30'
                    : data.simulationSteps[currentStepIdx].visualState === 'ACTIVE'
                      ? 'bg-red-950/5 border-red-950/30'
                      : 'bg-zinc-950/80 border-rose-950/50 border-dashed'
                  }`}>
                  {/* System label watermark */}
                  <div className="absolute top-2 left-4 text-[9px] font-mono tracking-wider text-white/30 uppercase">
                    🧠 INTERNAL SYSTEM
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStepIdx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                      className="w-full flex justify-center items-center pt-4"
                    >
                      <VisualStage
                        entities={data.entities}
                        visualState={data.simulationSteps[currentStepIdx].visualState}
                        layoutType={data.layoutType}
                        animationConfig={data.simulationSteps[currentStepIdx].animationConfig}
                        currentStepIdx={currentStepIdx}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      {isCommandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          {/* Latar Belakang Gelap Transparan */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsCommandOpen(false)}
          />

          {/* Kotak Pencarian Utama */}
          <div className="bg-zinc-950 border border-zinc-800/80 w-full max-w-xl rounded-2xl shadow-2xl relative z-10 overflow-hidden text-zinc-100">

            {/* INPUT FIELD PENCARIAN */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-zinc-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari konsep, tema analogi, atau riwayat anda..."
                className="w-full bg-transparent border-none text-sm text-zinc-100 placeholder-zinc-500 outline-none font-mono focus:ring-0 focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => setIsCommandOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DAFTAR HASIL PENCARIAN */}
            <div className="max-h-[320px] overflow-y-auto p-2 space-y-4">

              {/* Grup 1: Riwayat Analogi yang Tersedia */}
              <div>
                <span className="px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-zinc-500 block mb-2">
                  RIWAYAT PENCARIAN AKTIF ({filteredHistory.length})
                </span>

                {filteredHistory.length > 0 ? (
                  <div className="space-y-1">
                    {filteredHistory.map((item, idx) => {
                      const isActiveTopic = data && item.concept.toLowerCase() === data.techConcept.toLowerCase();
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setConceptInput(item.concept);
                            setData(item.data);
                            setCurrentStepIdx(0);
                            setIsCommandOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-xl transition duration-150 flex items-center justify-between group cursor-pointer
                            ${isActiveTopic
                              ? 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-400'
                              : 'hover:bg-zinc-900/60 border border-transparent text-zinc-400 hover:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center border transition
                              ${isActiveTopic
                                ? 'bg-emerald-950 border-emerald-500/30 text-emerald-400'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30'
                              }`}
                            >
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-mono text-xs font-bold block">{item.concept}</span>
                              <span className="text-[10px] text-zinc-500 block group-hover:text-zinc-400">{item.data.analogyTheme}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isActiveTopic && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                                AKTIF
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500 text-xs font-mono">
                    <AlertOctagon className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                    Riwayat "{searchQuery}" tidak ditemukan.
                  </div>
                )}
              </div>

              {/* Tips Navigasi */}
              <div className="border-t border-zinc-800 pt-3 px-3 flex justify-between items-center text-[10px] font-mono text-zinc-600">
                <span className="flex items-center gap-1">
                  <span className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded">ESC</span>
                  <span>untuk menutup</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded">Click</span>
                  <span>untuk memuat</span>
                </span>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function VisualStage({
  entities,
  visualState,
  layoutType,
  animationConfig,
  currentStepIdx
}: {
  entities: Entity[],
  visualState: "SETUP" | "PROCESSING" | "ACTIVE" | "BROKEN",
  layoutType: "PIPELINE" | "SPLIT_LANES" | "HUB_AND_SPOKE",
  animationConfig: AnimationConfig,
  currentStepIdx: number
}) {
  const isVertical = layoutType === "SPLIT_LANES";
  let layoutClasses = "flex-row items-center justify-center";
  if (isVertical) {
    layoutClasses = "flex-col items-center justify-center";
  } else if (layoutType === "HUB_AND_SPOKE") {
    layoutClasses = "flex-row items-center justify-center flex-wrap gap-y-8";
  }

  // Connection styling based on visual state
  const strokeColor =
    visualState === 'SETUP' ? '#10b981' :
      visualState === 'PROCESSING' ? '#f59e0b' :
        visualState === 'ACTIVE' ? '#ef4444' : '#52525b';
  const flowClass =
    visualState === 'SETUP' ? 'conduit-flow-active' :
      visualState === 'PROCESSING' ? 'conduit-flow-stress' :
        visualState === 'ACTIVE' ? 'conduit-flow-critical' : '';
  const labelText =
    visualState === 'BROKEN' ? 'TERPUTUS' :
      animationConfig.direction === 'forward' ? 'Mengalir Ke' :
        animationConfig.direction === 'backward' ? 'Dikembalikan' :
          animationConfig.direction === 'bidirectional' ? 'Saling Terhubung' : 'Terhubung';
  const isBroken = visualState === 'BROKEN';

  return (
    <div className={`relative w-full min-h-[400px] flex ${layoutClasses} z-10 px-4 md:px-12 py-12 gap-10 max-[640px]:scale-[0.6] max-[640px]:flex-nowrap origin-center transition-transform duration-300`}>

      {entities.flatMap((ent, idx) => {
        const isAnimatedNode = visualState === "PROCESSING" || visualState === "ACTIVE";
        const stepVisual = ent.stepVisuals?.[currentStepIdx];
        const hasSvg = stepVisual?.svgContent;
        const primaryColor = stepVisual?.primaryColor || (visualState === 'BROKEN' ? '#e11d48' : '#10b981');

        // Dynamic border/glow colors based on stepVisual primaryColor
        const borderColor = hasSvg ? primaryColor : (visualState === 'BROKEN' ? '#ef4444' : '#10b981');
        const glowOpacity = visualState === 'ACTIVE' ? '0.4' : visualState === 'PROCESSING' ? '0.25' : '0.15';

        const items: React.ReactNode[] = [];

        items.push(
          <motion.div
            key={ent.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: visualState === "BROKEN" ? [1, 1.1, 0.9, 1] : (isAnimatedNode && animationConfig.effect === "pulse" ? [1, 1.1, 1] : 1),
              rotate: isAnimatedNode && animationConfig.effect === "spin" ? 360 : 0,
              x: isAnimatedNode && animationConfig.effect === "shake" ? [0, -5, 5, -5, 5, 0] : 0,
              opacity: 1
            }}
            transition={{
              duration: animationConfig.speed === "fast" ? 0.2 : (animationConfig.speed === "slow" ? 1.5 : 0.5),
              delay: idx * 0.1,
              repeat: isAnimatedNode && ["pulse", "spin", "shake"].includes(animationConfig.effect) ? Infinity : 0
            }}
            className="relative flex flex-col items-center z-20 w-32 md:w-40 text-center"
          >
            <div
              className={`w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full border-4 flex items-center justify-center bg-[#050505] transition-all duration-500 ${visualState === 'BROKEN' ? 'border-dashed' : ''
                } ${visualState === 'ACTIVE' ? 'animate-pulse' : ''}`}
              style={{
                borderColor: borderColor,
                boxShadow: `0 0 15px rgba(${hexToRgb(borderColor)}, ${glowOpacity})`,
              }}
            >
              {hasSvg ? (
                /* Render AI-generated SVG content */
                <svg
                  className="w-12 h-12 md:w-14 md:h-14 transition-all duration-500"
                  viewBox="0 0 64 64"
                  fill="none"
                  dangerouslySetInnerHTML={{ __html: stepVisual!.svgContent }}
                />
              ) : (
                /* Emoji fallback for backwards compatibility */
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl ${visualState === 'BROKEN' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                  {ent.visualAsset || <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${visualState === 'BROKEN' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-col items-center gap-1.5 w-full bg-[#050505]/60 p-2 rounded-xl backdrop-blur-sm border border-white/5">
              <span className="text-[9px] md:text-[10px] font-mono tracking-widest text-white/40 uppercase px-2 py-0.5 rounded shadow whitespace-normal break-words max-w-full leading-tight">{ent.techName}</span>
              <span className="text-xs md:text-sm font-medium text-white text-center whitespace-normal break-words max-w-full leading-snug">{ent.analogyName}</span>
            </div>
          </motion.div>
        );

        // Connection segment between entities (inline, node-to-node)
        if (idx < entities.length - 1) {
          items.push(
            <div
              key={`conn-${idx}`}
              className={`flex items-center justify-center relative z-10 ${isVertical
                ? 'h-14 w-full flex-col'
                : 'flex-1 min-w-[40px] max-w-[100px] self-center'
                }`}
            >
              {isBroken ? (
                <svg
                  className={isVertical ? 'h-full w-6' : 'w-full h-6'}
                  viewBox={isVertical ? '0 0 20 60' : '0 0 100 20'}
                  fill="none"
                >
                  {isVertical ? (
                    <>
                      <line x1="10" y1="2" x2="10" y2="24" stroke="#52525b" strokeWidth="3" strokeDasharray="4 6" />
                      <line x1="10" y1="36" x2="10" y2="58" stroke="#52525b" strokeWidth="3" strokeDasharray="4 6" />
                    </>
                  ) : (
                    <>
                      <line x1="2" y1="10" x2="42" y2="10" stroke="#52525b" strokeWidth="3" strokeDasharray="4 6" />
                      <line x1="58" y1="10" x2="98" y2="10" stroke="#52525b" strokeWidth="3" strokeDasharray="4 6" />
                    </>
                  )}
                </svg>
              ) : (
                <svg
                  className={isVertical ? 'h-full w-6' : 'w-full h-6'}
                  viewBox={isVertical ? '0 0 20 60' : '0 0 100 20'}
                  fill="none"
                  style={{ filter: `drop-shadow(0 0 6px ${strokeColor}40)` }}
                >
                  {isVertical ? (
                    <line x1="10" y1="2" x2="10" y2="58" stroke={strokeColor} strokeWidth="3" strokeDasharray="8, 6" className={flowClass} />
                  ) : (
                    <line x1="2" y1="10" x2="98" y2="10" stroke={strokeColor} strokeWidth="3" strokeDasharray="8, 6" className={flowClass} />
                  )}
                </svg>
              )}
              {/* Relational label at midpoint */}
              <span className={`absolute ${isVertical ? 'left-8' : '-bottom-5'} px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-tight uppercase whitespace-nowrap border bg-zinc-950 z-30 ${isBroken ? 'border-red-500/30 text-red-500/60' : 'border-white/10 text-white/40'
                }`}>
                {labelText}
              </span>
            </div>
          );
        }

        return items;
      })}
    </div>
  );
}

/** Convert hex color to r, g, b string for use in rgba() */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '16, 185, 129';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

