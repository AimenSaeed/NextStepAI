import React, { useState } from "react";
import { Wallet, SearchX, ShieldCheck, Sparkles, Filter, ChevronRight, ChevronDown, CheckCircle2 } from "lucide-react";
import Header from "../components/Header";
import NavTabs from "../components/NavTabs";
import SkeletonLoader from "../components/SkeletonLoader";
import { STATUS_STYLE } from "../constants";

export default function DashboardScreen({ screen, setScreen, matches, analysis, loading, onSelect, onRestart }) {
  const [activeTab, setActiveTab] = useState("all"); // "all" | "planA" | "planB" | "planC"
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [showIneligible, setShowIneligible] = useState(false);
  // Track toggle state per tab for showing all matches vs top few
  const [showAllMap, setShowAllMap] = useState({ all: false, planA: false, planB: false, planC: false });

  const viableMatches = matches.filter((m) => m.status === "eligible" || m.status === "partial");
  const ineligibleMatches = matches.filter((m) => {
  if (selectedCountry !== "all" && m.country !== selectedCountry) return false;
  return m.status === "ineligible";
});

  // Top eligible match aid figure
  const topEligible = viableMatches.find((m) => m.status === "eligible") || viableMatches[0];
  const topAwardPkr = topEligible?.financials?.coveredAmountPkr || 0;

  // Plan categorization rules over viable matches
  const filteredMatches = viableMatches.filter((m) => {
    if (selectedCountry !== "all" && m.country !== selectedCountry) return false;

    if (activeTab === "planA") {
      // Reach: High-aiming matches (score >= 80 or selective overseas reach)
      return m.score >= 80 || (m.country !== "Pakistan" && (m.status === "eligible" || m.status === "partial"));
    }
    if (activeTab === "planB") {
      // Realistic: Strong eligible direct fits
      return m.status === "eligible" && m.score < 80;
    }
    if (activeTab === "planC") {
      // Safety: Domestic opportunities or accessible safety options
      return (m.status === "eligible" && m.country === "Pakistan") || m.status === "partial";
    }
    return true;
  });
  // Determine whether to show all matches or only top few for the active tab
  const visibleMatches = showAllMap[activeTab] ? filteredMatches : filteredMatches.slice(0, 5);

  const countries = ["all", ...Array.from(new Set(viableMatches.map((m) => m.country).filter(Boolean)))];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Header subtitle="Your matched scholarships, ranked by academic & financial fit" />
      <NavTabs screen={screen} setScreen={setScreen} />

      {/* Top Real Financial Value Widget */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-xl p-4 mb-6 shadow-md border border-emerald-700/40 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium mb-1">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>Top Match Award Coverage</span>
          </div>
          <p className="font-serif text-2xl font-bold tracking-tight text-white">
            {topAwardPkr > 0 ? `PKR ${topAwardPkr.toLocaleString()}` : "100% Tuition Waiver"} <span className="text-xs font-sans font-normal text-emerald-200 opacity-90">subsidized aid / year</span>
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
          All Qualified ({viableMatches.length})
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
          <p className="text-slate-900 font-bold text-lg mb-1">No matches calculated yet</p>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            Please complete your academic profile in the intake form to generate verified scholarship matches.
          </p>
          <button
            onClick={onRestart}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm transition-all"
          >
            Start Intake Form
          </button>
        </div>
      )}

      {!loading && matches.length > 0 && filteredMatches.length === 0 && (
        <div className="border border-slate-200 rounded-xl bg-white p-8 text-center my-6">
          <p className="text-slate-700 text-sm font-medium">No scholarships found under this specific category filter.</p>
          <button onClick={() => { setActiveTab("all"); setSelectedCountry("all"); }} className="mt-2 text-xs text-emerald-700 font-bold underline">
            Show all {viableMatches.length} qualified opportunities
          </button>
        </div>
      )}

      {!loading && filteredMatches.length > 0 && (
  <>
    <div className="space-y-3.5">
      {visibleMatches.map((m) => {
        const s = STATUS_STYLE[m.status] || STATUS_STYLE.ineligible;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            className="w-full text-left border border-slate-200/90 rounded-xl p-4 flex flex-col gap-2 hover:border-emerald-600 hover:shadow-md transition-all bg-white group"
          >
            <div className="flex items-start gap-4 w-full">
              {/* Badge */}
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
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{m.reason}</p>
              </div>

              {/* Score */}
              <div className="text-right shrink-0 flex items-center gap-3">
                <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <p className="font-serif text-lg font-bold text-slate-900 leading-none">{m.score}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Fit Score</p>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-700 transition-colors" />
              </div>
            </div>

            {/* Plan A Embedded RAG Roadmap / Action Tip */}
            {(activeTab === "planA" || m.status === "partial") && (m.roadmapAction || m.gap) && (
              <div className="mt-1 bg-emerald-50/80 border border-emerald-200 text-emerald-900 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2">
                <Sparkles size={13} className="text-emerald-600 shrink-0" />
                <span><strong>Roadmap Action to Win:</strong> {m.roadmapAction || m.gap}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
    {filteredMatches.length > 5 && (
      <button
        onClick={() => setShowAllMap(prev => ({ ...prev, [activeTab]: !prev[activeTab] }))}
        className="mt-2 text-sm text-emerald-600"
        aria-label={showAllMap[activeTab] ? "Show fewer scholarships" : `Show ${filteredMatches.length - 5} more scholarships`}
      >
        {showAllMap[activeTab] ? "Show fewer" : `Show ${filteredMatches.length - 5} more`}
      </button>
    )}
  </>
)}

      {/* Collapsible Disqualified Scholarships Section */}
      {!loading && ineligibleMatches.length > 0 && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <button
            onClick={() => setShowIneligible(!showIneligible)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <span>{showIneligible ? "Hide" : "View"} Disqualified / Ineligible Scholarships ({ineligibleMatches.length})</span>
            <ChevronDown size={14} className={`transition-transform ${showIneligible ? "rotate-180" : ""}`} />
          </button>

          {showIneligible && (
            <div className="mt-4 space-y-2.5 opacity-85">
              <p className="text-[11px] text-slate-500 mb-2">These opportunities do not match your current degree level, domicile, or field criteria:</p>
              {ineligibleMatches.map((m) => (
                <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{m.name}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{m.reason}</p>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0">
                    Disqualified
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
        <button onClick={onRestart} className="text-xs text-slate-500 hover:text-slate-900 font-medium underline transition-colors">
          Edit Profile / Restart Intake
        </button>
        <span className="text-xs text-slate-400">Verified Database Source • PKR Currency First</span>
      </div>
    </div>
  );
}

