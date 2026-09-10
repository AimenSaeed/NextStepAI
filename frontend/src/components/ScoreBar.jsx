import React from "react";

export default function ScoreBar({ label, value }) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span>{label}</span>
        <span className="font-medium text-slate-800">{pct}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-sm overflow-hidden">
        <div className="h-full bg-slate-800 rounded-sm" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
