/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, Lock, History, Volume2, Play, Pause, Square, Share2 } from "lucide-react";
import { SederhanainData } from "./types";
import { STEPS, TRANSLATIONS } from "./constants/translations";
import { useAudioNarrator } from "./hooks/useAudioNarrator";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { InteractiveLoader } from "./components/visualizer/InteractiveLoader";
import { VisualizerCanvas } from "./components/visualizer/VisualizerCanvas";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { Accordion } from "./components/ui/Accordion";
import { CommandPalette } from "./components/ui/CommandPalette";
import { ShareModal } from "./components/ui/ShareModal";

const STYLE = `
@keyframes dashMove{to{stroke-dashoffset:-24}}
.fade-up{animation:fadeUp .35s ease both}
`;
if (typeof document !== 'undefined' && !document.querySelector("#sdhn-svg-style")) {
  const el = document.createElement("style");
  el.id = "sdhn-svg-style";
  el.textContent = STYLE;
  document.head.appendChild(el);
}



export default function App() {
  const [conceptInput, setConceptInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SederhanainData | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [lang, setLang] = useState<"id" | "en">(() => {
    try {
      const saved = localStorage.getItem("sederhanain_lang");
      return (saved === "en" || saved === "id") ? saved : "id";
    } catch {
      return "id";
    }
  });

  const handleLanguageChange = (newLang: "id" | "en") => {
    setLang(newLang);
    try {
      localStorage.setItem("sederhanain_lang", newLang);
    } catch (e) {
      console.error(e);
    }
  };

  // Shareable Insights States
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Hook Integrations
  const {
    token,
    userProfile,
    history,
    login,
    handleLogout,
    deleteHistoryItem,
    saveToHistory,
    setHistory,
  } = useGoogleAuth((accessToken, profileSub) => {
    executeAnalysis(conceptInput, accessToken, profileSub);
  });

  const {
    isPlaying,
    isPaused,
    autoAdvance,
    setAutoAdvance,
    speakStep,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
  } = useAudioNarrator(data, lang, isLoading, setCurrentStepIdx);

  const t = TRANSLATIONS[lang];

  const getBadgeText = (idx: number) => {
    switch (idx) {
      case 0: return t.badgeSecure;
      case 1: return t.badgeWarning;
      case 2: return t.badgeCritical;
      case 3: return t.badgeFailure;
      default: return "";
    }
  };

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!data) return;
      if (e.key === "ArrowLeft") {
        setCurrentStepIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentStepIdx((prev) => Math.min(data.langkah.length - 1, prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data]);

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
        body: JSON.stringify({ concept, lang }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);

      // Save successful result to local storage history
      saveToHistory(concept, json);
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
    item.data.tema.toLowerCase().includes(searchQuery.toLowerCase())
  );




  return (
    <div className={`min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-white ${data ? "md:h-screen md:overflow-hidden" : ""}`}>
      <Header
        data={data}
        isLoading={isLoading}
        conceptInput={conceptInput}
        setConceptInput={setConceptInput}
        token={token}
        userProfile={userProfile}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        setIsCommandOpen={setIsCommandOpen}
        lang={lang}
        handleLanguageChange={handleLanguageChange}
        handleSubmit={handleSubmit}
        handleLogout={handleLogout}
        login={login}
        resetApp={() => { setData(null); setIsLoading(false); setConceptInput(''); }}
      />

      <main className={`flex-1 flex flex-col-reverse md:flex-row relative ${data ? "md:h-[calc(100vh-80px)] md:overflow-hidden" : ""}`}>
        {!data && !isLoading && (
          <div className="w-full flex flex-col items-center relative z-10">


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
            <div className="min-h-screen flex flex-col items-center justify-center pt-32 pb-24 px-6 w-full relative z-10">
              <div className="flex flex-col items-center text-center max-w-4xl w-full">
                {/* <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  SEDERHANAIN.
                </h1> */}
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                  {t.title} <span className="text-emerald-400 italic">{t.titleHighlight}</span>
                </h2>
                <p className="text-sm md:text-lg text-white/60 max-w-2xl mb-12 leading-relaxed font-medium">
                  {t.subtitle}
                </p>

                <motion.form layoutId="search-form" onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 w-full max-w-3xl relative z-10">
                  <motion.input
                    layoutId="search-input"
                    type="text"
                    autoFocus
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-full px-6 py-3 text-lg focus:outline-none focus:border-emerald-400 focus:bg-white/[0.05] focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-white/30 font-mono text-center md:text-left shadow-inner"
                    placeholder={t.placeholder}
                    value={conceptInput}
                    onChange={(e) => setConceptInput(e.target.value)}
                  />
                  <motion.button
                    layoutId="search-button"
                    type="submit"
                    disabled={isLoading || !conceptInput.trim()}
                    className="bg-emerald-500 text-black px-6 py-3 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-emerald-400 transition-all disabled:opacity-50 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 shrink-0 border border-emerald-400 relative overflow-hidden group min-w-[160px]"
                  >
                    <span className="relative z-10">{t.analysisBtn}</span>
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
                      <span>{t.historyAlert} <strong className="text-emerald-500 font-semibold hover:underline">• {t.loginText}</strong></span>
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
                      <History className="w-3.5 h-3.5" />
                      <span>{t.searchHistoryBtn} ({history.length})</span>
                    </button>
                  </div>
                )}

                {/* TOPIK POPULER SECTION */}
                <div className="mt-14 flex flex-col items-center relative z-10 w-full overflow-hidden">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 mb-4">{t.popularTopics}</span>

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
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-center">{t.howTitle}</h2>
                <p className="text-white/50 text-center max-w-xl leading-relaxed">{t.howSubtitle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full pb-20 relative z-10">
                <div className="group bg-gradient-to-b from-emerald-500/[0.02] hover:from-emerald-500/[0.08] to-transparent border border-emerald-500/10 hover:border-emerald-500/30 p-8 rounded-3xl flex flex-col items-center text-center relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.3)] md:pointer-events-auto cursor-default">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent group-hover:w-2/3 transition-all duration-700 opacity-0 group-hover:opacity-100"></div>
                  <div className="w-14 h-14 bg-white/5 group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:ring-1 group-hover:ring-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1">⌨️</div>
                  <h3 className="font-bold text-lg mb-3 tracking-tight group-hover:text-emerald-400 transition-colors duration-300">{t.step1Title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/70 transition-colors duration-300">{t.step1Desc}</p>
                </div>
                <div className="group bg-gradient-to-b from-emerald-500/[0.02] hover:from-emerald-500/[0.08] to-transparent border border-emerald-500/10 hover:border-emerald-500/30 p-8 rounded-3xl flex flex-col items-center text-center relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.3)] md:pointer-events-auto cursor-default">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent group-hover:w-2/3 transition-all duration-700 opacity-0 group-hover:opacity-100"></div>
                  <div className="w-14 h-14 bg-white/5 group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:ring-1 group-hover:ring-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1">🧠</div>
                  <h3 className="font-bold text-lg mb-3 tracking-tight group-hover:text-emerald-400 transition-colors duration-300">{t.step2Title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/70 transition-colors duration-300">{t.step2Desc}</p>
                </div>
                <div className="group bg-gradient-to-b from-emerald-500/[0.02] hover:from-emerald-500/[0.08] to-transparent border border-emerald-500/10 hover:border-emerald-500/30 p-8 rounded-3xl flex flex-col items-center text-center relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.3)] md:pointer-events-auto cursor-default">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent group-hover:w-2/3 transition-all duration-700 opacity-0 group-hover:opacity-100"></div>
                  <div className="w-14 h-14 bg-white/5 group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:ring-1 group-hover:ring-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1">🚀</div>
                  <h3 className="font-bold text-lg mb-3 tracking-tight group-hover:text-emerald-400 transition-colors duration-300">{t.step3Title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/70 transition-colors duration-300">{t.step3Desc}</p>
                </div>
              </div>

              {/* SEKILAS SHOWCASE SECTION */}
              <div className="w-full max-w-5xl mt-12 mb-32 relative z-10 flex flex-col items-center">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4 text-center">{t.showcaseTitle}</h2>
                <p className="text-white/50 mb-12 text-center max-w-2xl leading-relaxed">{t.showcaseSubtitle}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                  {/* Sebelum */}
                  <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl opacity-80 filter grayscale hover:grayscale-0 transition-all duration-500 group">
                    <span className="inline-block bg-white/10 text-white/50 text-xs px-3 py-1 rounded-full mb-6 font-mono font-medium">{t.beforeLabel}</span>
                    <h3 className="text-xl font-bold mb-4 font-serif group-hover:text-white transition-colors">{t.beforeTitle}</h3>
                    <p className="text-sm text-white/40 leading-relaxed font-mono">
                      {t.beforeText}
                    </p>
                    <div className="mt-8 flex items-center justify-center text-5xl py-8 opacity-20 group-hover:opacity-50 transition-opacity">😴</div>
                  </div>

                  {/* Sesudah */}
                  <div className="bg-gradient-to-b from-emerald-500/[0.08] to-transparent border border-emerald-500/30 p-8 rounded-3xl relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_15px_40px_-20px_rgba(16,185,129,0.3)] transition-all duration-500">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <span className="text-7xl">🔥</span>
                    </div>
                    <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full mb-6 font-mono font-medium border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">{t.afterLabel}</span>
                    <h3 className="text-xl font-bold mb-4 text-white">{t.afterTitle}</h3>
                    <p className="text-sm text-white/80 leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5">
                      {t.afterText}
                    </p>
                    <div className="mt-8 flex gap-3 text-sm font-medium">
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg flex items-center gap-1">{t.intuitiveBadge}</span>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg">{t.realtimeBadge}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TESTIMONIAL SECTION */}
              {/* <div className="w-full max-w-5xl mb-32 relative z-10 flex flex-col items-center">
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
              </div> */}

              {/* FAQ SECTION */}
              <div className="w-full max-w-3xl mb-32 relative z-10 flex flex-col items-center">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-center">{t.faqTitle}</h2>
                <p className="text-white/50 mb-10 text-center text-sm md:text-base">{t.faqSubtitle}</p>

                <Accordion faq={t.faq} openIdx={openFaqIdx} setOpenIdx={setOpenFaqIdx} />
              </div>


              <div className="w-full shrink-0 relative z-10 mt-auto">
                {/* CTA SECTION */}
                <div className="max-w-4xl mx-auto px-6 py-20 md:py-24 flex flex-col items-center text-center mb-32">
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-6">
                    {t.readyTitle} <span className="text-emerald-400">{t.readyTitleHighlight}</span>
                  </h2>
                  <p className="text-white/60 mb-10 max-w-xl leading-relaxed">
                    {t.readySubtitle}
                  </p>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="bg-emerald-500 hover:bg-emerald-400 text-[#050505] px-8 py-4 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] cursor-pointer"
                  >
                    {t.readyBtn}
                  </button>
                </div>

                {/* FOOTER */}
                <Footer lang={lang} />
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <InteractiveLoader concept={conceptInput} lang={lang} />
        )}


        {data && (
          <>
            <aside className="w-full md:w-[340px] border-r border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md p-6 md:p-8 flex flex-col shrink-0 relative z-20 shadow-2xl md:h-full md:overflow-y-auto md:[&::-webkit-scrollbar]:w-1.5 md:[&::-webkit-scrollbar-track]:bg-transparent md:[&::-webkit-scrollbar-thumb]:bg-white/10 md:[&::-webkit-scrollbar-thumb]:rounded-full md:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
              <div className="mb-8">
                <h2 className="text-[11px] uppercase tracking-[0.2em] text-emerald-400 font-bold mb-2">{t.analogyTheme}</h2>
                <h3 className="text-2xl md:text-3xl font-light leading-tight mb-3">{data.tema}</h3>
                <p className="text-sm text-white/50 leading-relaxed font-light">
                  {data.deskripsi}
                </p>
              </div>

              <div className="space-y-1 mb-6 flex-1 md:overflow-y-visible overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                {data.langkah.map((l, idx) => {
                  const isActive = idx === currentStepIdx;
                  const isc = STEPS[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => setCurrentStepIdx(idx)}
                      className={`relative pl-8 border-l py-2 cursor-pointer transition-all duration-300 group`}
                      style={{ borderLeftColor: isActive ? isc.color : 'rgba(255,255,255,0.1)' }}
                    >
                      {isActive ? (
                        <div className="absolute -left-[7px] top-2.5 w-3 h-3 rounded-full" style={{ background: isc.color, boxShadow: `0 0 10px ${isc.color}` }}></div>
                      ) : (
                        <div className={`absolute -left-[5px] top-3 w-2 h-2 rounded-full transition-colors duration-300`} style={{ background: idx < currentStepIdx ? isc.color : 'rgba(255,255,255,0.2)' }}></div>
                      )}

                      <h4 className="text-[10px] uppercase tracking-widest mb-1 transition-colors duration-300" style={{ color: isActive ? isc.color : 'rgba(255,255,255,0.4)' }}>
                        {t.stepLabel} 0{idx + 1} · {l.kode}
                      </h4>
                      <p className={`text-sm transition-all duration-300 ${isActive ? 'font-bold text-white' : 'font-medium text-white/60'}`}>
                        {l.judul}
                      </p>

                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            key={`detail-${idx}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="overflow-hidden fade-up"
                          >
                            <div className="mt-3 flex flex-col gap-3 rounded-xl p-4" style={{ background: isc.bg, border: `0.5px solid ${isc.color}33` }}>
                              {/* Audio Storytelling Controller */}
                              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-1">
                                <div className="flex items-center gap-2">
                                  {isPlaying ? (
                                    /* Beautiful pulsing audio visualizer waves */
                                    <div className="flex items-end gap-[1.5px] h-3.5 w-4 pb-0.5">
                                      <div className="w-[2px] bg-emerald-400 rounded-full animate-pulse" style={{ height: "40%" }} />
                                      <div className="w-[2px] bg-emerald-400 rounded-full animate-pulse" style={{ height: "100%" }} />
                                      <div className="w-[2px] bg-emerald-400 rounded-full animate-pulse" style={{ height: "60%" }} />
                                      <div className="w-[2px] bg-emerald-400 rounded-full animate-pulse" style={{ height: "80%" }} />
                                    </div>
                                  ) : (
                                    <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                                  )}
                                  <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-zinc-400">
                                    {isPlaying ? t.audioPlaying : t.audioNarrator}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Auto advance toggle pill */}
                                  <button
                                    type="button"
                                    onClick={() => setAutoAdvance(prev => !prev)}
                                    className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono transition-all duration-300 border cursor-pointer ${autoAdvance
                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                      : "bg-white/5 border-white/5 text-zinc-500 hover:text-zinc-400"
                                      }`}
                                    title={t.audioAutoAdvanceDesc}
                                  >
                                    AUTO PLAY
                                  </button>

                                  {/* Play / Pause / Stop buttons */}
                                  <div className="flex items-center gap-1 bg-black/40 border border-white/5 p-0.5 rounded-lg">
                                    {isPlaying ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => isPaused ? resumeSpeech() : pauseSpeech()}
                                          className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-white/5 rounded transition cursor-pointer"
                                        >
                                          {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => stopSpeech()}
                                          className="p-1 text-red-400 hover:text-red-300 hover:bg-white/5 rounded transition cursor-pointer"
                                        >
                                          <Square className="w-3 h-3 fill-current" />
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => speakStep(idx)}
                                        className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-white/5 rounded transition cursor-pointer"
                                      >
                                        <Play className="w-3 h-3 fill-current" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span className="text-[9px] uppercase tracking-widest font-bold block mb-1.5" style={{ color: isc.color }}>{t.ibaratnya}:</span>
                                <p className="text-sm text-white/80 leading-relaxed italic py-0.5 font-serif">
                                  "{l.ibaratnya}"
                                </p>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase tracking-widest font-bold block mb-1.5 text-amber-500">{t.kenyataannya}:</span>
                                <p className="text-[11px] text-white/50 leading-relaxed font-mono">
                                  {l.kenyataannya}
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

              <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-5">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
                    disabled={currentStepIdx === 0}
                    className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-20 transition-all text-white/70 shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {currentStepIdx < data.langkah.length - 1 ? (
                    <button
                      onClick={() => setCurrentStepIdx(currentStepIdx + 1)}
                      className="flex-1 rounded-xl bg-emerald-500 text-black py-3.5 flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98]"
                      style={{ background: STEPS[currentStepIdx].color }}
                    >
                      <span>{t.nextBtn}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { setData(null); setCurrentStepIdx(0); setConceptInput(''); }}
                      className="flex-1 rounded-xl bg-white/10 text-white py-3.5 flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest hover:bg-white/15 transition-all border border-white/10"
                    >
                      <span>{t.finishBtn}</span>
                    </button>
                  )}
                </div>
              </div>
            </aside>

            <section className="flex-1 relative bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:32px_32px] md:h-full md:overflow-y-auto flex flex-col items-center p-6 md:p-8 md:[&::-webkit-scrollbar]:w-1.5 md:[&::-webkit-scrollbar-track]:bg-transparent md:[&::-webkit-scrollbar-thumb]:bg-white/10 md:[&::-webkit-scrollbar-thumb]:rounded-full md:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
              {/* Simulation Status Bar */}
              <div className="w-full flex flex-wrap justify-between items-center mb-4 z-30 shrink-0 gap-2" style={{
                background: `linear-gradient(90deg, ${STEPS[currentStepIdx].bg} 0%, transparent 50%)`,
                padding: '10px 20px', borderRadius: '10px',
                borderLeft: `2px solid ${STEPS[currentStepIdx].color}`,
                transition: "all .5s"
              }}>
                <div className="flex items-center gap-2">
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: STEPS[currentStepIdx].color,
                    boxShadow: `0 0 8px ${STEPS[currentStepIdx].color}`,
                    animation: "pulse 2s ease infinite",
                  }} />
                  <span className="text-[10px] font-mono tracking-widest text-white/70 uppercase">{t.activeStateSimulation}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={() => setIsShareOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 border rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all duration-300 cursor-pointer bg-white/5 border-white/10 text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                    title={t.shareBtn}
                  >
                    <Share2 className="w-3 h-3" />
                    {t.shareBtn.toUpperCase()}
                  </button>
                  {/* Badge */}
                  <div className={`px-3 py-1 border rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-500`} style={{ color: STEPS[currentStepIdx].color, borderColor: STEPS[currentStepIdx].color, background: STEPS[currentStepIdx].bg }}>
                    {getBadgeText(currentStepIdx)}
                  </div>
                </div>
              </div>

              <VisualizerCanvas data={data} currentStepIdx={currentStepIdx} lang={lang} />
            </section>
          </>
        )}
      </main>
      <CommandPalette
        isCommandOpen={isCommandOpen}
        setIsCommandOpen={setIsCommandOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredHistory={filteredHistory}
        conceptInput={conceptInput}
        data={data}
        deleteHistoryItem={deleteHistoryItem}
        onSelectHistoryItem={(item) => {
          setConceptInput(item.concept);
          setData(item.data);
          setCurrentStepIdx(0);
        }}
      />

      <ShareModal
        isShareOpen={isShareOpen}
        setIsShareOpen={setIsShareOpen}
        data={data}
        conceptInput={conceptInput}
        lang={lang}
        copiedShare={copiedShare}
        setCopiedShare={setCopiedShare}
        shareCardRef={shareCardRef}
      />
    </div>
  );
}

