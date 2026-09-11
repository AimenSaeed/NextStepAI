import React, { useState } from "react";
import { Calendar, FileText, CheckSquare, Square, AlertCircle, Clock, Sparkles, CheckCircle2, Compass, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Header from "../components/Header";
import NavTabs from "../components/NavTabs";

export default function RoadmapScreen({ screen, setScreen, matches, analysis }) {
  const prefersReduced = useReducedMotion();
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

  // Visual Journey Milestones
  const MILESTONES = [
    { title: "Profile Intake", status: matches.length > 0 ? "done" : "active" },
    { title: "AI Matching", status: matches.length > 0 ? "done" : "pending" },
    { title: "Scholarship Shortlist", status: eligibleMatches.length > 0 ? "done" : "pending" },
    { title: "Applications", status: "active" },
    { title: "Acceptance", status: "pending" },
    { title: "Visa Preparation", status: "pending" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Header subtitle="Application roadmap, upcoming deadlines, and document checklists" />
      <NavTabs screen={screen} setScreen={setScreen} />

      {/* Navigation Visual Journey Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="text-[#00A878]" size={20} />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Your Navigation Journey</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {MILESTONES.map((m, idx) => {
            const isDone = m.status === "done";
            const isActive = m.status === "active";
            return (
              <div key={idx} className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                    isDone
                      ? "bg-[#00A878] text-white shadow-sm"
                      : isActive
                      ? "bg-[#071A3D] text-white ring-2 ring-[#00D4B0]/40"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isDone ? "✓" : idx + 1}
                </div>
                <span className={`text-[11px] font-medium leading-tight ${isActive ? "text-[#071A3D] font-bold" : "text-slate-600"}`}>
                  {m.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Deadline Urgency Alert Panel */}
      <div className="rounded-2xl p-4 shadow-md border text-white flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #071A3D 0%, #063B46 100%)", borderColor: "rgba(0,212,176,0.2)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,212,176,0.15)" }}>
            <Clock className="text-[#00D4B0]" size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00D4B0]">Upcoming Intake Windows</h3>
            <p className="text-sm text-slate-100 font-medium mt-0.5">
              Priority target: <strong>{topMatch ? topMatch.name : "Active Scholarships"}</strong> ({topMatch?.deadlineRaw || "Check portal schedules"}).
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full border border-[#00D4B0]/30 text-[#00D4B0] bg-[#00D4B0]/10 shrink-0">
          Target Deadlines
        </span>
      </div>

      {/* RAG Generated Strategic Roadmap Section */}
      {roadmapSteps.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#00A878]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">AI Strategic Roadmap Actions</span>
            </div>
            <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              RAG Evidence Guided
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {roadmapSteps.map((step, sIdx) => (
              <div key={sIdx} className="flex items-start gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-[#00A878] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {step.priority || sIdx + 1}
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900">{step.scholarship}</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{step.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-slate-500 text-sm mb-4">No matches found yet — please complete the intake form first.</p>
          <button
            onClick={() => setScreen("intake")}
            className="text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all"
            style={{ background: "linear-gradient(135deg, #00A878, #00D4B0)" }}
          >
            Go to Intake Form
          </button>
        </div>
      )}

      {/* Timeline View */}
      <div className="space-y-4">
        {eligibleMatches.map((m, idx) => {
          const checklist = m.checklist || [];
          const completedCount = checklist.filter((item) => checkedDocs[`${m.id}_${item.id}`]).length;
          const progressPct = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;

          return (
            <motion.div
              key={m.id || idx}
              initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${m.status === "eligible" ? "bg-[#00A878]" : "bg-[#F5B942]"}`} />

              <div className="flex items-start justify-between gap-4 pt-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                      Target #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      m.status === "eligible" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{m.name}</h3>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shrink-0">
                  <Calendar size={14} className="text-[#00A878]" />
                  <span>{m.deadlineRaw}</span>
                </div>
              </div>

              {m.roadmapAction && (
                <div className="bg-emerald-50/70 border border-emerald-200/70 text-emerald-900 rounded-xl p-3 text-xs flex items-center gap-2">
                  <Sparkles size={14} className="text-[#00A878] shrink-0" />
                  <span><strong>AI Action:</strong> {m.roadmapAction}</span>
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
                    className="bg-[#00A878] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Interactive Checklist Items */}
              {checklist.length > 0 && (
                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Required Document Checklist:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {checklist.map((item) => {
                      const isChecked = !!checkedDocs[`${m.id}_${item.id}`];
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleDoc(m.id, item.id)}
                          className={`text-left p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                            isChecked
                              ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-medium"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare size={16} className="text-[#00A878] shrink-0" />
                          ) : (
                            <Square size={16} className="text-slate-400 shrink-0" />
                          )}
                          <span className={`truncate ${isChecked ? "line-through opacity-80" : ""}`}>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
