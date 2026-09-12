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
  if (!analysis) return matches;

  const topByName = new Map(
    (analysis.top_scholarships || []).map((s) => [s.name.toLowerCase().trim(), s])
  );
  const partialByName = new Map(
    (analysis.partial_matches || []).map((s) => [s.name.toLowerCase().trim(), s])
  );
  const roadmapByScholarship = new Map(
    (analysis.application_roadmap || []).map((r) => [r.scholarship.toLowerCase().trim(), r.action])
  );

  return matches.map((m) => {
    const key = (m.name || "").toLowerCase().trim();
    const topAi = topByName.get(key);
    const partialAi = partialByName.get(key);
    const roadmapAction = roadmapByScholarship.get(key) || null;

    if (topAi) {
      return {
        ...m,
        reason: topAi.why_suitable || m.reason,
        aiWhySuitable: topAi.why_suitable,
        aiHowToApply: topAi.how_to_apply,
        roadmapAction,
        sourceUrl: topAi.official_link || m.sourceUrl,
        deadlineRaw: topAi.deadline || m.deadlineRaw,
      };
    }

    if (partialAi) {
      const whyNot = partialAi.why_not_fully_eligible?.join("; ");
      const howTo = partialAi.how_to_become_eligible?.join(". ");
      return {
        ...m,
        reason: whyNot ? `Criteria pending: ${whyNot}` : m.reason,
        gap: howTo ? `Action required: ${howTo}` : m.gap,
        whyNotFullyEligible: partialAi.why_not_fully_eligible,
        howToBecomeEligible: partialAi.how_to_become_eligible,
        roadmapAction,
        sourceUrl: partialAi.official_link || m.sourceUrl,
        deadlineRaw: partialAi.deadline || m.deadlineRaw,
      };
    }

    return {
      ...m,
      roadmapAction,
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
          <LandingScreen onGetStarted={() => setScreen("intake")} />
        )}

        {screen === "login" && (
          <LoginScreen onLogin={handleLogin} />
        )}

        {screen === "account" && (
          <AccountScreen user={user} onNavigate={setScreen} />
        )}

        {screen === "intake" && (
          <IntakeScreen onSubmit={handleSubmit} submitting={loading} error={error} onCancel={() => setScreen(matches.length ? "dashboard" : "landing")} />
        )}

        {screen === "dashboard" && (
          <DashboardScreen
            screen={screen}
            setScreen={setScreen}
            matches={matches}
            analysis={analysis}
            loading={loading}
            onSelect={(m) => {
              setSelected(m);
              setScreen("detail");
            }}
            onRestart={() => {
              setScreen("intake");
            }}
          />
        )}

        {screen === "detail" && (
          <DetailScreen match={selected} analysis={analysis} onBack={() => setScreen("dashboard")} />
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

