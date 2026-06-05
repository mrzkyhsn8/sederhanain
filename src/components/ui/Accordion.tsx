import React from "react";
import { ChevronRight } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  faq: FAQItem[];
  openIdx: number | null;
  setOpenIdx: (idx: number | null) => void;
}

export function Accordion({ faq, openIdx, setOpenIdx }: AccordionProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      {faq.map((item, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div
            key={idx}
            className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden group hover:border-emerald-500/20 hover:bg-white/[0.03] transition-all duration-300"
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="w-full text-left p-6 flex justify-between items-center cursor-pointer select-none focus:outline-none"
            >
              <span
                className={`font-bold text-sm md:text-base transition-colors duration-300 ${
                  isOpen ? "text-emerald-400" : "text-zinc-200 group-hover:text-emerald-400"
                }`}
              >
                {item.question}
              </span>
              <span
                className={`text-xs ml-4 flex items-center justify-center w-6 h-6 rounded-full bg-white/5 text-zinc-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-300 transform ${
                  isOpen ? "rotate-90 text-emerald-400 bg-emerald-500/10" : ""
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100 border-t border-white/5" : "grid-rows-[0fr] opacity-0"
              }`}
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
  );
}
