import React, { useEffect, useState } from "react";
import { UserCircle, LogOut, Menu, X, Bell, Compass } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const NAV_LINKS = [
  { id: "dashboard",  label: "Dashboard"   },
  { id: "intake",     label: "Match Score" },
  { id: "roadmap",    label: "Roadmap"     },
  { id: "parent",     label: "Parent View" },
];

export default function Navbar({ user, onLogout, onNavigate, currentScreen }) {
  const prefersReduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navBase = [
    "print:hidden sticky top-0 z-50",
    "transition-all duration-300",
    scrolled
      ? "py-2 shadow-lg border-b"
      : "py-3 border-b",
  ].join(" ");

  const navStyle = {
    background: scrolled
      ? "rgba(7,26,61,0.97)"
      : "rgba(7,26,61,0.88)",
    backdropFilter: "blur(14px)",
    borderColor: "rgba(0,212,176,0.15)",
  };

  const go = (id) => { onNavigate(id); setMenuOpen(false); };

  return (
    <>
      <nav className={navBase} style={navStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => go(user ? "dashboard" : "landing")}
            className="flex items-center gap-2 group shrink-0"
          >
            <div className="relative">
              <img
                src="/logo.png"
                alt="NextStep AI"
                className="h-8 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span
              className="font-display font-bold text-lg tracking-tight hidden sm:inline"
              style={{ color: "white" }}
            >
              NextStep <span style={{ color: "#00D4B0" }}>AI</span>
            </span>
          </button>

          {/* Center nav (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = currentScreen === link.id
                || (link.id === "dashboard" && ["dashboard","detail"].includes(currentScreen));
              return (
                <button
                  key={link.id}
                  onClick={() => go(link.id)}
                  className="relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg"
                  style={{ color: active ? "#00D4B0" : "rgba(255,255,255,0.72)" }}
                  onMouseEnter={e => { if(!active) e.currentTarget.style.color = "#00D4B0"; }}
                  onMouseLeave={e => { if(!active) e.currentTarget.style.color = "rgba(255,255,255,0.72)"; }}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full"
                      style={{ background: "#00A878", boxShadow: "0 0 8px #00A878" }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification bell */}
            <button
              className="hidden sm:flex p-2 rounded-lg transition-colors duration-200 hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.6)" }}
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <button
                  onClick={() => go("account")}
                  className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
                  style={{ color: currentScreen === "account" ? "#00D4B0" : "rgba(255,255,255,0.8)" }}
                >
                  <UserCircle size={18} />
                  <span className="hidden sm:inline">{user.name?.split(" ")[0]}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#fb7185"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => go("login")}
                  className="hidden sm:inline text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#00D4B0"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
                >
                  Login
                </button>
                <button
                  onClick={() => go("intake")}
                  className="text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 shadow-md"
                  style={{
                    background: "linear-gradient(135deg, #00A878, #00D4B0)",
                    color: "white",
                    boxShadow: "0 0 20px rgba(0,168,120,0.35)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 0 28px rgba(0,168,120,0.55)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 0 20px rgba(0,168,120,0.35)"; }}
                >
                  Get Started →
                </button>
              </>
            )}

            {/* Hamburger */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.75)" }}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={prefersReduced ? {} : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={prefersReduced ? {} : { opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden border-t"
              style={{ borderColor: "rgba(0,212,176,0.12)" }}
            >
              <div className="px-4 py-3 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => go(link.id)}
                    className="text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      color: currentScreen === link.id ? "#00D4B0" : "rgba(255,255,255,0.78)",
                      background: currentScreen === link.id ? "rgba(0,168,120,0.12)" : "transparent",
                    }}
                  >
                    {link.label}
                  </button>
                ))}
                <div className="border-t my-2" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
                <button onClick={() => go("login")} className="text-left px-3 py-2.5 text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Login</button>
                <button
                  onClick={() => go("intake")}
                  className="mt-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #00A878, #00D4B0)" }}
                >
                  Get Started →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
