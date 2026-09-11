import React, { useState, useEffect, useRef } from "react";
import { Wallet, SearchX, ShieldCheck, Sparkles, Filter,
         ChevronRight, ChevronDown, CheckCircle2, TrendingUp,
         Calendar, Target, BookOpen, Star } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Header from "../components/Header";
import NavTabs from "../components/NavTabs";
import SkeletonLoader from "../components/SkeletonLoader";
import { STATUS_STYLE } from "../constants";

function AnimatedNumber({ value, suffix = "" }) {
  const prefersReduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (prefersReduced) { setDisplay(value); return; }
    const start = Date.now();
    const duration = 900;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(ease * value));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, prefersReduced]);
  return <>{display}{suffix}</>;
}

function ScoreRing({ score }) {
  const prefersReduced = useReducedMotion();
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (prefersReduced) { setDisplayed(score); return; }
    const start = Date.now();
    const duration = 1100;
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(ease * score));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score, prefersReduced]);
  const dashOffset = circ - (circ * displayed) / 100;
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(0,168,120,0.12)" strokeWidth="7" />
        <circle cx="50" cy="50" r={radius} fill="none"
          stroke="url(#scoreGrad)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={prefersReduced ? circ - (circ * score) / 100 : dashOffset}
          style={{ transition: prefersReduced ? "none" : "stroke-dashoffset 0.05s" }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00A878" />
            <stop offset="100%" stopColor="#00D4B0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <div className="font-display text-2xl font-bold text-slate-900">
          <AnimatedNumber value={score} suffix="%" />
        </div>
        <div className="text-xs text-slate-500 font-medium">Score</div>
      </div>
    </div>
  );
}

export default function DashboardScreen({ screen, setScreen, matches, analysis, loading, onSelect, onRestart }) {
  const prefersReduced = useReducedMotion();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [showIneligible, setShowIneligible] = useState(false);
  const [showAllMap, setShowAllMap] = useState({ all: false, planA: false, planB: false, planC: false });

  const viableMatches = matches.filter((m) => m.status === "eligible" || m.status === "partial");
  const ineligibleMatches = matches.filter((m) => {
    if (selectedCountry !== "all" && m.country !== selectedCountry) return false;
    return m.status === "ineligible";
  });

  const topEligible = viableMatches.find((m) => m.status === "eligible") || viableMatches[0];
  const topAwardPkr = topEligible?.financials?.coveredAmountPkr || 0;
  const avgScore = viableMatches.length
    ? Math.round(viableMatches.reduce((s, m) => s + (m.score || 0), 0) / viableMatches.length)
    : 0;

  const filteredMatches = viableMatches.filter((m) => {
    if (selectedCountry !== "all" && m.country !== selectedCountry) return false;
    if (activeTab === "planA") return m.score >= 80 || (m.country !== "Pakistan" && (m.status === "eligible" || m.status === "partial"));
    if (activeTab === "planB") return m.status === "eligible" && m.score < 80;
    if (activeTab === "planC") return (m.status === "eligible" && m.country === "Pakistan") || m.status === "partial";
    return true;
  });
  const visibleMatches = showAllMap[activeTab] ? filteredMatches : filteredMatches.slice(0, 5);
  const countries = ["all", ...Array.from(new Set(viableMatches.map((m) => m.country).filter(Boolean)))];

  // AI summary
  const aiSummary = analysis?.recommendations?.[0]?.why_suitable || analysis?.top_scholarships?.[0]?.why_suitable;

  const STAT_CARDS = [
    { icon: Star,     label: "Match Score",     value: avgScore,             suffix: "%", color: "#00A878" },
    { icon: BookOpen, label: "Scholarships",    value: viableMatches.length, suffix: "",  color: "#4F7CFF" },
    { icon: Target,   label: "Plan A (Reach)",  value: viableMatches.filter(m => m.score >= 80).length, suffix: "", color: "#F5B942" },
    { icon: Calendar, label: "Safety Nets",     value: viableMatches.filter(m => m.status === "eligible" && m.country === "Pakistan").length, suffix: "", color: "#00D4B0" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <Header subtitle="Your matched scholarships, ranked by academic & financial fit" />
      <NavTabs screen={screen} setScreen={setScreen} />

      {/* Welcome stats row */}
      {viableMatches.length > 0 && (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
          initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {STAT_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                className="bg-white rounded-2xl p-4 border text-center shadow-sm"
                style={{ borderColor: `${card.color}22` }}
                initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
              >
                <div className="flex justify-center mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${card.color}18` }}>
                    <Icon size={18} style={{ color: card.color }} />
                  </div>
                </div>
                <div className="font-display text-2xl font-bold text-slate-900">
                  <AnimatedNumber value={card.value} suffix={card.suffix} />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Score + award widget */}
      <div className="rounded-2xl p-4 mb-6 shadow-md border text-white flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #071A3D 0%, #063B46 50%, #071A3D 100%)", borderColor: "rgba(0,212,176,0.2)" }}>
        <div className="flex items-center gap-4">
          <ScoreRing score={avgScore} />
          <div>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#00D4B0" }}>
              <ShieldCheck size={14} />
              <span>Top Match Award Coverage</span>
            </div>
            <p className="font-display text-2xl font-bold">
              {topAwardPkr > 0 ? `PKR ${(topAwardPkr / 100000).toFixed(1)}L` : "—"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              estimated annual value
            </p>
          </div>
        </div>
        {aiSummary && (
          <div className="flex-1 max-w-sm text-left sm:text-right">
            <p className="text-xs font-medium mb-1 flex items-center gap-1 sm:justify-end" style={{ color: "#00A878" }}>
              <Sparkles size={13} /> AI Insight
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
              {aiSummary.slice(0, 140)}{aiSummary.length > 140 ? "…" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "planA", "planB", "planC"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={{
              background: activeTab === tab ? "linear-gradient(135deg,#00A878,#00D4B0)" : "rgba(0,0,0,0.05)",
              color: activeTab === tab ? "white" : "#4b5563",
              boxShadow: activeTab === tab ? "0 0 14px rgba(0,168,120,0.3)" : "none",
            }}
          >
            {tab === "all" ? "All" : tab === "planA" ? "Plan A (Reach)" : tab === "planB" ? "Plan B (Realistic)" : "Plan C (Safety)"}
          </button>
        ))}
      </div>

      {/* Country filter */}
      {countries.length > 2 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {countries.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCountry(c)}
              className="text-xs px-3 py-1 rounded-full border transition-all duration-200"
              style={{
                background: selectedCountry === c ? "#00A878" : "transparent",
                borderColor: selectedCountry === c ? "#00A878" : "#d1d5db",
                color: selectedCountry === c ? "white" : "#6b7280",
              }}
            >
              {c === "all" ? "All Countries" : c}
            </button>
          ))}
        </div>
      )}

      {/* Match list */}
      {loading && <SkeletonLoader />}

      {!loading && visibleMatches.length === 0 && (
        <div className="text-center py-16">
          <SearchX size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No matches for this filter.</p>
          <button onClick={() => { setActiveTab("all"); setSelectedCountry("all"); }}
            className="mt-3 text-sm font-medium" style={{ color: "#00A878" }}>
            Clear filters
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {visibleMatches.map((m, idx) => {
          const style = STATUS_STYLE[m.status] || STATUS_STYLE.partial;
          return (
            <motion.div
              key={m.id || idx}
              initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
              onClick={() => onSelect(m)}
              className="bg-white rounded-2xl p-4 border cursor-pointer transition-all duration-200 hover:shadow-md group"
              style={{ borderColor: "#e5e7eb" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#00A878"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.transform = ""; }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                      {style.label}
                    </span>
                    {m.country && <span className="text-xs text-slate-400">{m.country}</span>}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">{m.name}</h3>
                  {m.reason && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.reason}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {m.score > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(0,168,120,0.1)", color: "#00A878" }}>
                      {m.score}%
                    </span>
                  )}
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredMatches.length > 5 && !showAllMap[activeTab] && (
        <button
          onClick={() => setShowAllMap(prev => ({ ...prev, [activeTab]: true }))}
          className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium border transition-colors duration-200 flex items-center justify-center gap-2"
          style={{ borderColor: "rgba(0,168,120,0.3)", color: "#00A878" }}
        >
          Show all {filteredMatches.length} matches <ChevronDown size={16} />
        </button>
      )}

      {/* Ineligible toggle */}
      {ineligibleMatches.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowIneligible(v => !v)}
            className="text-xs font-medium flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Filter size={13} /> {showIneligible ? "Hide" : "Show"} {ineligibleMatches.length} ineligible
          </button>
          {showIneligible && (
            <div className="mt-3 flex flex-col gap-2">
              {ineligibleMatches.map((m, i) => (
                <div key={i} onClick={() => onSelect(m)} className="bg-white rounded-xl p-3 border border-rose-100 cursor-pointer hover:border-rose-300 transition-colors">
                  <p className="text-sm font-medium text-slate-700">{m.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{m.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Restart */}
      <div className="mt-8 text-center">
        <button onClick={onRestart} className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
          ← Refine my profile
        </button>
      </div>
    </div>
  );
}
