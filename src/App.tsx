/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ChevronRight, ChevronLeft, LogOut, Command, Search, X, AlertOctagon, Sparkles, Lock, History, ArrowRight, Volume2, Play, Pause, Square } from "lucide-react";
import { useGoogleLogin, googleLogout } from '@react-oauth/google';

interface Komponen {
  label: string;
  analogi: string;
  svgNormal: string;
  svgBroken: string;
}

interface Langkah {
  kode: string;
  judul: string;
  ibaratnya: string;
  kenyataannya: string;
  nodeStates: boolean[];
  connections: string[];
}

interface SederhanainData {
  tema: string;
  deskripsi: string;
  komponen: Komponen[];
  langkah: Langkah[];
}

interface HistoryItem {
  concept: string;
  data: SederhanainData;
  timestamp: number;
}

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

const STEPS = [
  { color: "#00E87C", glow: "rgba(0,232,124,.22)", bg: "rgba(0,232,124,.06)", badge: "SECURE & STABLE", label: "LANGKAH 01" },
  { color: "#FFB830", glow: "rgba(255,184,48,.22)", bg: "rgba(255,184,48,.06)", badge: "ALERT: WARNING", label: "LANGKAH 02" },
  { color: "#FF5733", glow: "rgba(255,87,51,.22)", bg: "rgba(255,87,51,.06)", badge: "CRITICAL", label: "LANGKAH 03" },
  { color: "#FF4D4D", glow: "rgba(255,77,77,.35)", bg: "rgba(255,77,77,.08)", badge: "SYSTEM FAILURE", label: "LANGKAH 04" },
];

function SvgNode({ node, active, broken, step, index }: any) {
  const sc = STEPS[step];
  const svgContent = broken ? (node.svgBroken || node.svgNormal) : node.svgNormal;

  // Design choices for active, broken, and beautiful high-contrast inactive standby states:
  const col = active ? sc.color : (broken ? "#EF4444" : "#4B5563"); // rich slate grey for inactive nodes
  const glowSize = active ? "0 0 28px" : (broken ? "0 0 16px" : "none");
  const glowColor = active ? sc.glow : "rgba(239, 68, 68, 0.25)";

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
        opacity: active ? 1 : (broken ? 0.95 : 0.45), transition: "opacity .5s ease", // raised inactive opacity to 0.45 for perfect legibility
      }}
    >
      <div style={{ position: "relative", width: "110px", height: "110px" }}>
        {active && (
          <div style={{
            position: "absolute", inset: "-8px", borderRadius: "50%",
            border: `1px solid ${sc.color}`, opacity: 0,
            animation: `pulse ${2 + index * 0.4}s ease ${index * 0.3}s infinite`,
          }} />
        )}
        <svg viewBox="0 0 110 110" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <circle cx="55" cy="55" r="52" fill="none" stroke={col} strokeWidth={active ? "1.5" : (broken ? "1.2" : "0.75")}
            strokeDasharray={broken ? "4 4" : active ? "8 4" : "none"}
            strokeOpacity={active ? 0.8 : (broken ? 0.6 : 0.4)}
            style={active ? { animation: "dashMove 2s linear infinite" } : {}}
          />
        </svg>
        <div style={{
          position: "absolute", inset: "8px", borderRadius: "50%",
          background: active ? `${sc.color}10` : (broken ? "#150505" : "#0D0E0D"),
          border: `${active ? "1.5" : (broken ? "1" : "0.75")}px solid ${col}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: active ? `${glowSize} ${sc.glow}, inset 0 0 20px ${sc.color}08` : (broken ? `${glowSize} ${glowColor}, inset 0 0 16px rgba(239,68,68,0.06)` : "none"),
          transition: "all .5s ease", overflow: "hidden",
        }}>
          <svg viewBox="0 0 60 60" width="50" height="50" style={{
            color: active ? col : (broken ? "#EF4444" : "#4B5563"), transition: "color .5s ease",
            filter: broken ? `drop-shadow(0 0 6px rgba(239,68,68,0.7))` : active ? `drop-shadow(0 0 4px ${sc.color}66)` : "none",
          }} dangerouslySetInnerHTML={{ __html: svgContent }} />
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: active ? sc.color : (broken ? "#EF4444" : "#4B5563"), letterSpacing: "1.5px", marginBottom: "4px", transition: "color .5s" }}>
          {node.label}
        </div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: active ? "#E4E8E4" : (broken ? "#FCA5A5" : "#6B7280"), transition: "color .5s" }}>
          {node.analogi}
        </div>
      </div>
    </div>
  );
}

function Connection({ active, broken, step, label }: any) {
  const sc = STEPS[step];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", width: "130px", paddingBottom: "28px" }}>
      {/* Label Text above the connection line */}
      {label && (
        <span style={{
          position: "absolute",
          top: "-18px",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "7.5px",
          fontWeight: "600",
          color: active ? sc.color : (broken ? "#EF4444" : "#4B5563"),
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          whiteSpace: "nowrap",
          opacity: active ? 0.9 : 0.5,
          transition: "color .5s, opacity .5s",
          pointerEvents: "none",
          background: "#050505",
          padding: "2px 6px",
          borderRadius: "4px",
          border: `1px dashed ${active ? `${sc.color}30` : (broken ? "rgba(239,68,68,0.15)" : "rgba(75,85,99,0.15)")}`,
          zIndex: 10,
        }}>
          {label}
        </span>
      )}

      {/* Line SVG */}
      <svg width="130" height="4" style={{ overflow: "visible" }}>
        {/* Glowing backdrop shadow line for active states */}
        {active && (
          <line
            x1="0" y1="2" x2="130" y2="2"
            stroke={sc.color}
            strokeWidth="3"
            strokeOpacity="0.15"
            style={{ filter: "blur(2px)" }}
          />
        )}
        <line
          x1="0" y1="2" x2="130" y2="2"
          stroke={active ? sc.color : (broken ? "#EF4444" : "#2A2D2A")}
          strokeWidth={active ? "1.5" : (broken ? "1.2" : "0.75")}
          strokeDasharray={broken ? "4 4" : active ? "6 4" : "4 4"}
          strokeOpacity={active ? 0.85 : (broken ? 0.6 : 0.3)}
          style={active ? { animation: "dashMove 1.5s linear infinite" } : {}}
        />
      </svg>
    </div>
  );
}

function InteractiveLoader({ concept, lang }: { concept: string; lang: "id" | "en" }) {
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);

  const t = TRANSLATIONS[lang];
  const phases = t.loadingSteps;
  const loadingPhases = [
    { id: "analyze", text: phases[0] },
    { id: "brainstorm", text: phases[1] },
    { id: "connect", text: phases[2] },
    { id: "render", text: phases[3] }
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentPhaseIdx(1), 1800),
      setTimeout(() => setCurrentPhaseIdx(2), 3800),
      setTimeout(() => setCurrentPhaseIdx(3), 5500),
    ];
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-emerald-400 max-w-md mx-auto px-6 py-12">
      {/* Central Pulsing & Spinning Loader Ring */}
      <div className="relative flex items-center justify-center mb-10">
        {/* Glow behind loader */}
        <div className="absolute w-24 h-24 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
        {/* Orbit ring */}
        <div className="absolute w-20 h-20 rounded-full border border-emerald-500/10 animate-[spin_6s_linear_infinite]"></div>
        <div className="absolute w-20 h-20 rounded-full border-t border-emerald-400 animate-spin"></div>
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 z-10" />
      </div>

      {/* Title */}
      <h3 className="text-white font-medium text-sm tracking-[0.1em] uppercase mb-1 text-center">
        {t.assembling}
      </h3>
      {concept && (
        <p className="text-white/40 text-[11px] font-mono mb-8 text-center truncate max-w-xs">
          {t.topicLabel} <span className="text-emerald-400 font-semibold">{concept}</span>
        </p>
      )}

      {/* Progressive Checklist */}
      <div className="w-full space-y-4 bg-zinc-950/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
        {loadingPhases.map((phase, idx) => {
          const isDone = idx < currentPhaseIdx;
          const isActive = idx === currentPhaseIdx;

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className={`flex items-center gap-3 transition-colors duration-300 ${isActive ? "text-emerald-400" : isDone ? "text-emerald-500/70" : "text-white/20"
                }`}
            >
              {/* Checkbox status indicator */}
              <div className="flex items-center justify-center shrink-0">
                {isDone ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-in zoom-in duration-300">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isActive ? (
                  <div className="w-5 h-5 rounded-full border border-emerald-400/30 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-t-2 border-emerald-400 animate-spin"></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Phase Text */}
              <span
                className={`text-xs font-medium tracking-wide transition-all duration-300 ${isActive ? "text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] font-semibold" : ""
                  }`}
              >
                {phase.text}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


const TRANSLATIONS: Record<string, any> = {
  id: {
    assembling: "Merakit Analogi",
    topicLabel: "Topik:",
    title: "Bikin Konsep Rumit Jadi",
    titleHighlight: "Sederhana.",
    subtitle: "Platform interaktif berbasis Generative UI yang mengubah teori kaku, istilah, hingga fenomena sains menjadi simulasi analogi dunia nyata secara real-time.",
    placeholder: "Ketik topik: Misal WebSockets...",
    analysisBtn: "Analisis",
    popularTopics: "Topik Populer:",
    historyAlert: "Lihat Riwayat Analisis Anda",
    loginText: "Masuk",
    searchHistoryBtn: "CARI RIWAYAT ANDA",
    searchHistoryHeader: "CARI RIWAYAT",
    faqTitle: "Pertanyaan yang Sering Muncul 🤔",
    faqSubtitle: "Mungkin kamu punya salah satu pertanyaan ini.",
    readyTitle: "Siap Mencerna",
    readyTitleHighlight: "Konsep Rumit?",
    readySubtitle: "Berhenti membuang waktu memahami dokumentasi yang membosankan. Biarkan AI kami yang menerjemahkannya ke dalam bahasa manusia untukmu.",
    readyBtn: "Mulai Coba Gratis 🚀",
    stepLabel: "LANGKAH",
    badgeSecure: "AMAN & STABIL",
    badgeWarning: "PERINGATAN",
    badgeCritical: "KRITIS",
    badgeFailure: "KEGAGALAN SISTEM",
    ibaratnya: "Ibaratnya",
    kenyataannya: "Kenyataannya",
    analogyTheme: "Tema Analogi",
    nextBtn: "Selanjutnya",
    finishBtn: "Selesai ✓",
    internalSystem: "SISTEM INTERNAL",
    activeStateSimulation: "SIMULASI KONDISI AKTIF",
    backToMain: "Kembali ke Menu Utama",
    logout: "Logout",
    historyTitle: "Riwayat Analisis",
    historyEmpty: "Belum ada riwayat",
    howTitle: "Bagaimana Sederhanain Bekerja? 🤔",
    howSubtitle: "Hanya butuh tiga langkah simpel untuk mengubah teks buku yang membosankan menjadi cerita visual yang nempel di otak.",
    step1Title: "Ketik Topikmu",
    step1Desc: "Masukkan istilah abstrak apa saja, mulai dari WebSockets, Inflasi, hingga Black Hole.",
    step2Title: "AI Meracik Analogi",
    step2Desc: "Mesin Sederhanain menerjemahkan teori kaku menjadi skenario cerita sehari-hari.",
    step3Title: "Mainkan Simulasi",
    step3Desc: "Lihat visualisasi interaktif langkah-demi-langkah yang bergerak dinamis di layarmu.",
    showcaseTitle: "Dari Teori Kaku Menjadi Cerita Seru",
    showcaseSubtitle: "Bandingkan sendiri bagaimana Sederhanain mengubah bahasa teknis yang membosankan menjadi analogi visual yang mudah dicerna otak.",
    beforeLabel: "Buku Teks / Wikipedia",
    beforeTitle: "Definisi WebSockets",
    beforeText: "\"WebSocket adalah protokol komunikasi komputer, yang menyediakan full-duplex communication channels atas koneksi TCP tunggal. Protokol WebSocket distandarisasi oleh IETF sebagai RFC 6455...\"",
    afterLabel: "Hasil Sederhanain",
    afterTitle: "Analogi: Pipa Air 2 Arah",
    afterText: "\"Bayangkan sebuah pipa air ajaib di mana air bisa mengalir dari dua arah sekaligus tanpa harus menunggu giliran. Tidak perlu cape bertanya 'halo, apakah ada air?' setiap detik (polling). Begitu air siap, ia akan langsung menyembur ke arahmu!\"",
    intuitiveBadge: "Intuitif",
    realtimeBadge: "Real-time",
    footerDesc: "Mengubah konsep abstrak dan teori yang rumit menjadi analogi interaktif yang menyenangkan. Belajar tidak pernah se-intuitif ini.",
    aboutUs: "Tentang Kami",
    githubRepo: "GitHub Repository",
    privacyPolicy: "Privacy Policy",
    aiDisclaimerTitle: "AI Disclaimer 🤖",
    aiDisclaimerText: "Platform ini ditenagai oleh Generative AI. Analogi yang dihasilkan mungkin tidak 100% akurat secara teknis atau saintifik. Gunakan aplikasi ini sebagai jembatan pemahaman awal, bukan sumber kebenaran mutlak.",
    loadingSteps: [
      "Menganalisis topik...",
      "Merancang analogi yang sesuai...",
      "Menghubungkan komponen sistem...",
      "Menyiapkan visualisasi simulasi..."
    ],
    faq: [
      {
        question: "Apakah Sederhanain 100% gratis?",
        answer: "Ya! Karena ini masih versi Beta eksploratif, kamu bisa menganalisis topik apa saja."
      },
      {
        question: "Teknologi apa yang ada di baliknya?",
        answer: "Kami mengandalkan kombinasi ajaib dari Google Gemini API (untuk bernalar dan meracik analogi), serta React & Tailwind untuk merender UI yang interaktif (Generative UI) secara instan."
      },
      {
        question: "Topik apa yang pas dicoba?",
        answer: "Bebas! Cobalah memasukkan kata kunci bidang IT (seperti Docker, Kubernetes, React Effect), Teori Fisika (Relativitas, Kucing Schrödinger), sampai istilah Finansial (Inflasi, Deflasi, Reksadana)."
      }
    ],
    audioNarrator: "Dengarkan Cerita",
    audioPlaying: "Membaca Analogi...",
    audioAutoAdvanceDesc: "Otomatis lanjut ke langkah berikutnya saat selesai membaca"
  },
  en: {
    assembling: "Assembling Analogy",
    topicLabel: "Topic:",
    title: "Make Complex Concepts",
    titleHighlight: "Simple.",
    subtitle: "An interactive Generative UI platform that transforms rigid theories, terminology, and scientific phenomena into real-world analogical simulations in real-time.",
    placeholder: "Type a topic: e.g. WebSockets...",
    analysisBtn: "Analyze",
    popularTopics: "Popular Topics:",
    historyAlert: "View Your Analysis History",
    loginText: "Login",
    searchHistoryBtn: "SEARCH YOUR HISTORY",
    searchHistoryHeader: "SEARCH HISTORY",
    faqTitle: "Frequently Asked Questions 🤔",
    faqSubtitle: "You might have one of these questions in mind.",
    readyTitle: "Ready to Digest",
    readyTitleHighlight: "Complex Concepts?",
    readySubtitle: "Stop wasting time on boring documentation. Let our AI translate it into human language for you.",
    readyBtn: "Start Free Trial 🚀",
    stepLabel: "STEP",
    badgeSecure: "SECURE & STABLE",
    badgeWarning: "ALERT: WARNING",
    badgeCritical: "CRITICAL",
    badgeFailure: "SYSTEM FAILURE",
    ibaratnya: "Analogy",
    kenyataannya: "Reality",
    analogyTheme: "Analogy Theme",
    nextBtn: "Next",
    finishBtn: "Finish ✓",
    internalSystem: "INTERNAL SYSTEM",
    activeStateSimulation: "ACTIVE STATE SIMULATION",
    backToMain: "Back to Main Screen",
    logout: "Logout",
    historyTitle: "Analysis History",
    historyEmpty: "No history yet",
    howTitle: "How Sederhanain Works? 🤔",
    howSubtitle: "It only takes three simple steps to transform boring textbook definitions into a visual story that sticks in your mind.",
    step1Title: "Type Your Topic",
    step1Desc: "Enter any abstract concept, from WebSockets and Inflation to Black Holes.",
    step2Title: "AI Crafts Analogy",
    step2Desc: "The Sederhanain engine translates rigid theories into everyday real-life scenarios.",
    step3Title: "Play the Simulation",
    step3Desc: "Watch step-by-step interactive visualizations animate dynamically on your screen.",
    showcaseTitle: "From Rigid Theory to Exciting Story",
    showcaseSubtitle: "See for yourself how Sederhanain turns dry technical jargon into highly digestible visual analogies.",
    beforeLabel: "Textbook / Wikipedia",
    beforeTitle: "WebSockets Definition",
    beforeText: "\"WebSocket is a computer communication protocol, providing full-duplex communication channels over a single TCP connection. The WebSocket protocol was standardized by the IETF as RFC 6455...\"",
    afterLabel: "Sederhanain Result",
    afterTitle: "Analogy: 2-Way Water Pipe",
    afterText: "\"Imagine a magical water pipe where water can flow from both directions at the same time without waiting for turns. No need to exhaustingly ask 'hello, is there water?' every second (polling). Once water is ready, it squirts right at you!\"",
    intuitiveBadge: "Intuitive",
    realtimeBadge: "Real-time",
    footerDesc: "Transforming abstract concepts and complex theories into delightful interactive analogies. Learning has never been this intuitive.",
    aboutUs: "About Us",
    githubRepo: "GitHub Repository",
    privacyPolicy: "Privacy Policy",
    aiDisclaimerTitle: "AI Disclaimer 🤖",
    aiDisclaimerText: "This platform is powered by Generative AI. The generated analogies might not be 100% technically or scientifically accurate. Use this application as a bridge for initial understanding, not as an absolute source of truth.",
    loadingSteps: [
      "Analyzing topic...",
      "Designing suitable analogy...",
      "Connecting system components...",
      "Preparing simulation visualization..."
    ],
    faq: [
      {
        question: "Is Sederhanain 100% free?",
        answer: "Yes! Since this is an exploratory Beta version, you can analyze any topic without search limits."
      },
      {
        question: "What technology is running behind it?",
        answer: "We rely on the magical combination of Google Gemini API (for outstanding reasoning and crafting analogies), and React & Tailwind to render the interactive UI (Generative UI) instantly."
      },
      {
        question: "What topics are best to try?",
        answer: "Anything! Try entering keywords in IT (like Docker, Kubernetes, React Effect), Physics Theories (Relativity, Schrödinger's Cat), or Financial terms (Inflation, Deflation, Mutual Funds)."
      }
    ],
    audioNarrator: "Listen Analogy",
    audioPlaying: "Reading Analogy...",
    audioAutoAdvanceDesc: "Automatically advance to the next step when finished reading"
  }
};

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

  // Audio Storytelling States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [currentUtterance, setCurrentUtterance] = useState<any>(null);

  // Audio Storytelling Helpers
  const speakStep = (stepIdx: number) => {
    if (!data) return;

    // 1. Cancel any active speech first
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);

    const l = data.langkah[stepIdx];
    if (!l) return;

    // 2. Build the spoken narrative text with warm conversational connectors
    const stepLabel = lang === "en" ? "Step" : "Langkah";
    const textToSpeak = lang === "en"
      ? `${stepLabel} ${stepIdx + 1}, ${l.judul}. Imagine it like this: ${l.ibaratnya}. In the real world: ${l.kenyataannya}`
      : `${stepLabel} ${stepIdx + 1}, ${l.judul}. Ibarat cerita: ${l.ibaratnya}. Dan dalam kenyataan teknologinya: ${l.kenyataannya}`;

    // 3. Initialize utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // 4. Select optimized highly-natural premium/neural voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoices = voices.filter(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));

    let voice = null;
    if (matchingVoices.length > 0) {
      // Priority 1: Microsoft Natural Online voices (incredibly realistic Edge voices)
      const microsoftOnline = matchingVoices.find(v =>
        v.name.toLowerCase().includes("microsoft") &&
        (v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("online"))
      );

      // Priority 2: Google Chrome natural voices
      const googleVoice = matchingVoices.find(v =>
        v.name.toLowerCase().includes("google")
      );

      // Priority 3: Apple Safari Siri/Natural voices
      const naturalVoice = matchingVoices.find(v =>
        v.name.toLowerCase().includes("natural")
      );

      // Priority 4: Local offline premium services
      const localVoice = matchingVoices.find(v => v.localService);

      voice = microsoftOnline || googleVoice || naturalVoice || localVoice || matchingVoices[0];
    }

    if (voice) {
      utterance.voice = voice;
    }

    // Slight speech speed optimization for warm, natural cadence
    utterance.rate = lang === "id" ? 0.94 : 0.96;
    utterance.pitch = 1.0;

    // 5. Event bindings
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);

      // Auto advance functionality
      if (autoAdvance && stepIdx < data.langkah.length - 1) {
        setTimeout(() => {
          setCurrentStepIdx(prev => {
            const nextIdx = prev + 1;
            speakStep(nextIdx);
            return nextIdx;
          });
        }, 1500); // 1.5s peaceful buffer between steps
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    // 6. Speak!
    window.speechSynthesis.speak(utterance);
    setCurrentUtterance(utterance);
  };

  const pauseSpeech = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeSpeech = () => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Stop speech if page is unloaded or details change
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Stop speech if they trigger a new search or go back
  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, [data, isLoading]);

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
        setCurrentStepIdx((prev) => Math.min(data.langkah.length - 1, prev + 1));
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
        body: JSON.stringify({ concept, lang }),
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
    item.data.tema.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderLanguageSwitcher = () => (
    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 shrink-0 select-none">
      <button
        type="button"
        onClick={() => handleLanguageChange("id")}
        className={`px-2.5 py-1 text-[9px] font-bold rounded-full transition-all cursor-pointer ${lang === "id" ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black" : "text-zinc-400 hover:text-white"}`}
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => handleLanguageChange("en")}
        className={`px-2.5 py-1 text-[9px] font-bold rounded-full transition-all cursor-pointer ${lang === "en" ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black" : "text-zinc-400 hover:text-white"}`}
      >
        EN
      </button>
    </div>
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
            className="h-20 px-4 sm:px-8 flex items-center justify-between border-b border-white/10 shrink-0"
          >
            <div className="flex items-baseline gap-3">
              <button
                onClick={() => { setData(null); setIsLoading(false); setConceptInput(''); }}
                className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter uppercase text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Sederhanain.
              </button>
              <span className="hidden md:inline text-[10px] uppercase tracking-[0.3em] font-medium text-white/40">AI Concept Visualizer</span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* History Button (Icon-only, sleek circular layout) */}
              <button
                type="button"
                onClick={() => setIsCommandOpen(true)}
                className="flex items-center justify-center w-9 h-9 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 rounded-full shadow-md transition-all duration-200 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                title={`${t.searchHistoryHeader} (Ctrl + K)`}
              >
                <History className="w-4 h-4" />
              </button>

              {/* Integrated Search Bar (Unified Input + Internal Submit Button) */}
              <motion.form
                layoutId="search-form"
                onSubmit={handleSubmit}
                className="relative items-center w-full max-w-[240px] lg:max-w-[280px] hidden md:flex"
              >
                <div className="relative w-full">
                  <motion.input
                    layoutId="search-input"
                    type="text"
                    className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-emerald-500/50 rounded-full pl-9 pr-9 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-white/30 font-mono"
                    placeholder={t.placeholder}
                    value={conceptInput}
                    onChange={(e) => setConceptInput(e.target.value)}
                  />
                  {/* Left Search Icon */}
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />

                  {/* Embedded Right Action Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !conceptInput.trim()}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none ${conceptInput.trim()
                        ? "bg-emerald-500 text-black hover:bg-emerald-400 cursor-pointer shadow-md shadow-emerald-500/20"
                        : "bg-white/5 text-zinc-600 opacity-40 cursor-not-allowed"
                      }`}
                    title={t.analysisBtn}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </motion.form>

              {renderLanguageSwitcher()}
              {renderProfileMenu()}
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className={`flex-1 flex flex-col-reverse md:flex-row relative ${data ? "md:h-[calc(100vh-80px)] md:overflow-hidden" : ""}`}>
        {!data && !isLoading && (
          <div className="w-full flex flex-col items-center relative z-10">
            {/* LANDING PAGE HEADER */}
            <div className="absolute top-0 left-0 right-0 h-20 px-4 sm:px-8 flex items-center justify-between z-50 fixed bg-[#050505]">
              <div className="flex items-baseline gap-3">
                <span className="text-lg sm:text-xl font-black tracking-tighter uppercase text-emerald-400 select-none">
                  Sederhanain.
                </span>
                <span className="hidden sm:inline text-[9px] uppercase tracking-[0.25em] font-medium text-white/30 select-none">
                  AI Concept Visualizer
                </span>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-4">
                {renderLanguageSwitcher()}
                {token ? (
                  renderProfileMenu()
                ) : (
                  <button
                    type="button"
                    onClick={() => login()}
                    className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 hover:border-emerald-500/50 bg-zinc-950/80 hover:bg-emerald-500/5 text-zinc-300 hover:text-emerald-400 text-xs font-bold tracking-wide transition-all duration-300 shadow-md hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>{t.loginText}</span>
                  </button>
                )}
              </div>
            </div>

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

                <div className="w-full flex flex-col gap-4">
                  {t.faq.map((item: any, idx: number) => {
                    const isOpen = openFaqIdx === idx;
                    return (
                      <div
                        key={idx}
                        className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden group hover:border-emerald-500/20 hover:bg-white/[0.03] transition-all duration-300"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                          className="w-full text-left p-6 flex justify-between items-center cursor-pointer select-none focus:outline-none"
                        >
                          <span className={`font-bold text-sm md:text-base transition-colors duration-300 ${isOpen ? "text-emerald-400" : "text-zinc-200 group-hover:text-emerald-400"}`}>
                            {item.question}
                          </span>
                          <span className={`text-xs ml-4 flex items-center justify-center w-6 h-6 rounded-full bg-white/5 text-zinc-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-300 transform ${isOpen ? "rotate-90 text-emerald-400 bg-emerald-500/10" : ""}`}>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </button>

                        <div
                          className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 border-t border-white/5" : "grid-rows-[0fr] opacity-0"}`}
                        >
                          <div className="overflow-hidden">
                            <div className="p-6 pt-4 text-xs md:text-sm text-white/60 leading-relaxed font-medium">
                              {item.answer}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                <footer className="w-full px-6 py-12 md:px-12 relative z-10">
                  <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
                      {/* Brand & Description */}
                      <div className="col-span-1 md:col-span-4 flex flex-col gap-4">
                        <span className="text-2xl font-black tracking-tighter uppercase text-emerald-400">
                          Sederhanain.
                        </span>
                        <p className="text-sm text-white/50 leading-relaxed pr-4">
                          {t.footerDesc}
                        </p>
                      </div>

                      {/* Quick Links & Disclaimer */}
                      <div className="col-span-1 md:col-span-8 flex flex-col sm:flex-row gap-10 md:justify-end">
                        <div className="flex flex-col gap-4">
                          <h4 className="text-emerald-400 font-bold mb-1 uppercase tracking-wider text-xs">Quick Links</h4>
                          <a href="#" className="text-sm text-white/60 hover:text-emerald-400 hover:translate-x-1 transition-all w-fit">{t.aboutUs}</a>
                          <a href="#" className="text-sm text-white/60 hover:text-emerald-400 hover:translate-x-1 transition-all w-fit">{t.githubRepo}</a>
                          <a href="#" className="text-sm text-white/60 hover:text-emerald-400 hover:translate-x-1 transition-all w-fit">{t.privacyPolicy}</a>
                        </div>

                        <div className="flex flex-col gap-4 max-w-sm">
                          <h4 className="text-emerald-400 font-bold mb-1 uppercase tracking-wider text-xs">{t.aiDisclaimerTitle}</h4>
                          <p className="text-xs text-white/40 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                            {t.aiDisclaimerText}
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
              <div className="w-full flex justify-between items-center mb-6 z-30 shrink-0" style={{
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
                <div className={`px-3 py-1 border rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-500`} style={{ color: STEPS[currentStepIdx].color, borderColor: STEPS[currentStepIdx].color, background: STEPS[currentStepIdx].bg }}>
                  {getBadgeText(currentStepIdx)}
                </div>
              </div>

              <div className="w-full flex-1 flex flex-col justify-center items-center my-auto pb-6 md:pb-10 z-10">
                <div className="w-full p-6 rounded-2xl border transition-all duration-500 relative flex items-center justify-center min-h-[400px]" style={{
                  background: 'transparent', borderColor: 'rgba(255,255,255,0.05)',
                  backgroundImage: `radial-gradient(ellipse 60% 60% at 50% 50%, ${STEPS[currentStepIdx].glow} 0%, transparent 70%)`
                }}>
                  <div className="absolute top-2 left-4 text-[9px] font-mono tracking-wider text-white/30 uppercase flex items-center gap-2">
                    <span style={{ color: currentStepIdx === 3 ? "#FF4D4D" : "#1C1F1C" }}>▲</span> {t.internalSystem}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStepIdx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                      className="w-full flex justify-center items-center pt-4 overflow-x-auto"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                        {data.komponen?.map((node, i) => {
                          const ns = data.langkah[currentStepIdx].nodeStates || [true, true, true];
                          const isBroken = currentStepIdx === 3;
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "center" }}>
                              <SvgNode
                                node={node}
                                active={ns[i] !== false}
                                broken={isBroken}
                                step={currentStepIdx}
                                index={i}
                              />
                              {i < data.komponen.length - 1 && (
                                <Connection
                                  active={ns[i] !== false && ns[i + 1] !== false}
                                  broken={isBroken}
                                  step={currentStepIdx}
                                  label={data.langkah[currentStepIdx].connections?.[i]}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
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
                      const isActiveTopic = data && item.concept.toLowerCase() === conceptInput.toLowerCase();
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
                              <span className="text-[10px] text-zinc-500 block group-hover:text-zinc-400">{item.data.tema}</span>
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

