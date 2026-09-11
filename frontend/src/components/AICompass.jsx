import React, { useRef, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const NODES = [
  { id: 1, title: "Scholarships", subtitle: "Worldwide", angle: -60,  r: 175, icon: "🎓" },
  { id: 2, title: "Your",         subtitle: "Profile",   angle: -10,  r: 195, icon: "🎓" },
  { id: 3, title: "Best",         subtitle: "Opportunities", angle: 50,   r: 185, icon: "✦"  },
  { id: 4, title: "Dream",        subtitle: "Destination",   angle: 115,  r: 195, icon: "🌎" },
  { id: 5, title: "Parent",       subtitle: "Support",       angle: 165,  r: 175, icon: "🤝" },
];

const PARTICLES = [
  { r: 108, dur: 12, delay: 0,   emoji: "🎓" },
  { r: 125, dur: 18, delay: 3,   emoji: ""   },
  { r: 140, dur: 22, delay: 6,   emoji: "✦"  },
  { r: 115, dur: 15, delay: 9,   emoji: ""   },
  { r: 130, dur: 20, delay: 2,   emoji: "🌎" },
  { r: 118, dur: 25, delay: 11,  emoji: ""   },
];

function polarToXY(angleDeg, r, cx = 200, cy = 200) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function AICompass({ isMatching = false, matchCount = null }) {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  // Mouse parallax
  useEffect(() => {
    if (prefersReduced) return;
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      setParallax({ x: dx * 8, y: dy * 8 });
    };
    const onLeave = () => setParallax({ x: 0, y: 0 });
    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { window.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [prefersReduced]);

  const ringSpeed = hovered ? 0.6 : isMatching ? 2 : 1;
  const glowSize = hovered || isMatching ? "60px" : "40px";

  return (
    <motion.div
      ref={containerRef}
      className="relative flex items-center justify-center select-none"
      style={{ width: 440, height: 440, maxWidth: "100%" }}
      animate={prefersReduced ? {} : { x: parallax.x, y: parallax.y }}
      transition={{ type: "spring", stiffness: 60, damping: 20 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle at center, rgba(0,168,120,0.18) 0%, rgba(0,212,176,0.10) 40%, transparent 70%)`,
          filter: `blur(${glowSize})`,
          transform: "scale(1.2)",
        }}
      />

      <svg
        viewBox="0 0 400 400"
        className="w-full h-full overflow-visible"
        aria-label="AI Compass showing scholarship opportunities"
        role="img"
      >
        <defs>
          {/* Globe gradient */}
          <radialGradient id="globeGrad" cx="42%" cy="38%" r="60%">
            <stop offset="0%"   stopColor="#1a6e8a" />
            <stop offset="50%"  stopColor="#063B46" />
            <stop offset="100%" stopColor="#071A3D" />
          </radialGradient>
          {/* Gold needle gradient */}
          <linearGradient id="needleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#F5B942" />
            <stop offset="100%" stopColor="#c48a1a" />
          </linearGradient>
          {/* Ring gradient */}
          <linearGradient id="ringGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#00A878" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00D4B0" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="ringGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#4F7CFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#00D4B0" stopOpacity="0.2" />
          </linearGradient>
          {/* Node drop shadow for clean crisp contrast */}
          <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.45" />
          </filter>
          <filter id="compassglow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Connection lines to nodes ── */}
        {!prefersReduced && NODES.map((n) => {
          const np = polarToXY(n.angle, n.r);
          const cp = polarToXY(n.angle, 98);
          return (
            <line
              key={n.id}
              x1={cp.x} y1={cp.y}
              x2={np.x} y2={np.y}
              stroke="url(#ringGrad1)"
              strokeWidth="1.5"
              strokeDasharray="5 3"
              opacity={hovered || isMatching ? 0.85 : 0.45}
              className="transition-opacity duration-500"
            />
          );
        })}

        {/* ── Outer decorative ring (slow CW) ── */}
        {!prefersReduced ? (
          <g style={{ transformOrigin: "200px 200px", animation: `ring-cw ${40 / ringSpeed}s linear infinite` }}>
            <circle cx="200" cy="200" r="172" fill="none" stroke="url(#ringGrad1)" strokeWidth="1.5" strokeDasharray="12 8" />
            {/* Cardinal markers */}
            {[0, 90, 180, 270].map(deg => {
              const p = polarToXY(deg, 172);
              return <circle key={deg} cx={p.x} cy={p.y} r="3" fill="#00A878" opacity="0.8" />;
            })}
          </g>
        ) : (
          <circle cx="200" cy="200" r="172" fill="none" stroke="url(#ringGrad1)" strokeWidth="1.5" strokeDasharray="12 8" />
        )}

        {/* ── Middle ring (slow CCW) ── */}
        {!prefersReduced ? (
          <g style={{ transformOrigin: "200px 200px", animation: `ring-ccw ${55 / ringSpeed}s linear infinite` }}>
            <circle cx="200" cy="200" r="148" fill="none" stroke="url(#ringGrad2)" strokeWidth="1" strokeDasharray="4 10" />
          </g>
        ) : (
          <circle cx="200" cy="200" r="148" fill="none" stroke="url(#ringGrad2)" strokeWidth="1" />
        )}

        {/* ── Globe body ── */}
        <circle cx="200" cy="200" r="100" fill="url(#globeGrad)" />

        {/* Globe latitude lines */}
        {!prefersReduced && [-40, -20, 0, 20, 40].map((lat, i) => (
          <ellipse
            key={i}
            cx="200" cy={200 + lat}
            rx="100" ry={Math.abs(Math.cos((lat * Math.PI) / 90)) * 30 + 5}
            fill="none"
            stroke="rgba(0,212,176,0.25)"
            strokeWidth="1"
            className="animate-globe"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
        ))}

        {/* Globe vertical lines */}
        {!prefersReduced && [-2, -1, 0, 1, 2].map((i) => (
          <ellipse
            key={i}
            cx="200" cy="200"
            rx={Math.abs(i) * 22 + 8}
            ry="100"
            fill="none"
            stroke="rgba(0,212,176,0.15)"
            strokeWidth="0.8"
            className="animate-globe"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}

        {/* Globe highlight */}
        <ellipse cx="180" cy="172" rx="28" ry="18" fill="rgba(255,255,255,0.07)" />

        {/* Globe rim */}
        <circle cx="200" cy="200" r="100" fill="none" stroke="rgba(0,212,176,0.5)" strokeWidth="1.5" />

        {/* ── AI Pulse rings ── */}
        {!prefersReduced && [0, 1.5].map((delay) => (
          <circle
            key={delay}
            cx="200" cy="200" r="105"
            fill="none"
            stroke="rgba(0,168,120,0.5)"
            strokeWidth="2"
            className="animate-pulse-ai"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}

        {/* ── Inner compass ring ── */}
        <circle cx="200" cy="200" r="106" fill="none" stroke="rgba(0,168,120,0.35)" strokeWidth="1" />
        <circle cx="200" cy="200" r="114" fill="none" stroke="rgba(79,124,255,0.2)" strokeWidth="1" />

        {/* ── Cardinal letters ── */}
        {[
          { l: "N", angle: 0 },
          { l: "E", angle: 90 },
          { l: "S", angle: 180 },
          { l: "W", angle: 270 },
        ].map(({ l, angle }) => {
          const p = polarToXY(angle, 130);
          return (
            <text key={l} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
              fill="#00D4B0" fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif" opacity="0.9">
              {l}
            </text>
          );
        })}

        {/* ── Compass Needle ── */}
        <g
          style={{
            transformOrigin: "200px 200px",
            animation: prefersReduced ? "none" : `needle-search ${9 / ringSpeed}s ease-in-out infinite`,
          }}
        >
          {/* North needle (gold) */}
          <polygon points="200,140 196,200 204,200" fill="url(#needleGrad)" filter="url(#compassglow)" />
          {/* South needle (muted) */}
          <polygon points="200,260 196,200 204,200" fill="rgba(100,120,160,0.6)" />
          {/* Center hub */}
          <circle cx="200" cy="200" r="6" fill="#F5B942" className="animate-glow" />
          <circle cx="200" cy="200" r="3" fill="#071A3D" />
        </g>

        {/* ── Orbiting particles ── */}
        {!prefersReduced && PARTICLES.map((p, i) => (
          <g
            key={i}
            style={{
              transformOrigin: "200px 200px",
              animation: `ring-${i % 2 === 0 ? "cw" : "ccw"} ${p.dur}s linear infinite`,
              animationDelay: `${p.delay}s`,
            }}
          >
            <circle cx={200 + p.r} cy="200" r={p.emoji ? 9 : 3.5}
              fill={p.emoji ? "rgba(4,42,50,0.85)" : "rgba(0,212,176,0.8)"}
              stroke={p.emoji ? "rgba(0,212,176,0.6)" : "none"}
              strokeWidth="1"
            />
            {p.emoji && (
              <text x={200 + p.r} y={p.y || 200} textAnchor="middle" dominantBaseline="middle" fontSize="10">{p.emoji}</text>
            )}
          </g>
        ))}

        {/* ── High-Contrast Scholarship nodes ── */}
        {NODES.map((n, i) => {
          const pos = polarToXY(n.angle, n.r);
          const active = isMatching;
          // Card dimensions
          const boxW = 82;
          const boxH = 46;
          const boxX = pos.x - boxW / 2;
          const boxY = pos.y - boxH / 2;

          return (
            <motion.g
              key={n.id}
              initial={prefersReduced ? {} : { opacity: 0, scale: 0 }}
              whileInView={prefersReduced ? {} : { opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.4, ease: "backOut" }}
              filter="url(#nodeShadow)"
              className="cursor-default"
            >
              {/* Subtle dark teal background pill for high contrast against light/glow backgrounds */}
              <rect
                x={boxX}
                y={boxY}
                width={boxW}
                height={boxH}
                rx="10"
                ry="10"
                fill="rgba(4, 42, 50, 0.90)"
                stroke={active ? "#00D4B0" : "rgba(0, 212, 176, 0.45)"}
                strokeWidth="1.5"
              />

              {/* Icon */}
              <text
                x={pos.x}
                y={pos.y - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }}
              >
                {n.icon}
              </text>

              {/* Primary Label (Bold White) */}
              <text
                x={pos.x}
                y={pos.y + 7}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontWeight="700"
                fill="#FFFFFF"
                fontFamily="Inter, system-ui, sans-serif"
                style={{
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
                  letterSpacing: "0.2px"
                }}
              >
                {n.title}
              </text>

              {/* Secondary Label (Bright Light Mint / Cream) */}
              <text
                x={pos.x}
                y={pos.y + 17}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8.5"
                fontWeight="600"
                fill="#D8F5EF"
                fontFamily="Inter, system-ui, sans-serif"
                style={{
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
                  letterSpacing: "0.2px"
                }}
              >
                {n.subtitle}
              </text>
            </motion.g>
          );
        })}

        {/* ── Match count overlay ── */}
        {matchCount !== null && (
          <g>
            <circle cx="200" cy="200" r="45" fill="rgba(0,168,120,0.95)" stroke="#00D4B0" strokeWidth="2" />
            <text x="200" y="194" textAnchor="middle" fontSize="22" fontWeight="700" fill="#FFFFFF" fontFamily="Inter">{matchCount}</text>
            <text x="200" y="210" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FFF8E8" fontFamily="Inter">MATCHES</text>
          </g>
        )}
      </svg>
    </motion.div>
  );
}
