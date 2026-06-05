import React from "react";
import { Search, X, Sparkles, ChevronRight, Trash2, AlertOctagon } from "lucide-react";
import { HistoryItem, SederhanainData } from "../../types";

interface CommandPaletteProps {
  isCommandOpen: boolean;
  setIsCommandOpen: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filteredHistory: HistoryItem[];
  conceptInput: string;
  data: SederhanainData | null;
  deleteHistoryItem: (concept: string) => void;
  onSelectHistoryItem: (item: HistoryItem) => void;
}

export function CommandPalette({
  isCommandOpen,
  setIsCommandOpen,
  searchQuery,
  setSearchQuery,
  filteredHistory,
  conceptInput,
  data,
  deleteHistoryItem,
  onSelectHistoryItem,
}: CommandPaletteProps) {
  if (!isCommandOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsCommandOpen(false)}
      />

      {/* Main Panel */}
      <div className="bg-zinc-950 border border-zinc-800/80 w-full max-w-xl rounded-2xl shadow-2xl relative z-10 overflow-hidden text-zinc-100">
        {/* Search Input */}
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

        {/* Results List */}
        <div className="max-h-[320px] overflow-y-auto p-2 space-y-4">
          <div>
            <span className="px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-zinc-500 block mb-2">
              RIWAYAT PENCARIAN AKTIF ({filteredHistory.length})
            </span>

            {filteredHistory.length > 0 ? (
              <div className="space-y-1">
                {filteredHistory.map((item, idx) => {
                  const isActiveTopic = data && item.concept.toLowerCase() === conceptInput.toLowerCase();
                  return (
                    <div
                      key={idx}
                      className={`w-full flex items-center justify-between p-1 rounded-xl transition duration-150 group/item
                        ${
                          isActiveTopic
                            ? "bg-emerald-950/20 border border-emerald-500/20 text-emerald-400"
                            : "hover:bg-zinc-900/60 border border-transparent text-zinc-400 hover:text-white"
                        }`}
                    >
                      {/* Main Clickable Area to Select History */}
                      <div
                        onClick={() => {
                          onSelectHistoryItem(item);
                          setIsCommandOpen(false);
                        }}
                        className="flex-1 text-left p-2 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-lg flex items-center justify-center border transition shrink-0
                            ${
                              isActiveTopic
                                ? "bg-emerald-950 border-emerald-500/30 text-emerald-400"
                                : "bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30"
                            }`}
                          >
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-mono text-xs font-bold block">{item.concept}</span>
                            <span className="text-[10px] text-zinc-500 block group-hover:text-zinc-400 truncate max-w-[200px] md:max-w-xs">
                              {item.data.tema}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHistoryItem(item.concept);
                            }}
                            className="p-2 mr-1 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition duration-150 cursor-pointer shrink-0 opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                            title="Hapus dari riwayat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="flex items-center gap-2">
                            {isActiveTopic && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                                AKTIF
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300" />
                          </div>
                        </div>
                      </div>
                    </div>
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

          {/* Navigation Helper Tips */}
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
  );
}
