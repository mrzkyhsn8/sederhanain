import React from "react";
import { STEPS } from "../../constants/translations";

interface ConnectionProps {
  active: boolean;
  broken: boolean;
  step: number;
  label: string;
}

export function Connection({ active, broken, step, label }: ConnectionProps) {
  const sc = STEPS[step] || STEPS[0];
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
