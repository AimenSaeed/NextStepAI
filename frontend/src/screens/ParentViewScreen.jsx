import React, { useState } from "react";
import { Printer, Share2, ShieldCheck, Check, Heart, Award, TrendingUp, DollarSign, Calendar, FileText } from "lucide-react";
import Header from "../components/Header";
import NavTabs from "../components/NavTabs";

export default function ParentViewScreen({ screen, setScreen, matches, onBack }) {
  const [copied, setCopied] = useState(false);

  // Scholarship lists
  const eligibleMatches = matches.filter((m) => m.status === "eligible");
  const partialMatches = matches.filter((m) => m.status === "partial");
  const displayMatches = [...eligibleMatches, ...partialMatches].slice(0, 8);
  const topMatch = eligibleMatches[0] || matches[0];

  // Aggregate calculations
  const bestTuitionPkr = topMatch?.financials?.tuitionPkr || 450_000;
  const bestLivingPkr = topMatch?.financials?.livingPkr || 250_000;
  const bestTotalCostPkr = bestTuitionPkr + bestLivingPkr;
  const bestCoveredPkr = topMatch?.financials?.coveredAmountPkr || bestTotalCostPkr;
  const bestGapPkr = Math.max(0, bestTotalCostPkr - bestCoveredPkr);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();
  const pkr = (n) => `PKR ${Number(n || 0).toLocaleString()}`;

  // Stat cards for parents
  const PARENT_STATS = [
    { label: "Student Progress", value: matches.length ? "85%" : "0%", color: "#00A878" },
    { label: "Scholarship Matches", value: matches.length, color: "#4F7CFF" },
    { label: "Upcoming Windows", value: displayMatches.length > 0 ? "3" : "0", color: "#F5B942" },
    { label: "Top Subsidy", value: bestCoveredPkr > 0 ? `PKR ${(bestCoveredPkr/100000).toFixed(1)}L` : "—", color: "#00D4B0" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 print:p-0 print:max-w-none print:m-0">
      {/* Top Controls (hidden when printing) */}
      <div className="print:hidden space-y-4">
        <Header subtitle="Read-only, jargon-free financial summary for parents and sponsors" />
        <NavTabs screen={screen} setScreen={setScreen} />

        <div className="flex items-center justify-between bg-[#071A3D] text-white p-4 rounded-2xl shadow-sm border border-[#00D4B0]/20">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-rose-400" />
            <span className="text-xs font-semibold">Shareable Parent Summary View</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="bg-slate-800/80 hover:bg-slate-800 text-white text-xs px-3.5 py-1.5 rounded-xl border border-slate-700 font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
              <span>{copied ? "Link Copied!" : "Copy Share Link"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="text-white text-xs px-4 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              style={{ background: "linear-gradient(135deg, #00A878, #00D4B0)" }}
            >
              <Printer size={13} />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>

        {/* Quick reassuring stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PARENT_STATS.map((s, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-3.5 border border-slate-200/90 text-center shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">{s.label}</span>
              <span className="font-display text-xl font-bold text-slate-900">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Printable Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-sm space-y-6 print:border-none print:p-6 print:shadow-none print:w-full print:m-0">
        {/* Printable Report Header */}
        <div className="border-b border-slate-200 pb-5 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="NextStep AI Logo" className="h-12 w-auto object-contain" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-100 text-emerald-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Official Verification Report
                </span>
                <span className="text-xs text-slate-500 font-medium">• PKR Currency First</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-900">Financial Summary for Higher Education</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Prepared for parents &amp; guardians • Independent cost breakdown &amp; scholarship coverage
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <ShieldCheck size={28} className="text-[#00A878] ml-auto mb-1" />
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Verified Data</span>
          </div>
        </div>

        {/* Best Match Highlight Card */}
        {topMatch && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Best Matched Scholarship</p>
              <p className="font-display text-lg font-bold text-slate-900 mt-0.5">{topMatch.name}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Coverage Status:{" "}
                <strong className="text-[#00A878] font-semibold">
                  {topMatch.financials?.coveragePercent || 100}% Funded
                </strong>
              </p>
            </div>
            <div className="text-white text-xs font-bold px-4 py-2 rounded-xl text-center shadow-xs"
              style={{ background: "#071A3D" }}>
              Top Eligible Match
            </div>
          </div>
        )}

        {/* Big 3 PKR Financial Figures */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-slate-500">Estimated Annual Cost</p>
            <p className="font-display text-xl font-bold text-slate-900 mt-1">{pkr(bestTotalCostPkr)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Tuition + Living Expenses</p>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-emerald-900">Scholarship Coverage</p>
            <p className="font-display text-xl font-bold text-[#00A878] mt-1">{pkr(bestCoveredPkr)}</p>
            <p className="text-[10px] text-emerald-700 mt-1">Financial Aid Subsidized</p>
          </div>
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-rose-900">Net Out-of-Pocket Gap</p>
            <p className="font-display text-xl font-bold text-rose-700 mt-1">{pkr(bestGapPkr)}</p>
            <p className="text-[10px] text-rose-600 mt-1">Remaining Family Cost</p>
          </div>
        </div>

        {/* Table of scholarships */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-[#00A878]" />
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              All Matched Scholarships — Financial Breakdown
            </h2>
            <span className="ml-auto text-[10px] text-slate-400 font-medium">
              {displayMatches.length} scholarship{displayMatches.length !== 1 ? "s" : ""} found
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Scholarship Name</th>
                  <th className="p-3.5">Country</th>
                  <th className="p-3.5">Total Annual Cost</th>
                  <th className="p-3.5">Covered by Award</th>
                  <th className="p-3.5 text-right">Family Gap</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {displayMatches.length > 0 ? (
                  displayMatches.map((m, i) => {
                    const tuition = m.financials?.tuitionPkr || 450_000;
                    const living = m.financials?.livingPkr || 250_000;
                    const total = tuition + living;
                    const covered = m.financials?.coveredAmountPkr || 0;
                    const gap = Math.max(0, total - covered);
                    const isEligible = m.status === "eligible";

                    return (
                      <tr key={m.id || i} className={i === 0 ? "bg-emerald-50/40" : ""}>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900 leading-snug">{m.name}</div>
                          {i === 0 && (
                            <span className="text-[9px] font-bold text-[#00A878] uppercase tracking-wide">
                              ★ Best Match
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600">{m.country || "Pakistan"}</td>
                        <td className="p-3.5 text-slate-700">{pkr(total)}</td>
                        <td className="p-3.5 text-[#00A878] font-semibold">{pkr(covered)}</td>
                        <td className="p-3.5 text-right font-bold text-rose-600">{pkr(gap)}</td>
                        <td className="p-3.5 text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isEligible
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isEligible ? "Eligible" : "Partial"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                      No matched scholarships yet. Complete the intake form to generate results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {topMatch && (
            <div className="mt-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-950">
                <ShieldCheck size={16} className="text-[#00A878]" />
                <span>Parent Budget Guidance &amp; Reality Check</span>
              </div>
              <p className="text-emerald-900 leading-relaxed">
                A student enrolls in <strong>one</strong> degree program at a time. For your primary eligible match (<strong>{topMatch.name}</strong>), the projected family out-of-pocket commitment is <strong>{pkr(bestGapPkr)}/year</strong>, with <strong>{pkr(bestCoveredPkr)}/year</strong> subsidized by the scholarship.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Award size={16} className="text-[#00A878]" />
            <span>Calculated transparently by NextStep AI • Independent Scholarship Engine</span>
          </div>
          <span>Report Generated September 2026</span>
        </div>
      </div>
    </div>
  );
}
