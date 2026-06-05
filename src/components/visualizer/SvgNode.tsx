import React from "react";
import { STEPS } from "../../constants/translations";
import { Komponen } from "../../types";

interface SvgNodeProps {
  node: Komponen;
  active: boolean;
  broken: boolean;
  step: number;
  index: number;
}

export function SvgNode({ node, active, broken, step, index }: SvgNodeProps) {
  const sc = STEPS[step] || STEPS[0];
  const svgContent = broken ? (node.svgBroken || node.svgNormal) : node.svgNormal;

  const col = active ? sc.color : (broken ? "#EF4444" : "#4B5563");
  const glowSize = active ? "0 0 28px" : (broken ? "0 0 16px" : "none");
  const glowColor = active ? sc.glow : "rgba(239, 68, 68, 0.25)";

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
        opacity: active ? 1 : (broken ? 0.95 : 0.45), transition: "opacity .5s ease",
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
