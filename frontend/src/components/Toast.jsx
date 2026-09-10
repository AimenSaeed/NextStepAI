import React, { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export default function Toast({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-5">
      <CheckCircle2 className="text-emerald-400" size={20} />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
