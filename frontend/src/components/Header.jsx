import React from "react";

export default function Header({ subtitle }) {
  return (
    <div className="mb-8 border-b border-slate-200 pb-4">
      <h1 className="font-serif text-2xl font-semibold text-slate-900">{subtitle}</h1>
    </div>
  );
}
