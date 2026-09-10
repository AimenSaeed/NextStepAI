import React from "react";

export default function SkeletonLoader({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-full border border-slate-200 rounded-sm px-4 py-3 flex items-center gap-4 bg-white">
          <div className="shrink-0 w-14 h-14 rounded-full bg-slate-200 animate-pulse"></div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="shrink-0 w-12 space-y-2 flex flex-col items-end">
            <div className="h-6 bg-slate-200 rounded w-full animate-pulse"></div>
            <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
