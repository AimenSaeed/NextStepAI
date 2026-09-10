import React, { useState, useEffect } from "react";
import { Check, ChevronRight, Loader2, Calculator, Save, Sparkles } from "lucide-react";
import Header from "../components/Header";
import { DEGREE_LEVELS, INCOME_BRACKETS, PROVINCES, COUNTRIES } from "../constants";

const STEPS = [
  { title: "Academic background", subtitle: "Your GPA, percentage, and current degree" },
  { title: "Field & career goals", subtitle: "Your discipline and target ambitions" },
  { title: "Budget & test status", subtitle: "Financial capability and English proficiency" },
  { title: "Domicile & income", subtitle: "Province residency and household income bracket" },
];

const STORAGE_KEY = "nextstep_intake_draft_v1";

const EMPTY_PROFILE = {
  gpa_or_percentage: "",
  field: "",
  degree_level: DEGREE_LEVELS[1], // "Undergraduate"
  budget_pkr: "",
  target_countries: [],
  career_goals: "",
  english_test_status: "",
  domicile_province: PROVINCES[1], // "Sindh"
  income_bracket: INCOME_BRACKETS[1], // "Middle"
};

export default function IntakeScreen({ onSubmit, submitting, error }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : EMPTY_PROFILE;
    } catch {
      return EMPTY_PROFILE;
    }
  });
  const [showConverter, setShowConverter] = useState(false);
  const [draftRestored, setDraftRestored] = useState(() => !!localStorage.getItem(STORAGE_KEY));

  const [converterMode, setConverterMode] = useState("percentage"); // "percentage" | "fiveScale"
  const [inputValue, setInputValue] = useState("");
  const [convertedGpa, setConvertedGpa] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch (e) {
      console.error("Autosave error:", e);
    }
  }, [form]);

  const last = step === STEPS.length - 1;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleCountry = (c) => {
    setForm((f) => {
      const has = f.target_countries.includes(c);
      return { ...f, target_countries: has ? f.target_countries.filter((x) => x !== c) : [...f.target_countries, c] };
    });
  };

  const calculateConversion = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return;
    let result = 0;
    if (converterMode === "percentage") {
      if (val >= 85) result = 4.0;
      else if (val >= 80) result = 3.7;
      else if (val >= 75) result = 3.3;
      else if (val >= 70) result = 3.0;
      else if (val >= 65) result = 2.7;
      else if (val >= 60) result = 2.3;
      else result = Math.max(1.0, (val / 100) * 4.0);
    } else {
      result = Math.min(4.0, (val / 5.0) * 4.0);
    }
    const finalGpa = result.toFixed(2);
    setConvertedGpa(finalGpa);
  };

  const applyConvertedGpa = () => {
    if (convertedGpa) {
      setForm((f) => ({ ...f, gpa_or_percentage: convertedGpa }));
      setShowConverter(false);
    }
  };

  const handleFinish = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    onSubmit({
      ...form,
      gpa_or_percentage: parseFloat(form.gpa_or_percentage) || 0,
      budget_pkr: form.budget_pkr ? parseFloat(form.budget_pkr) : null,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Header subtitle="Tell us about your academic background and goals to generate your matches" />

      {draftRestored && (
        <div className="mb-6 bg-slate-800/90 text-white text-xs px-3.5 py-2 rounded-lg flex items-center justify-between border border-slate-700 shadow-sm">
          <div className="flex items-center gap-2">
            <Save size={13} className="text-emerald-400" />
            <span>Draft restored from your last session.</span>
          </div>
          <button
            onClick={() => {
              setForm(EMPTY_PROFILE);
              localStorage.removeItem(STORAGE_KEY);
              setDraftRestored(false);
            }}
            className="text-[11px] text-slate-300 hover:text-white underline"
          >
            Clear Draft
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-xs font-medium text-slate-500">{Math.round(((step + 1) / STEPS.length) * 100)}% Completed</span>
        </div>

        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-5">
          <div
            className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setStep(i)}
              className={`text-left p-2 rounded-lg transition-all ${
                i === step ? "bg-slate-900 text-white shadow-sm" : i < step ? "bg-slate-50 text-slate-700 hover:bg-slate-100" : "text-slate-400"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-medium truncate">
                {i < step ? <Check size={12} className="text-emerald-400 shrink-0" /> : <span className="text-[10px] opacity-75">{i + 1}.</span>}
                <span className="truncate">{s.title.split(" ")[0]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm mb-6">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <h2 className="font-serif text-xl font-bold text-slate-900">{STEPS[step].title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{STEPS[step].subtitle}</p>
        </div>

        <div className="space-y-5">
          {step === 0 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Current CGPA (out of 4.0)</label>
                  <button
                    type="button"
                    onClick={() => setShowConverter(!showConverter)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 transition-colors"
                  >
                    <Calculator size={13} />
                    Grade Converter
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  value={form.gpa_or_percentage}
                  onChange={set("gpa_or_percentage")}
                  placeholder="e.g. 3.45"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50/50"
                />
              </div>

              {showConverter && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-lg border border-slate-700 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-400" />
                      <span className="text-sm font-semibold">Grade Scale Converter</span>
                    </div>
                    <button onClick={() => setShowConverter(false)} className="text-xs text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setConverterMode("percentage")} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${converterMode === "percentage" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 border border-slate-700"}`}>Percentage (%)</button>
                    <button type="button" onClick={() => setConverterMode("fiveScale")} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${converterMode === "fiveScale" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 border border-slate-700"}`}>5.0 Scale</button>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <input type="number" placeholder={converterMode === "percentage" ? "e.g. 82" : "e.g. 4.2"} value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500" />
                    <button type="button" onClick={calculateConversion} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-1.5 rounded-lg font-semibold transition-colors">Convert</button>
                  </div>

                  {convertedGpa !== null && (
                    <div className="bg-slate-950/80 rounded-lg p-3 flex items-center justify-between border border-slate-700">
                      <div>
                        <p className="text-[11px] text-slate-400">Equivalent 4.0 CGPA:</p>
                        <p className="text-lg font-bold text-emerald-400">{convertedGpa} / 4.0</p>
                      </div>
                      <button type="button" onClick={applyConvertedGpa} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs px-3 py-1.5 rounded font-bold transition-colors">Apply</button>
                    </div>
                  )}
                </div>
              )}

              <SelectField label="Current / Intended Degree level" value={form.degree_level} onChange={set("degree_level")} options={DEGREE_LEVELS} />
            </>
          )}

          {step === 1 && (
            <>
              <TextField label="Field of study" placeholder="e.g. Computer Science" value={form.field} onChange={set("field")} />
              <TextAreaField label="Career goals" placeholder="What do you want to work on after graduating?" value={form.career_goals} onChange={set("career_goals")} />
            </>
          )}

          {step === 2 && (
            <>
              <TextField label="Available budget (PKR per year)" placeholder="e.g. 1500000" value={form.budget_pkr} onChange={set("budget_pkr")} />
              <SelectField label="English test status" value={form.english_test_status} onChange={set("english_test_status")} options={["", "IELTS", "TOEFL", "Duolingo"]} optionLabels={{ "": "Not yet taken / Planning to take" }} />
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Target Countries</label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map((c) => {
                    const active = form.target_countries.includes(c);
                    return (
                      <button key={c} type="button" onClick={() => toggleCountry(c)} className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${active ? "bg-emerald-800 text-white border-emerald-800" : "border-slate-300 text-slate-600 bg-white"}`}>{c}</button>
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

      {error && <p className="text-xs text-rose-700 font-medium mb-4 bg-rose-50 border border-rose-200 p-3 rounded-lg">{error}</p>}

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className={`text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors ${step === 0 ? "invisible" : ""}`}>Back</button>
        <button disabled={submitting} onClick={() => (last ? handleFinish() : setStep((s) => s + 1))} className="text-xs font-bold px-6 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-md flex items-center gap-2 disabled:opacity-50">
          {last ? (submitting ? <><Loader2 size={14} className="animate-spin" /> Finding Matches...</> : "See your matches") : <>Next Step <ChevronRight size={14} /></>}
        </button>
      </div>
    </div>
  );
}

function TextField({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50/50" />
    </div>
  );
}

function TextAreaField({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">{label}</label>
      <textarea rows={2} value={value} onChange={onChange} placeholder={placeholder} className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50/50" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, optionLabels = {} }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">{label}</label>
      <select value={value} onChange={onChange} className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 bg-slate-50/50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
        {options.map((o) => <option key={o} value={o}>{optionLabels[o] || o}</option>)}
      </select>
    </div>
  );
}
