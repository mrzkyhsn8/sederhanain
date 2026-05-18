/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ChevronRight, ChevronLeft, LogOut } from "lucide-react";
import { useGoogleLogin, googleLogout } from '@react-oauth/google';

interface Entity {
  id: string;
  techName: string;
  analogyName: string;
  description: string;
  visualAsset: string;
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
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("sederhanain_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
    onSuccess: (tokenResponse) => {
      setToken(tokenResponse.access_token);
      executeAnalysis(conceptInput, tokenResponse.access_token);
    },
    onError: () => alert('Google Login Failed'),
  });

  const executeAnalysis = async (concept: string, currentToken?: string) => {
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

      // Save successful result to local storage history
      setHistory(prev => {
        const filtered = prev.filter(item => item.concept.toLowerCase() !== concept.toLowerCase());
        const updated = [{ concept, data: json, timestamp: Date.now() }, ...filtered].slice(0, 5);
        try {
          localStorage.setItem("sederhanain_history", JSON.stringify(updated));
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

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <AnimatePresence>
        {(data || isLoading) && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-20 px-8 flex items-center justify-between border-b border-white/10 shrink-0"
          >
            <div className="flex items-baseline gap-3">
              <button
                onClick={() => { setData(null); setIsLoading(false); setConceptInput(''); }}
                className="text-2xl font-black tracking-tighter uppercase text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Sederhanain.
              </button>
              <span className="hidden md:inline text-[10px] uppercase tracking-[0.3em] font-medium text-white/40">AI Concept Visualizer v2.0</span>
            </div>

            <div className="flex items-center gap-4">
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

              {!token ? null : (
                <button
                  onClick={() => {
                    googleLogout();
                    setToken(null);
                  }}
                  className="text-white/50 hover:text-white text-xs flex items-center gap-1 border border-white/10 px-3 py-1.5 rounded-full"
                >
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              )}
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col-reverse md:flex-row relative">
        {!data && !isLoading && (
          <div className="w-full flex flex-col items-center relative z-10">
            {/* LOGOUT BUTTON FOR LOGGED IN USERS ON LANDING PAGE */}
            {token && (
              <div className="absolute top-6 right-8 z-50">
                <button
                  onClick={() => {
                    googleLogout();
                    setToken(null);
                  }}
                  className="text-white/50 hover:text-white text-xs flex items-center gap-1 border border-white/10 px-3 py-1.5 rounded-full bg-[#050505]/50 backdrop-blur-sm hover:border-white/20 transition-all"
                >
                  <LogOut className="w-3 h-3" /> Logout
                </button>
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

                {history.length > 0 && (
                  <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl relative z-20">
                    <span className="text-[10px] w-full text-center uppercase tracking-[0.3em] font-bold text-white/40 mb-1">Riwayat Analisis Anda:</span>
                    {history.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setConceptInput(item.concept);
                          setData(item.data);
                        }}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 px-4 py-2 rounded-full text-xs font-semibold text-emerald-400 transition-all shadow-md shadow-emerald-500/5 hover:-translate-y-0.5 cursor-pointer"
                      >
                        {item.concept}
                      </button>
                    ))}
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
            <aside className="w-full md:w-[340px] border-r border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md p-6 md:p-8 flex flex-col shrink-0 relative z-20 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-[11px] uppercase tracking-[0.2em] text-emerald-400 font-bold mb-2">Tema Analogi</h2>
                <h3 className="text-2xl md:text-3xl font-light leading-tight mb-3">{data.analogyTheme}</h3>
                <p className="text-sm text-white/50 leading-relaxed font-light">
                  {data.overview}
                </p>
              </div>

              <div className="space-y-6 mb-8 flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                {data.simulationSteps.map((step, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentStepIdx(idx)}
                    className={`relative pl-8 border-l py-1 cursor-pointer transition-all duration-300 group
                      ${idx <= currentStepIdx ? 'border-emerald-500' : 'border-white/10'}
                    `}
                  >
                    {idx === currentStepIdx ? (
                      <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    ) : (
                      <div className={`absolute -left-[5px] top-2 w-2 h-2 rounded-full transition-colors duration-300 
                        ${idx < currentStepIdx ? 'bg-emerald-500/50' : 'bg-white/20 group-hover:bg-white/40'}
                      `}></div>
                    )}
                    <h4 className={`text-[10px] uppercase tracking-widest mb-1 transition-colors duration-300 
                      ${idx === currentStepIdx ? 'text-emerald-400' : 'text-white/40 group-hover:text-white/60'}
                    `}>Langkah 0{idx + 1}</h4>
                    <p className={`text-sm transition-all duration-300 
                      ${idx === currentStepIdx ? 'font-bold text-white' : idx < currentStepIdx ? 'font-medium text-white/70' : 'font-medium text-white/40 group-hover:text-white/60'}
                    `}>
                      {step.visualState}: {sanitizeTitle(step.title)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-4 border-t border-white/10 pt-6">
                <div className="min-h-[96px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStepIdx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="flex flex-col gap-2"
                    >
                      <p className="text-sm text-white/80 leading-relaxed italic border-l block border-emerald-500/50 pl-3 py-1 font-serif line-clamp-2">
                        "{data.simulationSteps[currentStepIdx].analogyAction}"
                      </p>
                      <p className="text-[10px] tracking-wider uppercase text-emerald-400/60 font-mono">
                        <span className="opacity-50">TECH:</span> {data.simulationSteps[currentStepIdx].techAction}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
                    disabled={currentStepIdx === 0}
                    className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-20 transition-all text-white/70"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentStepIdx(Math.min(data.simulationSteps.length - 1, currentStepIdx + 1))}
                    disabled={currentStepIdx === data.simulationSteps.length - 1}
                    className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center gap-2 font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-500/20 disabled:opacity-20 transition-all disabled:hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <span>Next Step</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </aside>

            <section className="flex-1 relative bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:32px_32px] overflow-hidden flex items-center justify-center min-h-[50vh] md:min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStepIdx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full flex justify-center items-center absolute inset-0"
                >
                  <VisualStage
                    entities={data.entities}
                    visualState={data.simulationSteps[currentStepIdx].visualState}
                    layoutType={data.layoutType}
                    animationConfig={data.simulationSteps[currentStepIdx].animationConfig}
                  />
                </motion.div>
              </AnimatePresence>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function VisualStage({
  entities,
  visualState,
  layoutType,
  animationConfig
}: {
  entities: Entity[],
  visualState: "SETUP" | "PROCESSING" | "ACTIVE" | "BROKEN",
  layoutType: "PIPELINE" | "SPLIT_LANES" | "HUB_AND_SPOKE",
  animationConfig: AnimationConfig
}) {
  let layoutClasses = "flex-row items-center justify-between";
  if (layoutType === "SPLIT_LANES") {
    layoutClasses = "flex-col items-center justify-around gap-12 py-8";
  } else if (layoutType === "HUB_AND_SPOKE") {
    layoutClasses = "flex-row items-center justify-center gap-10 md:gap-16 flex-wrap";
  }

  return (
    <div className={`relative w-full max-w-2xl min-h-[400px] flex ${layoutClasses} z-10 px-4 md:px-12 py-12`}>
      {/* Background interaction circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full border border-white/[0.03] animate-pulse"></div>
        <div className="absolute w-[450px] h-[450px] md:w-[600px] md:h-[600px] rounded-full border border-white/[0.02]"></div>
      </div>

      <ConnectionLine visualState={visualState} layoutType={layoutType} animationConfig={animationConfig} />

      {entities.map((ent, idx) => {
        let isAnimatedNode = visualState === "PROCESSING" || visualState === "ACTIVE";
        return (
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
            <div className={`w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full border-4 flex items-center justify-center bg-[#050505] transition-colors duration-500 ${visualState === 'BROKEN' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl ${visualState === 'BROKEN' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                {ent.visualAsset || <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${visualState === 'BROKEN' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>}
              </div>
            </div>
            <div className="mt-4 flex flex-col items-center gap-1.5 w-full bg-[#050505]/60 p-2 rounded-xl backdrop-blur-sm border border-white/5">
              <span className="text-[9px] md:text-[10px] font-mono tracking-widest text-white/40 uppercase bg-black/50 px-2 py-0.5 rounded shadow whitespace-normal break-words max-w-full leading-tight">{ent.techName}</span>
              <span className="text-xs md:text-sm font-medium text-white text-center whitespace-normal break-words max-w-full leading-snug">{ent.analogyName}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ConnectionLine({
  visualState,
  layoutType,
  animationConfig
}: {
  visualState: "SETUP" | "PROCESSING" | "ACTIVE" | "BROKEN",
  layoutType: "PIPELINE" | "SPLIT_LANES" | "HUB_AND_SPOKE",
  animationConfig: AnimationConfig
}) {
  const isVertical = layoutType === "SPLIT_LANES";

  const rotationClass = isVertical ? "rotate-90 origin-center" : "";
  const containerClass = `absolute inset-0 w-full h-full ${visualState === "BROKEN" ? "z-30" : "z-10"} pointer-events-none flex items-center justify-center`;

  if (visualState === "SETUP") {
    return (
      <svg className={`absolute inset-0 w-full h-full z-10 pointer-events-none ${rotationClass}`} style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))' }}>
        <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="8 12" className="opacity-30" />
      </svg>
    );
  }

  if (visualState === "BROKEN") {
    let offsetClass = "-mt-24"; // Pipeline offset
    if (layoutType === "SPLIT_LANES") offsetClass = "ml-32";
    if (layoutType === "HUB_AND_SPOKE") offsetClass = "mt-32";

    return (
      <div className={containerClass}>
        <svg className={`absolute inset-0 w-full h-full pointer-events-none opacity-50 ${rotationClass}`}>
          <line x1="20%" y1="50%" x2="45%" y2="50%" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 8" />
          <line x1="55%" y1="50%" x2="80%" y2="50%" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 8" />
        </svg>
        <div className={`absolute ${offsetClass} bg-black/80 backdrop-blur border border-red-500 text-red-500 text-[9px] uppercase tracking-widest font-bold px-3 py-1 font-mono rounded z-20`}>DISCONNECTED</div>
      </div>
    );
  }

  const animDuration = animationConfig.speed === "fast" ? 0.4 : (animationConfig.speed === "slow" ? 2.0 : 1.0);
  const playState = visualState === "ACTIVE" ? Infinity : 0;
  const isBidirectional = animationConfig.direction === "bidirectional";
  const isBackward = animationConfig.direction === "backward";

  return (
    <div className={containerClass} style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))' }}>
      <svg className={`absolute inset-0 w-full h-full ${rotationClass}`}>
        <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray={visualState === "ACTIVE" ? "none" : "8 12"} className={visualState === "PROCESSING" ? "opacity-50" : ""} />
      </svg>

      {(visualState === "PROCESSING" || visualState === "ACTIVE") && animationConfig.direction !== "none" && animationConfig.effect !== "none" && (
        <div className={`absolute w-[60%] h-2 overflow-hidden flex items-center justify-center ${rotationClass}`}>
          {/* Main stream/dot */}
          <motion.div
            className={`absolute w-2 h-2 rounded-full ${animationConfig.effect === 'stream' ? 'w-full h-[2px] opacity-20 origin-left' : 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)]'}`}
            initial={{ left: isBackward ? "100%" : "0%" }}
            animate={{ left: isBackward ? "0%" : "100%" }}
            transition={{
              duration: animDuration,
              repeat: playState,
              ease: "linear",
              repeatDelay: visualState === "ACTIVE" ? 0.3 : 0
            }}
          />
          {/* Bidirectional secondary stream/dot */}
          {isBidirectional && (
            <motion.div
              className={`absolute w-2 h-2 rounded-full ${animationConfig.effect === 'stream' ? 'w-full h-[2px] opacity-20 origin-right' : 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)]'}`}
              initial={{ left: "100%" }}
              animate={{ left: "0%" }}
              transition={{
                duration: animDuration,
                repeat: playState,
                ease: "linear",
                repeatDelay: visualState === "ACTIVE" ? 0.3 : 0
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

