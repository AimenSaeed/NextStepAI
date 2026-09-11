import React, { useState, useEffect } from "react";
import { Check, ChevronRight, Loader2, Calculator, Save, Sparkles, GraduationCap, Globe, Banknote, MapPin } from "lucide-react";
import Header from "../components/Header";
import { DEGREE_LEVELS, INCOME_BRACKETS, PROVINCES, COUNTRIES } from "../constants";

const STEPS = [
  { title: "Academic background", subtitle: "Your CGPA and the degree level you are applying for", icon: GraduationCap },
  { title: "Field & career goals", subtitle: "Your discipline and target ambitions", icon: Sparkles },
  { title: "Budget & test status", subtitle: "Financial capability, English proficiency and target countries", icon: Banknote },
  { title: "Domicile & income", subtitle: "Province residency and household income bracket", icon: MapPin },
];

const STORAGE_KEY = "nextstep_intake_draft_v1";
const EMPTY_PROFILE = {
  gpa_or_percentage: "",
  field: "",
  degree_level: DEGREE_LEVELS[1],
  budget_pkr: "",
  target_countries: [],
  career_goals: "",
  english_test_status: "",
  domicile_province: PROVINCES[1],
  income_bracket: INCOME_BRACKETS[1],
};

export default function IntakeScreen({ onSubmit, submitting, error }) {
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [form, setForm] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : EMPTY_PROFILE; }
    catch { return EMPTY_PROFILE; }
  });
  const [showConverter, setShowConverter] = useState(false);
  const [draftRestored, setDraftRestored] = useState(() => !!localStorage.getItem(STORAGE_KEY));
  const [converterMode, setConverterMode] = useState("percentage");
  const [inputValue, setInputValue] = useState("");
  const [convertedGpa, setConvertedGpa] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); } catch {}
  }, [form]);

  const last = step === STEPS.length - 1;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const goToStep = (i) => { setStep(i); setAnimKey((k) => k + 1); };

  const toggleCountry = (c) => {
    setForm((f) => {
      const has = f.target_countries.includes(c);
      return { ...f, target_countries: has ? f.target_countries.filter((x) => x !== c) : [...f.target_countries, c] };
    });
  };

  const calculateConversion = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return;
    let r = 0;
    if (converterMode === "percentage") {
      if (val >= 85) r = 4.0; else if (val >= 80) r = 3.7; else if (val >= 75) r = 3.3;
      else if (val >= 70) r = 3.0; else if (val >= 65) r = 2.7; else if (val >= 60) r = 2.3;
      else r = Math.max(1.0, (val / 100) * 4.0);
    } else { r = Math.min(4.0, (val / 5.0) * 4.0); }
    setConvertedGpa(r.toFixed(2));
  };

  const applyConvertedGpa = () => {
    if (convertedGpa) { setForm((f) => ({ ...f, gpa_or_percentage: convertedGpa })); setShowConverter(false); }
  };

  const handleFinish = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    onSubmit({ ...form, gpa_or_percentage: parseFloat(form.gpa_or_percentage) || 0, budget_pkr: form.budget_pkr ? parseFloat(form.budget_pkr) : null });
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Header subtitle="Tell us about your academic background and goals to generate your matches" />

      {draftRestored && (
        <div className="mb-5 bg-slate-800/90 text-white text-xs px-4 py-2.5 rounded-xl flex items-center justify-between border border-slate-700 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <Save size={13} className="text-emerald-400" />
            <span>Draft restored from your last session.</span>
          </div>
          <button onClick={() => { setForm(EMPTY_PROFILE); localStorage.removeItem(STORAGE_KEY); setDraftRestored(false); }} className="text-[11px] text-slate-300 hover:text-white underline transition-colors">
            Clear Draft
          </button>
        </div>
      )}

      {/* Progress card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm mb-6 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-700 rounded-t-2xl" />
        <div className="flex items-center justify-between mb-4 mt-1">
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">Step {step + 1} of {STEPS.length}</span>
          <span className="text-xs font-medium text-slate-500">{Math.round(((step + 1) / STEPS.length) * 100)}% completed</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-5">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <button key={s.title} onClick={() => goToStep(i)} className={`text-left p-2.5 rounded-xl transition-all duration-200 ${active ? "bg-slate-900 text-white shadow-md scale-[1.02]" : done ? "bg-emerald-50 text-slate-700 hover:bg-emerald-100 border border-emerald-200/60" : "text-slate-400 hover:bg-slate-50 border border-transparent"}`}>
                <div className="flex items-center gap-1.5 text-xs font-semibold truncate">
                  {done ? <Check size={12} className="text-emerald-500 shrink-0" /> : <Icon size={12} className={`shrink-0 ${active ? "text-emerald-400" : "text-slate-400"}`} />}
                  <span className="truncate">{s.title.split(" ")[0]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step body */}
      <div key={animKey} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm mb-5 animate-slideIn">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center shrink-0">
            <StepIcon size={20} className="text-emerald-700" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900">{STEPS[step].title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{STEPS[step].subtitle}</p>
          </div>
        </div>

        <div className="space-y-5">
          {step === 0 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Current CGPA (out of 4.0)</label>
                  <button type="button" onClick={() => setShowConverter(!showConverter)} className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200/60 transition-all">
                    <Calculator size={12} /> Grade Converter
                  </button>
                </div>
                <input type="number" step="0.01" min="0" max="4.0" value={form.gpa_or_percentage} onChange={set("gpa_or_percentage")} placeholder="e.g. 3.45" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50/60 hover:border-slate-300" />
              </div>

              {showConverter && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-xl border border-slate-700 animate-fadeIn">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2.5">
                    <div className="flex items-center gap-2"><Sparkles size={15} className="text-emerald-400" /><span className="text-sm font-semibold">Grade Scale Converter</span></div>
                    <button onClick={() => setShowConverter(false)} className="text-slate-400 hover:text-white transition-colors text-xs">✕</button>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setConverterMode("percentage")} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${converterMode === "percentage" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"}`}>Percentage (%)</button>
                    <button type="button" onClick={() => setConverterMode("fiveScale")} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${converterMode === "fiveScale" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"}`}>5.0 Scale</button>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input type="number" placeholder={converterMode === "percentage" ? "e.g. 82" : "e.g. 4.2"} value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-600 transition-all" />
                    <button type="button" onClick={calculateConversion} className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs px-4 py-2 rounded-lg font-semibold transition-all">Convert</button>
                  </div>
                  {convertedGpa !== null && (
                    <div className="bg-slate-950/80 rounded-xl p-3 flex items-center justify-between border border-slate-700 animate-fadeIn">
                      <div>
                        <p className="text-[11px] text-slate-400">Equivalent 4.0 CGPA:</p>
                        <p className="text-xl font-bold text-emerald-400">{convertedGpa} <span className="text-sm text-slate-400">/ 4.0</span></p>
                      </div>
                      <button type="button" onClick={applyConvertedGpa} className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs px-4 py-2 rounded-lg font-bold transition-all">Apply →</button>
                    </div>
                  )}
                </div>
              )}

              {/* DEGREE LEVEL — fixed label */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-0.5">Intended degree level</label>
                <p className="text-[11px] text-slate-400 mb-2.5">Select the degree <span className="font-semibold text-slate-500">you are applying for</span> — not your completed or in-progress level.</p>
                <div className="flex flex-wrap gap-2">
                  {DEGREE_LEVELS.map((d) => (
                    <button key={d} type="button" onClick={() => setForm((f) => ({ ...f, degree_level: d }))} className={`text-xs px-4 py-2 rounded-xl border font-semibold transition-all duration-150 ${form.degree_level === d ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-white"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Field of study</label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {["Computer Science", "Engineering", "Business Administration", "Medicine & Healthcare", "Natural Sciences", "Social Sciences", "All Disciplines"].map((f) => (
                    <button key={f} type="button" onClick={() => setForm((prev) => ({ ...prev, field: f }))} className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all duration-150 font-medium ${form.field === f ? "bg-emerald-800 text-white border-emerald-800 shadow-sm scale-105" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"}`}>{f}</button>
                  ))}
                </div>
                <input value={form.field} onChange={set("field")} placeholder="e.g. Computer Science or click a preset above" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50/60 hover:border-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Career goals</label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {["Software Engineer", "Data Scientist", "Civil Service / CSS", "Healthcare Specialist", "Finance & Banking", "Academic Researcher"].map((c) => (
                    <button key={c} type="button" onClick={() => setForm((prev) => ({ ...prev, career_goals: c }))} className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all duration-150 font-medium ${form.career_goals === c ? "bg-emerald-800 text-white border-emerald-800 shadow-sm scale-105" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"}`}>{c}</button>
                  ))}
                </div>
                <textarea rows={2} value={form.career_goals} onChange={set("career_goals")} placeholder="What industry or professional role are you aiming for?" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50/60 hover:border-slate-300 resize-none" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Available budget (PKR per year)</label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[{ label: "PKR 0 – Need Full Aid", val: "0" }, { label: "PKR 500k", val: "500000" }, { label: "PKR 1.5M", val: "1500000" }, { label: "PKR 3.5M+", val: "3500000" }].map((b) => (
                    <button key={b.val} type="button" onClick={() => setForm((prev) => ({ ...prev, budget_pkr: b.val }))} className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all duration-150 font-medium ${form.budget_pkr === b.val ? "bg-emerald-800 text-white border-emerald-800 shadow-sm scale-105" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"}`}>{b.label}</button>
                  ))}
                </div>
                <input type="number" min="0" step="50000" value={form.budget_pkr} onChange={set("budget_pkr")} placeholder="Enter digits (e.g. 500000) or select above" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50/60 hover:border-slate-300" />
              </div>
              <SelectField label="English test status" value={form.english_test_status} onChange={set("english_test_status")} options={["", "IELTS", "TOEFL", "Duolingo"]} optionLabels={{ "": "Not yet taken / Planning to take" }} />
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Target countries</label>
                <p className="text-[11px] text-slate-400 mb-3">Select all countries you would like to study in. Include <strong className="text-slate-500">Pakistan</strong> to see local scholarships.</p>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map((c) => {
                    const active = form.target_countries.includes(c);
                    return (
                      <button key={c} type="button" onClick={() => toggleCountry(c)} className={`text-xs px-3.5 py-2 rounded-xl border font-semibold transition-all duration-150 ${active ? "bg-emerald-800 text-white border-emerald-800 shadow-md scale-105" : "border-slate-200 text-slate-600 bg-white hover:border-slate-400 hover:bg-slate-50"}`}>
                        {active && "✓ "}{c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <SelectField label="Province / Domicile" value={form.domicile_province} onChange={set("domicile_province")} options={PROVINCES} />
              <SelectField label="Household Income Bracket" value={form.income_bracket} onChange={set("income_bracket")} options={INCOME_BRACKETS} />
            </>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-rose-700 font-medium mb-4 bg-rose-50 border border-rose-200 p-3 rounded-xl animate-fadeIn">{error}</p>}

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => goToStep(Math.max(0, step - 1))} className={`text-xs font-semibold px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all ${step === 0 ? "invisible" : ""}`}>← Back</button>
        <button
          disabled={submitting || (step === 0 && (!form.gpa_or_percentage || parseFloat(form.gpa_or_percentage) <= 0)) || (step === 1 && !form.field.trim())}
          onClick={() => (last ? handleFinish() : goToStep(step + 1))}
          className="text-xs font-bold px-7 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          {last ? (submitting ? <><Loader2 size={14} className="animate-spin" /> Finding Matches...</> : "See your matches →") : <>Next Step <ChevronRight size={14} /></>}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px);  } to { opacity:1; transform:translateY(0);  } }
        @keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        .animate-fadeIn  { animation: fadeIn  0.22s ease-out both; }
        .animate-slideIn { animation: slideIn 0.22s ease-out both; }
      `}</style>
    </div>
  );
}

function SelectField({ label, value, onChange, options, optionLabels = {} }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">{label}</label>
      <select value={value} onChange={onChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 bg-slate-50/60 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-slate-300 transition-all">
        {options.map((o) => <option key={o} value={o}>{optionLabels[o] || o}</option>)}
      </select>
    </div>
  );
}
