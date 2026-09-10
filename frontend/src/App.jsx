import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import LandingScreen from "./screens/LandingScreen";
import LoginScreen from "./screens/LoginScreen";
import AccountScreen from "./screens/AccountScreen";
import IntakeScreen from "./screens/IntakeScreen";
import DashboardScreen from "./screens/DashboardScreen";
import DetailScreen from "./screens/DetailScreen";
import RoadmapScreen from "./screens/RoadmapScreen";
import ParentViewScreen from "./screens/ParentViewScreen";
import { fetchMatches, fetchAnalysis } from "./api";

function enrichMatchesWithAnalysis(matches, analysis) {
  const byName = new Map(
    (analysis.top_scholarships || []).map((s) => [s.name, s])
  );

  return matches.map((m) => {
    const ai = byName.get(m.name);
    if (!ai) return m;
    return {
      ...m,
      reason: ai.why_suitable || m.reason,
      gap: null,
      sourceUrl: ai.official_link || m.sourceUrl,
      deadlineRaw: ai.deadline || m.deadlineRaw,
    };
  });
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const handleSubmit = async (profile) => {
    setLoading(true);
    setError(null);
    setToastMessage("Profile submitted! Finding matches...");
    
    try {
      const [results, aiAnalysis] = await Promise.all([
        fetchMatches(profile),
        fetchAnalysis(profile).catch(() => null),
      ]);

      const enriched = aiAnalysis
        ? enrichMatchesWithAnalysis(results, aiAnalysis)
        : results;

      setMatches(enriched);
      setAnalysis(aiAnalysis);
      setScreen("dashboard");
      setToastMessage(aiAnalysis ? "Matches and AI analysis ready." : "Matches found successfully.");
    } catch (err) {
      setError(err.message || "Something went wrong reaching the matching engine.");
      setToastMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setScreen("intake");
  };

  const handleLogout = () => {
    setUser(null);
    setScreen("landing");
    setMatches([]);
    setAnalysis(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 font-sans">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onNavigate={setScreen} 
        currentScreen={screen} 
      />

      <main className="flex-grow">
        {screen === "landing" && (
          <LandingScreen onGetStarted={() => setScreen(user ? "intake" : "login")} />
        )}

        {screen === "login" && (
          <LoginScreen onLogin={handleLogin} />
        )}

        {screen === "account" && (
          <AccountScreen user={user} />
        )}

        {screen === "intake" && (
          <IntakeScreen onSubmit={handleSubmit} submitting={loading} error={error} />
        )}

        {screen === "dashboard" && (
          <DashboardScreen
            screen={screen}
            setScreen={setScreen}
            matches={matches}
            loading={loading}
            onSelect={(m) => {
              setSelected(m);
              setScreen("detail");
            }}
            onRestart={() => {
              setMatches([]);
              setScreen("intake");
            }}
          />
        )}

        {screen === "detail" && (
          <DetailScreen match={selected} onBack={() => setScreen("dashboard")} />
        )}

        {screen === "roadmap" && (
          <RoadmapScreen screen={screen} setScreen={setScreen} matches={matches} analysis={analysis} />
        )}

        {screen === "parent" && (
          <ParentViewScreen screen={screen} setScreen={setScreen} matches={matches} onBack={() => setScreen("dashboard")} />
        )}
      </main>

      <Footer />

      {toastMessage && (
        <Toast 
          message={toastMessage} 
          onClose={() => setToastMessage("")} 
        />
      )}
    </div>
  );
}

