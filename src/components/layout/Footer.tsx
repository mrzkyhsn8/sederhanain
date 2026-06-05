import React from "react";
import { TRANSLATIONS } from "../../constants/translations";

interface FooterProps {
  lang: "id" | "en";
}

export function Footer({ lang }: FooterProps) {
  const t = TRANSLATIONS[lang];

  return (
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
              <h4 className="text-emerald-400 font-bold mb-1 uppercase tracking-wider text-xs">
                Quick Links
              </h4>
              <a
                href="#"
                className="text-sm text-white/60 hover:text-emerald-400 hover:translate-x-1 transition-all w-fit"
              >
                {t.aboutUs}
              </a>
              <a
                href="#"
                className="text-sm text-white/60 hover:text-emerald-400 hover:translate-x-1 transition-all w-fit"
              >
                {t.githubRepo}
              </a>
              <a
                href="#"
                className="text-sm text-white/60 hover:text-emerald-400 hover:translate-x-1 transition-all w-fit"
              >
                {t.privacyPolicy}
              </a>
            </div>

            <div className="flex flex-col gap-4 max-w-sm">
              <h4 className="text-emerald-400 font-bold mb-1 uppercase tracking-wider text-xs">
                {t.aiDisclaimerTitle}
              </h4>
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
  );
}
