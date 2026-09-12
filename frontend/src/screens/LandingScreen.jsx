import React from "react";
import { ArrowRight, Search, FileText, CheckCircle, Compass, ShieldCheck } from "lucide-react";
import { SAVINGS_TOTAL } from "../constants";

export default function LandingScreen({ onGetStarted }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 text-center">
      {/* Brand Emblem Hero */}
      <div className="mb-6 flex justify-center">
        <div className="bg-white p-3 rounded-full border border-slate-200 shadow-md">
          <img src="/logo.png" alt="NextStep AI Compass Emblem" className="h-24 md:h-28 w-auto object-contain" />
        </div>
      </div>

      <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
        Navigate Your Scholarship, <br className="hidden md:block"/> Skip the Consultant Fees.
      </h1>
      <p className="text-base md:text-lg text-slate-600 mb-8 max-w-2xl mx-auto font-normal">
        NextStep AI matches Pakistani students with fully-funded and partial scholarships worldwide based on your unique academic profile and financial need.
      </p>

      <button onClick={onGetStarted} className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm px-8 py-3.5 rounded-xl flex items-center gap-2.5 mx-auto transition-all shadow-md hover:shadow-lg">
        Calculate Your Matches <ArrowRight size={18} />
      </button>



      <div className="text-left mt-8 border-t border-slate-200 pt-12">
        <h2 className="font-serif text-2xl font-bold text-slate-900 text-center mb-10">How NextStep AI Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-xl">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-800 mb-4 font-bold">
              <Search size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">1. Profile Intake</h3>
            <p className="text-slate-600 text-xs leading-relaxed">Enter your GPA, target countries, budget, and major in our quick 4-step form with inline GPA converter.</p>
          </div>
          <div className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-xl">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-800 mb-4 font-bold">
              <CheckCircle size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">2. Match Engine</h3>
            <p className="text-slate-600 text-xs leading-relaxed">Our engine ranks scholarships into Plan A (Reach), Plan B (Realistic), and Plan C (Safety) with transparent score breakdowns.</p>
          </div>
          <div className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-xl">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-800 mb-4 font-bold">
              <FileText size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">3. Roadmap & Parent View</h3>
            <p className="text-slate-600 text-xs leading-relaxed">Interactive document checklists, deadline alerts, currency stress tests, and printable PKR summaries for parents.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

