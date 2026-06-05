import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { SvgNode } from "./SvgNode";
import { Connection } from "./Connection";
import { STEPS, TRANSLATIONS } from "../../constants/translations";
import { SederhanainData } from "../../types";

interface VisualizerCanvasProps {
  data: SederhanainData | null;
  currentStepIdx: number;
  lang: "id" | "en";
}

export function VisualizerCanvas({ data, currentStepIdx, lang }: VisualizerCanvasProps) {
  if (!data) return null;

  const t = TRANSLATIONS[lang];
  const sc = STEPS[currentStepIdx] || STEPS[0];

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center my-auto pb-6 md:pb-10 z-10">
      <div className="w-full p-6 rounded-2xl border transition-all duration-500 relative flex flex-col items-center justify-center min-h-[400px]" style={{
        background: 'transparent', borderColor: 'rgba(255,255,255,0.05)',
        backgroundImage: `radial-gradient(ellipse 60% 60% at 50% 50%, ${sc.glow} 0%, transparent 70%)`
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
                const isActive = ns[i] !== false;

                return (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    <SvgNode
                      node={node}
                      active={isActive}
                      broken={isBroken}
                      step={currentStepIdx}
                      index={i}
                    />
                    {i < data.komponen.length - 1 && (
                      <Connection
                        active={isActive && ns[i + 1] !== false}
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
  );
}
