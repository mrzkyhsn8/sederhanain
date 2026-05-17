/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";

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

export default function App() {
  const [conceptInput, setConceptInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SederhanainData | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conceptInput.trim()) return;

    setIsLoading(true);
    setData(null);
    setCurrentStepIdx(0);

    try {
      const res = await fetch("/api/analogize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: conceptInput }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden selection:bg-emerald-500 selection:text-white">
      <header className="h-20 px-8 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-black tracking-tighter uppercase text-emerald-400">Sederhanain.</span>
          <span className="hidden md:inline text-[10px] uppercase tracking-[0.3em] font-medium text-white/40">AI Concept Visualizer v2.0</span>
        </div>
        {(data || isLoading) && (
          <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-[300px] md:max-w-md">
            <input
              type="text"
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-emerald-400 transition-colors placeholder:text-white/40 font-mono"
              placeholder="Ketik konsep..."
              value={conceptInput}
              onChange={(e) => setConceptInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full font-bold uppercase tracking-wider text-[10px] hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analisis"}
            </button>
          </form>
        )}
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {!data && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 px-4">
            <div className="w-24 h-24 border-4 border-dashed border-emerald-500/30 rounded-full flex items-center justify-center mb-6">
              <span className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <h2 className="text-2xl font-light mb-2">Tunggu apa lagi?</h2>
            <p className="max-w-md text-sm text-white/50 mb-8">Ketik sebuah konsep asing di bawah, dan secara otomatis akan disederhanakan menjadi elemen geometri yang intuitif.</p>
            
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 w-full max-w-lg mt-4">
              <input
                type="text"
                autoFocus
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 text-base focus:outline-none focus:border-emerald-400 transition-colors placeholder:text-white/40 font-mono text-center md:text-left"
                placeholder="Misal: WebSockets, Black Hole..."
                value={conceptInput}
                onChange={(e) => setConceptInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={isLoading || !conceptInput.trim()}
                className="bg-emerald-500 text-black px-8 py-4 rounded-full font-bold uppercase tracking-wider text-xs hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Analisis
              </button>
            </form>
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
            <aside className="w-full md:w-[340px] border-r border-white/10 bg-[#0a0a0a] p-8 flex flex-col overflow-y-auto shrink-0 relative z-10">
              <div className="mb-10">
                <h2 className="text-[11px] uppercase tracking-[0.2em] text-emerald-400 font-bold mb-2">Tema Analogi</h2>
                <h3 className="text-3xl font-light leading-tight mb-4">{data.analogyTheme}</h3>
                <p className="text-sm text-white/50 leading-relaxed font-light">
                  {data.overview}
                </p>
              </div>

              <div className="space-y-6 mb-10 flex-1">
                {data.simulationSteps.map((step, idx) => (
                  <div key={idx} className={`relative pl-8 border-l ${idx === currentStepIdx ? 'border-l-2 border-emerald-500' : 'border-white/10'}`}>
                    {idx === currentStepIdx ? (
                       <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                    ) : (
                       <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-white/20"></div>
                    )}
                    <h4 className={`text-[10px] uppercase tracking-widest mb-1 ${idx === currentStepIdx ? 'text-emerald-400' : 'text-white/40'}`}>Langkah 0{idx + 1}</h4>
                    <p className={`text-sm ${idx === currentStepIdx ? 'font-bold text-white' : idx < currentStepIdx ? 'font-medium opacity-60' : 'font-medium opacity-40'}`}>
                       {step.visualState}: {step.title}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-4 border-t border-white/10 pt-6">
                 <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStepIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-2"
                    >
                      <p className="text-sm text-white/80 leading-relaxed italic border-l block border-emerald-500/50 pl-3 py-1 font-serif">
                        "{data.simulationSteps[currentStepIdx].analogyAction}"
                      </p>
                      <p className="text-[10px] tracking-wider uppercase text-emerald-400/60 font-mono">
                        <span className="opacity-50">TECH:</span> {data.simulationSteps[currentStepIdx].techAction}
                      </p>
                    </motion.div>
                </AnimatePresence>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
                    disabled={currentStepIdx === 0}
                    className="w-10 h-10 rounded border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-20 transition-all text-white/70"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentStepIdx(Math.min(data.simulationSteps.length - 1, currentStepIdx + 1))}
                    disabled={currentStepIdx === data.simulationSteps.length - 1}
                    className="flex-1 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 flex items-center justify-center gap-2 font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-500/20 disabled:opacity-20 transition-all disabled:hover:bg-emerald-500/10"
                  >
                     <span>Next Step</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </aside>

            <section className="flex-1 relative bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:32px_32px] overflow-hidden flex items-center justify-center min-h-[400px]">
              <VisualStage 
                entities={data.entities} 
                visualState={data.simulationSteps[currentStepIdx].visualState} 
                layoutType={data.layoutType}
                animationConfig={data.simulationSteps[currentStepIdx].animationConfig}
              />
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
    layoutClasses = "flex-col items-center justify-around py-8";
  } else if (layoutType === "HUB_AND_SPOKE") {
    layoutClasses = "flex-row items-center justify-center gap-16 md:gap-24 flex-wrap";
  }

  return (
    <div className={`relative w-[300px] md:w-[500px] h-[300px] flex ${layoutClasses} z-10 px-6`}>
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
             className="relative flex flex-col items-center z-20"
          >
            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-4 flex items-center justify-center bg-[#050505] transition-colors duration-500 ${visualState === 'BROKEN' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}>
               <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl ${visualState === 'BROKEN' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                  {ent.visualAsset || <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${visualState === 'BROKEN' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>}
               </div>
            </div>
            <div className="absolute top-full mt-4 flex flex-col items-center bg-[#050505] bg-opacity-80 p-1 rounded backdrop-blur">
              <span className="text-[9px] md:text-[10px] font-mono tracking-widest text-white/40 uppercase bg-black/50 px-2 py-0.5 rounded shadow whitespace-nowrap">{ent.techName}</span>
              <span className="mt-1 text-xs md:text-sm font-medium text-white text-center whitespace-nowrap">{ent.analogyName}</span>
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
  const containerClass = `absolute inset-0 w-full h-full z-10 pointer-events-none flex items-center justify-center`;

  if (visualState === "SETUP") {
    return (
       <svg className={`absolute inset-0 w-full h-full z-10 pointer-events-none ${rotationClass}`} style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))' }}>
          <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="8 12" className="opacity-30" />
       </svg>
    );
  }

  if (visualState === "BROKEN") {
    return (
      <div className={containerClass}>
        <svg className={`absolute inset-0 w-full h-full pointer-events-none opacity-50 ${rotationClass}`}>
           <line x1="20%" y1="50%" x2="45%" y2="50%" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 8" />
           <line x1="55%" y1="50%" x2="80%" y2="50%" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 8" />
        </svg>
        <div className="bg-black/80 backdrop-blur border border-red-500 text-red-500 text-[9px] uppercase tracking-widest font-bold px-3 py-1 font-mono rounded relative z-20">DISCONNECTED</div>
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

