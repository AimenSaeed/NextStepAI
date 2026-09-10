import React from "react";
import { UserCircle, LogOut } from "lucide-react";

export default function Navbar({ user, onLogout, onNavigate, currentScreen }) {
  return (
    <nav className="print:hidden bg-white border-b border-slate-200/90 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-xs">
      <button onClick={() => onNavigate(user ? "dashboard" : "landing")} className="flex items-center gap-2.5 text-slate-900 font-serif font-bold text-xl group">

        <img src="/logo.png" alt="NextStep AI Logo" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" />
        <span className="tracking-tight">NextStep <span className="text-emerald-800">AI</span></span>
      </button>

      {user && (
        <div className="flex items-center gap-6">
          <button onClick={() => onNavigate("dashboard")} className={`text-xs font-bold ${currentScreen === "dashboard" || currentScreen === "intake" ? "text-emerald-800 underline" : "text-slate-600 hover:text-slate-900"}`}>Dashboard</button>
          <button onClick={() => onNavigate("account")} className={`text-xs font-bold flex items-center gap-1 ${currentScreen === "account" ? "text-emerald-800 underline" : "text-slate-600 hover:text-slate-900"}`}>
            <UserCircle size={16} />
            {user.name.split(' ')[0]}
          </button>
          <button onClick={onLogout} className="text-slate-400 hover:text-rose-600 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      )}
      {!user && currentScreen !== "login" && currentScreen !== "landing" && (
        <button onClick={() => onNavigate("login")} className="text-xs font-bold text-emerald-800 hover:text-emerald-900 border border-emerald-800/30 px-3.5 py-1.5 rounded-lg bg-emerald-50/50">Log in</button>
      )}
    </nav>
  );
}

