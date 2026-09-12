import React from "react";
import { UserCircle, LogOut } from "lucide-react";

export default function Navbar({ user, onLogout, onNavigate, currentScreen }) {
  return (
    <nav className="print:hidden bg-white border-b border-slate-200/90 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-xs">
      <button onClick={() => onNavigate(user ? "dashboard" : "landing")} className="flex items-center gap-2.5 text-slate-900 font-serif font-bold text-xl group">

        <img src="/logo.png" alt="NextStep AI Logo" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" />
        <span className="tracking-tight">NextStep <span className="text-emerald-800">AI</span></span>
      </button>

      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate("intake")}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
            currentScreen === "intake"
              ? "bg-emerald-800 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Find Matches
        </button>

        {currentScreen !== "landing" && currentScreen !== "intake" && (
          <button
            onClick={() => onNavigate("dashboard")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              currentScreen === "dashboard" || currentScreen === "detail" || currentScreen === "roadmap" || currentScreen === "parent"
                ? "text-emerald-800 underline"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Dashboard
          </button>
        )}

        {user ? (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <button
              onClick={() => onNavigate("account")}
              className={`text-xs font-bold flex items-center gap-1 ${
                currentScreen === "account" ? "text-emerald-800 underline" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCircle size={16} />
              <span>{user.name.split(" ")[0]}</span>
            </button>
            <button onClick={onLogout} title="Log out" className="text-slate-400 hover:text-rose-600 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate("login")}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-900 border border-emerald-800/30 px-3 py-1.5 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
          >
            Log in
          </button>
        )}
      </div>
    </nav>
  );
}

