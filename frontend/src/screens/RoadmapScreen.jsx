import React, { useState } from "react";
import { Calendar, FileText, CheckSquare, Square, AlertCircle, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import Header from "../components/Header";
import NavTabs from "../components/NavTabs";

export default function RoadmapScreen({ screen, setScreen, matches, analysis }) {
  // Track checked document items state locally
  const [checkedDocs, setCheckedDocs] = useState({});

  const toggleDoc = (oppId, docId) => {
    setCheckedDocs((prev) => {
      const key = `${oppId}_${docId}`;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const eligibleMatches = matches.filter((m) => m.status === "eligible" || m.status === "partial").slice(0, 6);
  const topMatch = eligibleMatches[0];
  const roadmapSteps = analysis?.application_roadmap || [];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Header subtitle="Application roadmap, upcoming deadlines, and document checklists" />
      <NavTabs screen={screen} setScreen={setScreen} />

      {/* Dynamic Deadline Urgency Alert Panel */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 text-white rounded-xl p-4 shadow-md border border-amber-700/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
            <Clock className="text-amber-300" size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">Upcoming Intake Windows</h3>
            <p className="text-sm text-amber-100 font-medium mt-0.5">
              Priority target: <strong>{topMatch ? topMatch.name : "Active Scholarships"}</strong> ({topMatch?.deadlineRaw || "Check portal schedules"}).
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-amber-500/30 px-3 py-1 rounded-full border border-amber-400/40 shrink-0">
          Target Deadlines
        </span>
      </div>

      {/* RAG Generated Strategic Roadmap Section */}
      {roadmapSteps.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-md border border-slate-700 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">AI Strategic Roadmap Actions</span>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">RAG Evidence Guided</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {roadmapSteps.map((step, sIdx) => (
              <div key={sIdx} className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {step.priority || sIdx + 1}
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-emerald-300">{step.scholarship}</p>
                  <p className="text-slate-200 mt-0.5 leading-relaxed">{step.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm mb-4">No matches found yet — please complete the intake form first.</p>
          <button
            onClick={() => setScreen("intake")}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2 rounded-lg transition-all"
          >
            Go to Intake Form
          </button>
        </div>
      )}

      {/* Timeline View */}
      <div className="space-y-6">
        {eligibleMatches.map((m, idx) => {
          const checklist = m.checklist || [];
          const completedCount = checklist.filter((item) => checkedDocs[`${m.id}_${item.id}`]).length;
          const progressPct = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;

          return (
            <div key={m.id} className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden">
              {/* Top Accent Line */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${m.status === "eligible" ? "bg-emerald-600" : "bg-amber-500"}`} />

              <div className="flex items-start justify-between gap-4 pt-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                      Target #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                      m.status === "eligible" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">{m.name}</h3>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shrink-0">
                  <Calendar size={14} className="text-emerald-700" />
                  <span>{m.deadlineRaw}</span>
                </div>
              </div>

              {m.roadmapAction && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg p-2.5 text-xs flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-700 shrink-0" />
                  <span><strong>Roadmap Recommendation:</strong> {m.roadmapAction}</span>
                </div>
              )}

              {/* Progress Bar for Checklist */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    <FileText size={13} className="text-slate-500" /> Document Preparation Progress
                  </span>
                  <span className="font-bold text-slate-900">{completedCount} of {checklist.length} completed ({progressPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Interactive Checklist Items */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Required Document Checklist:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {checklist.map((item) => {
                    const isChecked = !!checkedDocs[`${m.id}_${item.id}`];
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleDoc(m.id, item.id)}
                        className={`text-left p-2 rounded-md border text-xs flex items-center gap-2.5 transition-all ${
                          isChecked
                            ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-medium"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare size={16} className="text-emerald-700 shrink-0" />
                        ) : (
                          <Square size={16} className="text-slate-400 shrink-0" />
                        )}
                        <span className={`truncate ${isChecked ? "line-through opacity-80" : ""}`}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

