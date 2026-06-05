import React from "react";
import { Share2, X, Download, Copy, Check } from "lucide-react";
import { STEPS, TRANSLATIONS } from "../../constants/translations";
import { SederhanainData } from "../../types";
import { captureAndDownload } from "../../utils/capture";

interface ShareModalProps {
  isShareOpen: boolean;
  setIsShareOpen: (val: boolean) => void;
  data: SederhanainData | null;
  conceptInput: string;
  lang: "id" | "en";
  copiedShare: boolean;
  setCopiedShare: (val: boolean) => void;
  shareCardRef: React.RefObject<HTMLDivElement | null>;
}

export function ShareModal({
  isShareOpen,
  setIsShareOpen,
  data,
  conceptInput,
  lang,
  copiedShare,
  setCopiedShare,
  shareCardRef,
}: ShareModalProps) {
  if (!isShareOpen || !data) return null;
  const t = TRANSLATIONS[lang];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => {
          setIsShareOpen(false);
          setCopiedShare(false);
        }}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-zinc-100">{t.shareTitle}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsShareOpen(false);
              setCopiedShare(false);
            }}
            className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Share Card Preview */}
        <div className="p-4">
          <div
            ref={shareCardRef}
            style={{
              width: "100%",
              background: "#070908",
              border: "0.5px solid #222622",
              borderRadius: "14px",
              overflow: "hidden",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Top Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "0.5px solid #1a1e1a",
                background: "#080908",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#00e87c", letterSpacing: "1.5px" }}>
                SEDERHANAIN.<span style={{ color: "#2a2d2a" }}> AI VISUALIZER</span>
              </div>
              <div style={{ fontSize: "9px", color: "#2a2d2a", letterSpacing: "1.5px" }}>
                {t.shareCardSubtitle}
              </div>
            </div>

            {/* Header: Topic + Tema + Description + Nodes */}
            <div style={{ padding: "16px 16px 12px", borderBottom: "0.5px solid #1a1e1a" }}>
              <div
                style={{
                  display: "inline-block",
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "#00e87c",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  background: "rgba(0,232,124,0.08)",
                  border: "0.5px solid rgba(0,232,124,0.2)",
                  borderRadius: "20px",
                  padding: "2px 10px",
                  marginBottom: "8px",
                }}
              >
                {t.shareCardTopic}: {conceptInput}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#e4e8e4",
                  marginBottom: "3px",
                  letterSpacing: "-0.3px",
                }}
              >
                {data.tema}
              </div>
              <div style={{ fontSize: "11px", color: "#4a4d4a", lineHeight: 1.6 }}>{data.deskripsi}</div>
              {/* Nodes */}
              <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                {data.komponen?.map((k, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "#0d100d",
                      border: "0.5px solid #1a1e1a",
                      borderRadius: "20px",
                      padding: "3px 10px",
                    }}
                  >
                    <div
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: STEPS[idx]?.color || "#00e87c",
                      }}
                    />
                    <span style={{ fontSize: "9px", color: "#4a4d4a", letterSpacing: "0.5px" }}>
                      {k.label} → {k.analogi}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Steps */}
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 0 }}>
              {data.langkah?.map((l, idx) => {
                const sc = STEPS[idx];
                const stepColors = ["#00e87c", "#ffb830", "#ff5733", "#9b1c1c"];
                const c = stepColors[idx] || sc?.color || "#00e87c";
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "9px 0",
                      borderBottom: idx < 3 ? "0.5px solid #111311" : "none",
                    }}
                  >
                    {/* Step Color Bar */}
                    <div
                      style={{
                        width: "3px",
                        flexShrink: 0,
                        borderRadius: "2px",
                        alignSelf: "stretch",
                        marginTop: "2px",
                        marginBottom: "2px",
                        background: c,
                      }}
                    />
                    {/* Step Number */}
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "5px",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: 700,
                        marginTop: "1px",
                        background: `${c}1A`,
                        color: c,
                      }}
                    >
                      {idx + 1}
                    </div>
                    {/* Step Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "8px", letterSpacing: "1.5px", marginBottom: "2px", color: c }}>
                        {l.kode} · {lang === "en" ? "STEP" : "LANGKAH"} 0{idx + 1}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#d4d8d4",
                          marginBottom: "3px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {l.judul}
                      </div>
                      <div style={{ fontSize: "10px", color: "#4a4d4a", lineHeight: 1.6 }}>
                        "{l.ibaratnya}"
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderTop: "0.5px solid #1a1e1a",
                background: "#080908",
              }}
            >
              <div style={{ fontSize: "9px", color: "#2a2d2a", letterSpacing: "0.5px" }}>
                sederhanain.web.app
              </div>
              <div style={{ fontSize: "9px", color: "#00e87c44", letterSpacing: "1px" }}>
                {t.shareCardCta}
              </div>
            </div>
          </div>
        </div>

        {/* Share Action Buttons */}
        <div className="p-4 pt-0 grid grid-cols-2 gap-2">
          {/* Share to X */}
          <button
            type="button"
            onClick={() => {
              const text = `🧠 ${
                lang === "id" ? "Baru belajar tentang" : "Just learned about"
              } "${conceptInput}" ${lang === "id" ? "di" : "on"} Sederhanain!\n\n${data.tema}\n${
                data.deskripsi
              }\n\n1️⃣ ${data.langkah[0]?.judul}\n2️⃣ ${data.langkah[1]?.judul}\n3️⃣ ${
                data.langkah[2]?.judul
              }\n4️⃣ ${
                data.langkah[3]?.judul
              }\n\n${lang === "id" ? "Coba sendiri" : "Try it"} → sederhanain.web.app\n#Sederhanain #BelajarMudah`;
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            {t.shareToX}
          </button>

          {/* Share to WhatsApp */}
          <button
            type="button"
            onClick={() => {
              const text = `🧠 *${conceptInput}* — ${data.tema}\n\n${data.deskripsi}\n\n1️⃣ ${
                data.langkah[0]?.judul
              }\n2️⃣ ${data.langkah[1]?.judul}\n3️⃣ ${data.langkah[2]?.judul}\n4️⃣ ${data.langkah[3]?.judul}\n\n${
                lang === "id" ? "Coba sendiri" : "Try it"
              } → sederhanain.web.app`;
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-emerald-950/50 border border-zinc-800 hover:border-emerald-500/30 text-zinc-300 hover:text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {t.shareToWhatsApp}
          </button>

          {/* Download PNG */}
          <button
            type="button"
            onClick={async () => {
              if (!shareCardRef.current) return;
              const filename = `sederhanain-${conceptInput.toLowerCase().replace(/\s+/g, "-")}.png`;
              try {
                await captureAndDownload(shareCardRef.current, filename);
              } catch (err) {
                console.error("Failed to capture card:", err);
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {t.shareDownloadPNG}
          </button>

          {/* Copy to Clipboard */}
          <button
            type="button"
            onClick={async () => {
              const text = `🧠 ${
                lang === "id" ? "Baru belajar tentang" : "Just learned about"
              } "${conceptInput}" ${lang === "id" ? "di" : "on"} Sederhanain!\n\n📖 ${data.tema}\n${
                data.deskripsi
              }\n\n1️⃣ ${data.langkah[0]?.judul}\n2️⃣ ${data.langkah[1]?.judul}\n3️⃣ ${
                data.langkah[2]?.judul
              }\n4️⃣ ${data.langkah[3]?.judul}\n\n🔗 sederhanain.web.app\n#Sederhanain`;
              try {
                await navigator.clipboard.writeText(text);
                setCopiedShare(true);
                setTimeout(() => setCopiedShare(false), 2500);
              } catch (err) {
                console.error("Failed to copy:", err);
              }
            }}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              copiedShare
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"
            }`}
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5" /> {t.shareCopied}
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> {t.shareCopyClipboard}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
