import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";
import AICompass from "./AICompass";

const STEPS = [
  { phase: "analyzing",   text: "✦ Analyzing Your Profile...",       duration: 600  },
  { phase: "finding",     text: "Finding Scholarships...",            duration: 600  },
  { phase: "calculating", text: "Calculating Compatibility...",       duration: 600  },
  { phase: "matching",    text: "Finding Your Best Matches...",       duration: 500  },
];

export default function MatchingOverlay({ loading, matchCount, error, onDone }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (error) return;
    let total = 0;
    const timers = STEPS.map((s, i) => {
      const t = setTimeout(() => setStepIdx(i), total);
      total += s.duration;
      return t;
    });
    return () => timers.forEach(clearTimeout);
  }, [error]);

  // When API finishes AND we've shown at least 3 steps, show success
  useEffect(() => {
    if (!loading && matchCount !== null && stepIdx >= 3 && !done && !error) {
      const t = setTimeout(() => {
        setDone(true);
        setTimeout(onDone, 900);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [loading, matchCount, stepIdx, done, error, onDone]);

  const currentText = error
    ? "Something went wrong. Please try again."
    : done
    ? `✓ ${matchCount} Match${matchCount !== 1 ? "es" : ""} Found`
    : STEPS[stepIdx]?.text || STEPS[0].text;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(7,26,61,0.92)", backdropFilter: "blur(12px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-8 px-6 text-center">
        {/* Compass */}
        <motion.div
          animate={done ? { scale: 1.05 } : {}}
          transition={{ duration: 0.4 }}
        >
          <AICompass
            isMatching={!done && !error}
            matchCount={done ? matchCount : null}
          />
        </motion.div>

        {/* Step text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentText}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3"
          >
            {done && !error && (
              <CheckCircle2 className="text-emerald-400" size={22} />
            )}
            {error && (
              <AlertCircle className="text-rose-400" size={22} />
            )}
            <p
              className="text-xl font-semibold"
              style={{ color: error ? "#fb7185" : done ? "#00A878" : "white" }}
            >
              {currentText}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        {!done && !error && (
          <div className="flex gap-2">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  background: i <= stepIdx ? "#00A878" : "rgba(255,255,255,0.2)",
                }}
                animate={{ scale: i === stepIdx ? 1.3 : 1 }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>
        )}

        {error && (
          <motion.button
            onClick={onDone}
            className="px-6 py-2 rounded-xl text-sm font-semibold text-white border border-rose-400/40 hover:bg-rose-900/30 transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Try Again
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
