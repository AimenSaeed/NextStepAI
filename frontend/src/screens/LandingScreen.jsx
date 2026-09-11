import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Globe, Check,
         Search, Cpu, Umbrella, Map } from "lucide-react";
import AICompass from "../components/AICompass";

const FEATURE_CARDS = [
  {
    num: "01",
    icon: Search,
    title: "Profile Intake",
    desc: "Tell us about your academic background, goals and preferences.",
    color: "#00A878",
    bg: "rgba(0,168,120,0.08)",
    border: "rgba(0,168,120,0.25)",
  },
  {
    num: "02",
    icon: Cpu,
    title: "Match Engine",
    desc: "Our AI finds scholarships based on your profile — ranked into Plan A, B, and C.",
    color: "#4F7CFF",
    bg: "rgba(79,124,255,0.08)",
    border: "rgba(79,124,255,0.25)",
  },
  {
    num: "03",
    icon: Umbrella,
    title: "Plan C (Safety)",
    desc: "Backup options if your first choices don't work out — so you always have a path.",
    color: "#F5B942",
    bg: "rgba(245,185,66,0.08)",
    border: "rgba(245,185,66,0.25)",
  },
  {
    num: "04",
    icon: Map,
    title: "Roadmap & Parent View",
    desc: "Track deadlines, applications and your journey — with a parent-friendly summary.",
    color: "#00D4B0",
    bg: "rgba(0,212,176,0.08)",
    border: "rgba(0,212,176,0.25)",
  },
];

const TRUST = [
  { icon: Check,       label: "100% Free"             },
  { icon: ShieldCheck, label: "Your Data is Safe"      },
  { icon: Globe,       label: "Global Opportunities"   },
];

export default function LandingScreen({ onGetStarted }) {
  const prefersReduced = useReducedMotion();
  const [ctaHovered, setCtaHovered] = useState(false);

  const fadeUp = (delay = 0) =>
    prefersReduced
      ? {}
      : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay } };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(0,168,120,0.07) 0%, transparent 60%), #f8faf9",
      }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-4 md:pt-20 md:pb-8">
        <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-12">

          {/* Left — copy */}
          <div className="flex-1 text-center md:text-left">
            {/* Badge */}
            <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 mb-6">
              <span
                className="text-xs font-semibold px-4 py-1.5 rounded-full border tracking-wide"
                style={{
                  color: "#00A878",
                  borderColor: "rgba(0,168,120,0.3)",
                  background: "rgba(0,168,120,0.06)",
                }}
              >
                Your Future ✦ Our AI ✦ Global Opportunities
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1 {...fadeUp(0.08)} className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-slate-900 mb-6">
              Navigate Your{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #00A878, #00D4B0)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Scholarship,
              </span>
              <br />
              Skip the Consultant Fees.
            </motion.h1>

            {/* Description */}
            <motion.p {...fadeUp(0.16)} className="text-base sm:text-lg text-slate-600 mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
              NextStep AI matches Pakistani students with fully-funded and partial scholarships worldwide based on your unique academic profile and financial need.
            </motion.p>

            {/* CTA */}
            <motion.div {...fadeUp(0.22)} className="flex flex-col sm:flex-row items-center md:items-start gap-4 mb-8">
              <button
                onClick={onGetStarted}
                onMouseEnter={() => setCtaHovered(true)}
                onMouseLeave={() => setCtaHovered(false)}
                className="relative group flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-white text-base transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #00A878 0%, #00D4B0 100%)",
                  boxShadow: ctaHovered
                    ? "0 0 40px rgba(0,168,120,0.6), 0 8px 32px rgba(0,168,120,0.3)"
                    : "0 0 24px rgba(0,168,120,0.35), 0 4px 16px rgba(0,168,120,0.2)",
                  transform: ctaHovered ? "translateY(-2px)" : "translateY(0)",
                }}
              >
                <Sparkles size={18} className={`transition-transform duration-300 ${ctaHovered ? "scale-110" : ""}`} />
                Calculate Your Matches
                <ArrowRight
                  size={18}
                  style={{ transform: ctaHovered ? "translateX(5px)" : "translateX(0)", transition: "transform 0.25s" }}
                />
              </button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div {...fadeUp(0.3)} className="flex flex-wrap items-center justify-center md:justify-start gap-5">
              {TRUST.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                  <Icon size={15} style={{ color: "#00A878" }} />
                  {label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — compass */}
          <motion.div
            className="flex-shrink-0 w-full md:w-auto flex justify-center"
            {...(prefersReduced ? {} : {
              initial: { opacity: 0, x: 30 },
              whileInView: { opacity: 1, x: 0 },
              viewport: { once: true },
              transition: { duration: 0.6, delay: 0.1 },
            })}
          >
            <AICompass />
          </motion.div>
        </div>
      </section>

      {/* ── Feature Cards ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <motion.h2
          {...fadeUp(0)}
          className="font-display text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3"
        >
          How NextStep AI Works
        </motion.h2>
        <motion.p {...fadeUp(0.06)} className="text-slate-500 text-center mb-10 text-sm">
          Four steps from profile to your personalised scholarship roadmap.
        </motion.p>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {/* Connecting line (desktop only) */}
          <div
            className="absolute top-8 left-[12.5%] right-[12.5%] h-px hidden lg:block"
            style={{
              background: "linear-gradient(90deg, rgba(0,168,120,0.3), rgba(0,212,176,0.5), rgba(79,124,255,0.3), rgba(0,212,176,0.3))",
              backgroundSize: "200% auto",
              animation: prefersReduced ? "none" : "shimmer 4s linear infinite",
            }}
          />

          {FEATURE_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.num}
                className="group relative rounded-2xl p-6 border cursor-default transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  borderColor: card.border,
                  backdropFilter: "blur(8px)",
                }}
                {...(prefersReduced ? {} : {
                  initial: { opacity: 0, y: 28 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.45, delay: i * 0.1 },
                  whileHover: { y: -6, transition: { duration: 0.2 } },
                })}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 12px 40px ${card.color}22, 0 2px 8px rgba(0,0,0,0.08)`;
                  e.currentTarget.style.borderColor = card.color;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "";
                  e.currentTarget.style.borderColor = card.border;
                }}
              >
                {/* Step number */}
                <span className="text-xs font-bold tracking-widest mb-4 block" style={{ color: card.color }}>
                  {card.num}
                </span>

                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ background: card.bg }}
                >
                  <Icon size={20} style={{ color: card.color }} />
                </div>

                {/* Text */}
                <h3 className="font-semibold text-slate-900 text-base mb-2">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
