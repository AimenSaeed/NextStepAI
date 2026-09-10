import React from "react";

export default function Footer() {
  return (
    <footer className="print:hidden bg-slate-50 border-t border-slate-200 py-8 text-center mt-auto">
      <p className="font-serif text-slate-800 font-medium mb-2">NextStep AI</p>

      <p className="text-xs text-slate-500 mb-4">Helping Pakistani students find their path.</p>
      <div className="flex justify-center gap-4 text-xs text-slate-400">
        <button className="hover:text-slate-600">About</button>
        <button className="hover:text-slate-600">Contact</button>
        <button className="hover:text-slate-600">Terms</button>
      </div>
    </footer>
  );
}
