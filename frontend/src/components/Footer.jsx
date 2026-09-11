import React from "react";
import { Compass, ShieldCheck, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="print:hidden border-t border-slate-200/80 py-10 mt-auto" style={{ background: "#071A3D" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="NextStep AI" className="h-7 w-auto object-contain opacity-90" />
          <span className="font-display text-base font-bold text-white tracking-tight">
            NextStep <span style={{ color: "#00D4B0" }}>AI</span>
          </span>
          <span className="text-xs text-slate-400 ml-2 hidden sm:inline">
            • AI Scholarship Navigator for Pakistani Students
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1 text-slate-300">
            <ShieldCheck size={14} className="text-[#00A878]" /> 100% Free & Independent
          </span>
          <span>•</span>
          <span>Verified 2026</span>
        </div>
      </div>
    </footer>
  );
}
