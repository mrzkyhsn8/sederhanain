import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, History, Search, ArrowRight, Loader2 } from "lucide-react";
import { TRANSLATIONS } from "../../constants/translations";

interface HeaderProps {
  data: any;
  isLoading: boolean;
  conceptInput: string;
  setConceptInput: (val: string) => void;
  token: string | null;
  userProfile: any;
  isProfileOpen: boolean;
  setIsProfileOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  setIsCommandOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  lang: "id" | "en";
  handleLanguageChange: (lang: "id" | "en") => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleLogout: () => void;
  login: () => void;
  resetApp: () => void;
}

export function Header({
  data,
  isLoading,
  conceptInput,
  setConceptInput,
  token,
  userProfile,
  isProfileOpen,
  setIsProfileOpen,
  setIsCommandOpen,
  lang,
  handleLanguageChange,
  handleSubmit,
  handleLogout,
  login,
  resetApp
}: HeaderProps) {
  const t = TRANSLATIONS[lang];

  const renderLanguageSwitcher = () => (
    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 shrink-0 select-none">
      <button
        type="button"
        onClick={() => handleLanguageChange("id")}
        className={`px-2.5 py-1 text-[9px] font-bold rounded-full transition-all cursor-pointer ${
          lang === "id"
            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => handleLanguageChange("en")}
        className={`px-2.5 py-1 text-[9px] font-bold rounded-full transition-all cursor-pointer ${
          lang === "en"
            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black"
            : "text-zinc-400 hover:text-white"
        }`}
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
    <>
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
                onClick={resetApp}
                className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter uppercase text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Sederhanain.
              </button>
              <span className="hidden md:inline text-[10px] uppercase tracking-[0.3em] font-medium text-white/40">
                AI Concept Visualizer
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4">
              <button
                type="button"
                onClick={() => setIsCommandOpen(true)}
                className="flex items-center justify-center w-9 h-9 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 rounded-full shadow-md transition-all duration-200 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                title={`${t.searchHistoryHeader} (Ctrl + K)`}
              >
                <History className="w-4 h-4" />
              </button>

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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />

                  <button
                    type="submit"
                    disabled={isLoading || !conceptInput.trim()}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none ${
                      conceptInput.trim()
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

      {/* Landing page top floating navigation */}
      {!data && !isLoading && (
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
                onClick={login}
                className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 hover:border-emerald-500/50 bg-zinc-950/80 hover:bg-emerald-500/5 text-zinc-300 hover:text-emerald-400 text-xs font-bold tracking-wide transition-all duration-300 shadow-md hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{t.loginText}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
