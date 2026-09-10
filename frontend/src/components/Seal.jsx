import React from "react";
import { STATUS_STYLE } from "../constants";

export default function Seal({ status, size = "w-20 h-20 text-[11px]" }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.ineligible;
  return (
    <div className={`shrink-0 ${size} rounded-full border-2 border-double ${s.border} ${s.bg} flex items-center justify-center -rotate-6`}>
      <span className={`font-serif font-semibold text-center leading-tight px-1 ${s.text}`}>{s.label}</span>
    </div>
  );
}
