import React, { useState } from "react";
import { Wallet, SearchX, ShieldCheck, Sparkles, Filter, ChevronRight, Award } from "lucide-react";
import Header from "../components/Header";
import NavTabs from "../components/NavTabs";
import SkeletonLoader from "../components/SkeletonLoader";
import { STATUS_STYLE, SAVINGS_TOTAL } from "../constants";

export default function DashboardScreen({ screen, setScreen, matches, loading, onSelect, onRestart }) {
  const [activeTab, setActiveTab] = useState("all"); // "all" | "planA" | "planB" | "planC"
  const [selectedCountry, setSelectedCountry] = useState("all");

  // Plan categorization rules
  const filteredMatches = matches.filter((m) => {
    if (selectedCountry !== "all" && m.country !== selectedCountry) return false;

    if (activeTab === "planA") return m.score >= 75 || m.country !== "Pakistan"; // Reach / International
    if (activeTab === "planB") return m.status === "eligible" && m.score < 75; // Realistic
    if (activeTab === "planC") return m.status === "partial" || (m.status === "eligible" && m.country === "Pakistan"); // Safety
    return true;
  });

  const countries = ["all", ...Array.from(new Set(matches.map((m) => m.country).filter(Boolean)))];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Header subtitle="Your matched scholarships, ranked by academic & financial fit" />
      <NavTabs screen={screen} setScreen={setScreen} />

      {/* Savings Tracker Widget */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-xl p-4 mb-6 shadow-md border border-emerald-700/40 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium mb-1">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>Agent Fees Avoided So Far</span>
          </div>
          <p className="font-serif text-2xl font-bold tracking-tight text-white">
            PKR {SAVINGS_TOTAL.toLocaleString()} <span className="text-xs font-sans font-normal text-emerald-200 opacity-90">saved</span>
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
          <Wallet className="text-emerald-300" size={24} />
        </div>
      </div>

      {/* Plan A / B / C Category Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 mb-4 border border-slate-200">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All Matches ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab("planA")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === "planA" ? "bg-emerald-800 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles size={13} className="text-amber-300" />
          Plan A (Reach)
        </button>
        <button
          onClick={() => setActiveTab("planB")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "planB" ? "bg-emerald-800 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Plan B (Realistic)
        </button>
        <button
          onClick={() => setActiveTab("planC")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "planC" ? "bg-emerald-800 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Plan C (Safety)
        </button>
      </div>

      {/* Country Filters */}
      {countries.length > 2 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <Filter size={13} className="text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 font-medium shrink-0">Country:</span>
          {countries.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCountry(c)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all shrink-0 capitalize ${
                selectedCountry === c ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-8">
          <SkeletonLoader count={4} />
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="border border-slate-200 rounded-xl bg-white p-10 text-center mt-8 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
            <SearchX size={32} />
          </div>
          <p className="text-slate-900 font-medium text-lg mb-1">No matches found</p>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            We couldn't find any scholarships matching this specific profile. Try adjusting your constraints in the intake form.
          </p>
        </div>
      )}

      {!loading && matches.length > 0 && filteredMatches.length === 0 && (
        <div className="border border-slate-200 rounded-xl bg-white p-8 text-center my-6">
          <p className="text-slate-700 text-sm font-medium">No scholarships found under this specific filter tab.</p>
          <button onClick={() => { setActiveTab("all"); setSelectedCountry("all"); }} className="mt-2 text-xs text-emerald-700 font-bold underline">
            Show all {matches.length} matches
          </button>
        </div>
      )}

      {!loading && filteredMatches.length > 0 && (
        <div className="space-y-3.5">
          {filteredMatches.map((m) => {
            const s = STATUS_STYLE[m.status] || STATUS_STYLE.ineligible;
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m)}
                className="w-full text-left border border-slate-200/90 rounded-xl p-4 flex items-center gap-4 hover:border-emerald-600 hover:shadow-md transition-all bg-white group"
              >
                {/* Badge Icon */}
                <div className={`shrink-0 w-14 h-14 rounded-xl border ${s.border} ${s.bg} flex flex-col items-center justify-center shadow-xs`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider text-center leading-tight ${s.text}`}>
                    {s.label}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-emerald-900 transition-colors">{m.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">{m.tag}</span>
                    <span>•</span>
                    <span className="text-slate-600">{m.country}</span>
                  </div>
                  <p className="text-xs text-slate-500 italic truncate">{m.reason}</p>
                </div>

                {/* Score */}
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <p className="font-serif text-lg font-bold text-slate-900 leading-none">{m.score}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Fit Score</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-700 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
        <button onClick={onRestart} className="text-xs text-slate-500 hover:text-slate-900 font-medium underline transition-colors">
          Restart Intake Form
        </button>
        <span className="text-xs text-slate-400">Verified Dataset • PKR Currency First</span>
      </div>
    </div>
  );
}

