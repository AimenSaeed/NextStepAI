import React from "react";

const TABS = [
  { id: "dashboard", label: "Matches" },
  { id: "roadmap", label: "Roadmap & Checklist" },
  { id: "parent", label: "Parent View" },
];

export default function NavTabs({ screen, setScreen }) {
  return (
    <div className="flex gap-1 mb-6 border-b border-slate-200">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setScreen(t.id)}
          className={`px-4 py-2 text-xs font-semibold -mb-px border-b-2 transition-all ${
            screen === t.id ? "border-emerald-800 text-emerald-900 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

