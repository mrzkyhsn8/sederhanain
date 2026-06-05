import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { TRANSLATIONS } from "../../constants/translations";

interface InteractiveLoaderProps {
  concept: string;
  lang: "id" | "en";
}

export function InteractiveLoader({ concept, lang }: InteractiveLoaderProps) {
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
              className={`flex items-center gap-3 transition-colors duration-300 ${
                isActive ? "text-emerald-400" : isDone ? "text-emerald-500/70" : "text-white/20"
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
                className={`text-xs font-medium tracking-wide transition-all duration-300 ${
                  isActive ? "text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] font-semibold" : ""
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
