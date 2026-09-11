import React, { useState } from "react";
import { ArrowLeft, Sparkles, AlertTriangle, ShieldCheck, TrendingUp, DollarSign, ExternalLink, Calendar, CheckCircle2 } from "lucide-react";
import Seal from "../components/Seal";
import { STATUS_STYLE, SCORE_FIELDS } from "../constants";

export default function DetailScreen({ match, onBack }) {
  const [stressScenario, setStressScenario] = useState("base"); // "base" | "deval15" | "deval30"

  const s = STATUS_STYLE[match.status] || STATUS_STYLE.ineligible;

  // Financial stress test calculations
  const baseTotal = match.financials?.totalCostPkr || 2000000;
  const coveragePercent = match.financials?.coveragePercent || 100;
  
  let multiplier = 1.0;
  let scenarioLabel = "Current PKR Exchange Rate";
  if (stressScenario === "deval15") {
    multiplier = 1.15;
    scenarioLabel = "+15% PKR Devaluation (Moderate Scenario)";
  } else if (stressScenario === "deval30") {
    multiplier = 1.30;
    scenarioLabel = "+30% PKR Devaluation (Severe Scenario)";
  }

  const stressedTotalPkr = Math.round(baseTotal * multiplier);
  const coveredPkr = Math.round(stressedTotalPkr * (coveragePercent / 100));
  const outOfPocketPkr = Math.max(0, stressedTotalPkr - coveredPkr);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
        <ArrowLeft size={16} /> Back to matches
      </button>

      {/* Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Seal status={match.status} />
          <div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 uppercase tracking-wider mb-1.5 inline-block">
              {match.tag}
            </span>
            <h2 className="font-serif text-2xl font-bold text-slate-900 leading-tight">{match.name}</h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
              <span>Country: <strong>{match.country}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {match.deadlineRaw}</span>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <p className="font-serif text-3xl font-bold text-slate-900 leading-none">{match.score}</p>
          <p className="text-[10px] text-slate-500 uppercase font-semibold mt-1">Match Fit Score</p>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-700" />
          <span>Verified Dataset Source: <strong>Official Portal</strong></span>
        </div>
        <span className="text-slate-400 text-[11px]">Last Checked: {match.lastVerifiedDate}</span>
      </div>

      {/* Score Breakdown Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Fit Score Breakdown Bar Chart</h3>
        <div className="space-y-3">
          {SCORE_FIELDS.map((f) => {
            const rawVal = match.breakdown[f.key] || 0;
            const maxVal = f.key === "academic_fit" ? 30 : f.key === "field_fit" ? 25 : f.key === "funding_fit" ? 20 : f.key === "country_fit" ? 15 : 10;
            const pct = Math.min(100, Math.round((rawVal / maxVal) * 100));

            return (
              <div key={f.key}>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>{f.label}</span>
                  <span className="font-bold">{rawVal} / {maxVal} pts</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-700 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Explanation Panel (Visually Separate Container) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-md border border-slate-700 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">AI Match Evaluation &amp; Insights</span>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">RAG &amp; Rules Powered</span>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide mb-1">Why this scholarship fits your profile:</p>
            <p className="text-sm text-slate-200 leading-relaxed">{match.aiWhySuitable || match.reason}</p>
          </div>
          {match.aiHowToApply && (
            <div className="pt-2 border-t border-slate-700/60">
              <p className="text-[11px] font-bold text-teal-300 uppercase tracking-wide mb-1">Application Steps &amp; Requirements:</p>
              <p className="text-sm text-slate-300 leading-relaxed">{match.aiHowToApply}</p>
            </div>
          )}
        </div>
      </div>

      {/* Gap-to-Action Box (If Partial or Ineligible) */}
      {match.gap && (
        <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle size={16} className="text-amber-700" />
            <span>Gap-to-Action Checklist (What is Missing)</span>
          </div>
          <p className="text-sm text-amber-900">{match.gap}</p>
          <div className="pt-2 text-xs text-amber-800 font-medium flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-amber-700" />
            <span>Estimated time to resolve requirement: <strong>2 – 4 weeks</strong></span>
          </div>
        </div>
      )}

      {/* Currency Stress-Test Toggle (Only for Foreign Opportunities) */}
      {match.country !== "Pakistan" ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-800" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Currency Stress-Test Toggle</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Foreign Exchange Analysis</span>
          </div>

          <p className="text-xs text-slate-500">
            Simulate how foreign currency inflation or PKR devaluation impacts your net out-of-pocket education costs in {match.country}.
          </p>

          {/* Toggle Scenario Buttons */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setStressScenario("base")}
              className={`py-2 text-xs font-bold rounded-md transition-all ${
                stressScenario === "base" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Base Exchange Rate
            </button>
            <button
              onClick={() => setStressScenario("deval15")}
              className={`py-2 text-xs font-bold rounded-md transition-all ${
                stressScenario === "deval15" ? "bg-emerald-800 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              +15% Devaluation
            </button>
            <button
              onClick={() => setStressScenario("deval30")}
              className={`py-2 text-xs font-bold rounded-md transition-all ${
                stressScenario === "deval30" ? "bg-emerald-800 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              +30% Devaluation
            </button>
          </div>

          {/* Scenario Calculation Breakdown */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Total Cost ({scenarioLabel})</p>
              <p className="text-sm font-bold text-slate-900 mt-1">PKR {stressedTotalPkr.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Scholarship Coverage ({coveragePercent}%)</p>
              <p className="text-sm font-bold text-emerald-800 mt-1">PKR {coveredPkr.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Net Out-of-Pocket Gap</p>
              <p className="text-sm font-bold text-rose-800 mt-1">PKR {outOfPocketPkr.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-700" />
            <span><strong>Domestic Program:</strong> Fee structure is directly PKR-denominated with zero foreign exchange risk.</span>
          </div>
          <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">PKR Native</span>
        </div>
      )}

      {/* Official Link Action */}
      {match.sourceUrl && (
        <div className="pt-2">
          <a
            href={match.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span>Visit Official Application Portal</span>
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
}

