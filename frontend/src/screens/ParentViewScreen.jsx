import React, { useState } from "react";
import { Printer, Share2, ShieldCheck, Check, Heart, Award, TrendingUp } from "lucide-react";
import Header from "../components/Header";
import NavTabs from "../components/NavTabs";

export default function ParentViewScreen({ screen, setScreen, matches, onBack }) {
  const [copied, setCopied] = useState(false);

  // ── Scholarship lists ─────────────────────────────────────────────────────
  const eligibleMatches  = matches.filter((m) => m.status === "eligible");
  const partialMatches   = matches.filter((m) => m.status === "partial");
  // Show eligible first, then partial — cap at 8 rows so the table stays readable
  const displayMatches   = [...eligibleMatches, ...partialMatches].slice(0, 8);
  const topMatch         = eligibleMatches[0] || matches[0];

  // ── Aggregate totals across ALL displayed scholarships ────────────────────
  const bestTuitionPkr   = topMatch?.financials?.tuitionPkr   || 450_000;
  const bestLivingPkr    = topMatch?.financials?.livingPkr    || 250_000;
  const bestTotalCostPkr = bestTuitionPkr + bestLivingPkr;
  const bestCoveredPkr   = topMatch?.financials?.coveredAmountPkr || bestTotalCostPkr;
  const bestGapPkr       = Math.max(0, bestTotalCostPkr - bestCoveredPkr);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  // Helper — format PKR with commas
  const pkr = (n) => `PKR ${Number(n || 0).toLocaleString()}`;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 print:p-0 print:max-w-none print:m-0">

      {/* ── Top Controls (hidden when printing) ── */}
      <div className="print:hidden space-y-4">
        <Header subtitle="Read-only, jargon-free financial summary for parents and sponsors" />
        <NavTabs screen={screen} setScreen={setScreen} />

        <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-rose-400" />
            <span className="text-xs font-semibold">Shareable Parent Summary View</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
              <span>{copied ? "Link Copied!" : "Copy Share Link"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer size={13} />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Printable Card ── */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-8 shadow-sm space-y-6 print:border-none print:p-6 print:shadow-none print:w-full print:m-0">

        {/* Printable Report Header */}
        <div className="border-b border-slate-200 pb-5 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="NextStep AI Logo" className="h-14 w-auto object-contain" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-100 text-emerald-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Official Verification Report
                </span>
                <span className="text-xs text-slate-500 font-medium">• PKR Currency First</span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-slate-900">Financial Summary for Higher Education</h1>
              <p className="text-xs text-slate-500 mt-1">
                Prepared for parents &amp; guardians • Independent cost breakdown &amp; scholarship coverage
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <ShieldCheck size={28} className="text-emerald-800 ml-auto mb-1" />
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Verified Data</span>
          </div>
        </div>

        {/* ── Best Match Highlight Card ── */}
        {topMatch && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Best Matched Scholarship</p>
              <p className="font-serif text-lg font-bold text-slate-900 mt-0.5">{topMatch.name}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Coverage Status:{" "}
                <strong className="text-emerald-800 font-semibold">
                  {topMatch.financials?.coveragePercent || 100}% Funded
                </strong>
              </p>
            </div>
            <div className="bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg text-center shadow-xs">
              Top Eligible Match
            </div>
          </div>
        )}

        {/* ── Big 3 PKR Financial Figures (from best match) ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-slate-500">Estimated Annual Cost</p>
            <p className="font-serif text-xl font-bold text-slate-900 mt-1">{pkr(bestTotalCostPkr)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Tuition + Living Expenses</p>
          </div>
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-emerald-900">Scholarship Coverage</p>
            <p className="font-serif text-xl font-bold text-emerald-800 mt-1">{pkr(bestCoveredPkr)}</p>
            <p className="text-[10px] text-emerald-700 mt-1">Financial Aid Subsidized</p>
          </div>
          <div className="bg-rose-50/80 border border-rose-200/80 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-rose-900">Net Out-of-Pocket Gap</p>
            <p className="font-serif text-xl font-bold text-rose-800 mt-1">{pkr(bestGapPkr)}</p>
            <p className="text-[10px] text-rose-700 mt-1">Remaining Family Cost</p>
          </div>
        </div>

        {/* ── All Matched Scholarships Table ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-emerald-700" />
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              All Matched Scholarships — Financial Breakdown
            </h2>
            <span className="ml-auto text-[10px] text-slate-400 font-medium">
              {displayMatches.length} scholarship{displayMatches.length !== 1 ? "s" : ""} found
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Scholarship Name</th>
                  <th className="p-3">Country</th>
                  <th className="p-3">Total Annual Cost</th>
                  <th className="p-3">Covered by Award</th>
                  <th className="p-3 text-right">Family Gap</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {displayMatches.length > 0 ? (
                  displayMatches.map((m, i) => {
                    const tuition   = m.financials?.tuitionPkr      || 450_000;
                    const living    = m.financials?.livingPkr       || 250_000;
                    const total     = tuition + living;
                    const covered   = m.financials?.coveredAmountPkr || 0;
                    const gap       = Math.max(0, total - covered);
                    const isEligible = m.status === "eligible";

                    return (
                      <tr key={m.id || i} className={i === 0 ? "bg-emerald-50/40" : ""}>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 leading-snug">{m.name}</div>
                          {i === 0 && (
                            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">
                              ★ Best Match
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">{m.country || "Pakistan"}</td>
                        <td className="p-3 text-slate-700">{pkr(total)}</td>
                        <td className="p-3 text-emerald-800 font-semibold">{pkr(covered)}</td>
                        <td className="p-3 text-right font-bold text-rose-700">{pkr(gap)}</td>
                        <td className="p-3 text-right">
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

              {/* Aggregate totals footer row */}
              {displayMatches.length > 1 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 text-[11px] font-bold text-slate-700">
                  <tr>
                    <td className="p-3" colSpan={2}>
                      TOTAL ACROSS {displayMatches.length} SCHOLARSHIPS
                    </td>
                    <td className="p-3">
                      {pkr(
                        displayMatches.reduce(
                          (acc, m) =>
                            acc +
                            (m.financials?.tuitionPkr || 450_000) +
                            (m.financials?.livingPkr || 250_000),
                          0
                        )
                      )}
                    </td>
                    <td className="p-3 text-emerald-800">
                      {pkr(
                        displayMatches.reduce(
                          (acc, m) => acc + (m.financials?.coveredAmountPkr || 0),
                          0
                        )
                      )}
                    </td>
                    <td className="p-3 text-right text-rose-700">
                      {pkr(
                        displayMatches.reduce((acc, m) => {
                          const total =
                            (m.financials?.tuitionPkr || 450_000) +
                            (m.financials?.livingPkr || 250_000);
                          return acc + Math.max(0, total - (m.financials?.coveredAmountPkr || 0));
                        }, 0)
                      )}
                    </td>
                    <td className="p-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Award size={16} className="text-emerald-700" />
            <span>Calculated transparently by NextStep AI • Independent Scholarship Engine</span>
          </div>
          <span>Report Generated September 2026</span>
        </div>

      </div>
    </div>
  );
}
