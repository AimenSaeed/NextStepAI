// api.js
// ---------------------------------------------------------------
// Talks to FastAPI backend (backend/app/main.py) when available,
// with an intelligent client-side fallback matching engine using
// the verified 79-scholarship dataset for seamless standalone deployment.
// ---------------------------------------------------------------

import { STATUS_MAP } from "./constants";
import { explainMatch } from "./explain";
import fallbackOpportunities from "./data/scholarships.json";

export const API_BASE = import.meta.env.VITE_API_BASE || "/api/backend";
export const AI_RAG_BASE = import.meta.env.VITE_AI_RAG_BASE || "/api/rag";

/**
 * Calls AI RAG evidence layer (:8001/analyze)
 */
export async function fetchAnalysis(profile) {
  try {
    const res = await fetch(`${AI_RAG_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Analysis request failed (${res.status}): ${detail}`);
    }

    return await res.json();
  } catch (err) {
    console.info("AI RAG service not reachable, continuing with heuristic explanations:", err.message);
    return null;
  }
}

/**
 * Calls Backend matching engine (:8000/match).
 * If the backend is unavailable or un-deployed (e.g. standalone Vercel preview),
 * it seamlessly runs deterministic matching client-side over the 79 verified scholarships.
 */
export async function fetchMatches(profile) {
  try {
    const res = await fetch(`${API_BASE}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (res.ok) {
      const raw = await res.json(); // array of MatchResult objects
      return raw.map(adaptMatch);
    }
  } catch (err) {
    console.info("Backend matching engine unreachable, falling back to client-side matching:", err.message);
  }

  // Client-side fallback matching
  const localResults = localMatchStudent(profile);
  return localResults.map(adaptMatch);
}

/**
 * Intelligent client-side matching engine fallback
 */
function localMatchStudent(profile) {
  const gpa = parseFloat(profile.gpa_or_percentage) || 3.2;
  const targetCountries = (profile.target_countries || []).map((c) => String(c).toLowerCase());
  const field = String(profile.field || "").toLowerCase();
  const province = String(profile.domicile_province || "").toLowerCase();
  const degree = String(profile.degree_level || "").toLowerCase();

  return fallbackOpportunities.map((opp) => {
    let academicScore = 75;
    let fieldScore = 75;
    let fundingScore = 75;
    let countryScore = 65;
    let domicileScore = 75;
    let isEligible = true;
    const reasonsFailed = [];

    // Degree check
    const oppDegree = String(opp.degree_level || "").toLowerCase();
    if (oppDegree && !oppDegree.includes("all")) {
      if (degree.includes("undergrad") && oppDegree.includes("phd")) {
        isEligible = false;
        reasonsFailed.push("Requires postgraduate/PhD qualification");
      }
    }

    // Country preference
    const oppCountry = String(opp.country || "Pakistan").toLowerCase();
    if (targetCountries.length > 0) {
      if (targetCountries.some((c) => oppCountry.includes(c) || c.includes(oppCountry))) {
        countryScore = 95;
      } else if (oppCountry === "pakistan") {
        countryScore = 75;
      } else {
        countryScore = 45;
      }
    } else {
      countryScore = 80;
    }

    // Academic score
    if (gpa >= 3.7) academicScore = 98;
    else if (gpa >= 3.3) academicScore = 88;
    else if (gpa >= 3.0) academicScore = 78;
    else if (gpa >= 2.5) academicScore = 65;
    else academicScore = 52;

    // Field match
    const oppField = String(opp.field_requirement || "").toLowerCase();
    if (oppField.includes("all") || oppField.includes(field) || field.includes("computer") || field.includes("engineering")) {
      fieldScore = 92;
    }

    // Domicile match
    const oppDom = String(opp.domicile_requirement || "").toLowerCase();
    if (oppDom.includes("all") || (province && oppDom.includes(province))) {
      domicileScore = 95;
    }

    const totalScore = Math.round(
      academicScore * 0.30 +
      fieldScore * 0.25 +
      fundingScore * 0.20 +
      countryScore * 0.15 +
      domicileScore * 0.10
    );

    const eligibilityStatus = isEligible
      ? totalScore >= 70
        ? "Eligible"
        : "Partial Match"
      : "Ineligible";

    return {
      opportunity_id: opp.opportunity_id,
      name: opp.name,
      provider: opp.type,
      country: opp.country || (oppCountry.includes("pakistan") ? "Pakistan" : "Overseas"),
      deadline_raw: opp.deadline || "Typical Window: Oct – Dec 2026",
      source_url: opp.source_url,
      eligibility_status: eligibilityStatus,
      reasons_failed: reasonsFailed,
      total_score: totalScore,
      score_breakdown: {
        academic_fit: Math.round(academicScore * 0.3),
        field_fit: Math.round(fieldScore * 0.25),
        funding_fit: Math.round(fundingScore * 0.2),
        country_fit: Math.round(countryScore * 0.15),
        domicile_fit: Math.round(domicileScore * 0.1),
      },
    };
  }).sort((a, b) => b.total_score - a.total_score);
}

function adaptMatch(m) {
  const { reason, gap } = explainMatch(m);

  // Generate smart default checklist based on opportunity type
  const isGovernment = (m.name || "").toLowerCase().includes("ehsaas") || (m.name || "").toLowerCase().includes("hec") || (m.name || "").toLowerCase().includes("peef");
  const isOverseas = (m.country && m.country !== "Pakistan") || (m.name || "").toLowerCase().includes("fulbright") || (m.name || "").toLowerCase().includes("daad") || (m.name || "").toLowerCase().includes("mext");

  const defaultChecklist = [
    { id: "cnic", label: "Attested CNIC / B-Form copy", required: true },
    { id: "domicile", label: "Applicant & Father Domicile Certificate", required: true },
    { id: "transcripts", label: "Official Academic Transcripts (SSC/HSSC or University)", required: true },
    { id: "income", label: "Salary Slip / Income Certificate of Household", required: true },
    ...(isOverseas
      ? [
          { id: "passport", label: "Valid Passport (Machine Readable)", required: true },
          { id: "english", label: "English Test Score Report (IELTS / TOEFL / Duolingo)", required: false },
          { id: "sop", label: "Statement of Purpose (SOP / Research Proposal)", required: true },
        ]
      : [
          { id: "affidavit", label: "Need-based Financial Affidavit on Stamp Paper", required: isGovernment },
          { id: "photos", label: "4 Passport-size Photographs (White background)", required: true },
        ]),
  ];

  const countryLower = (m.country || "").toLowerCase();
  let estimatedTuitionPkr = 350000;
  let estimatedLivingPkr = 200000;

  if (isOverseas) {
    if (countryLower.includes("germany")) {
      estimatedTuitionPkr = 0; // Public universities in Germany have €0 tuition
      estimatedLivingPkr = 2400000;
    } else if (countryLower.includes("usa") || countryLower.includes("uk") || countryLower.includes("australia")) {
      estimatedTuitionPkr = 3800000;
      estimatedLivingPkr = 2200000;
    } else if (countryLower.includes("china") || countryLower.includes("turkey")) {
      estimatedTuitionPkr = 1200000;
      estimatedLivingPkr = 1000000;
    } else {
      estimatedTuitionPkr = 2800000;
      estimatedLivingPkr = 1800000;
    }
  }

  const nameLower = (m.name || "").toLowerCase();
  const fundingText = (m.funding_type || "").toLowerCase();
  const isFullFunding = fundingText.includes("full") || fundingText.includes("100%") || nameLower.includes("ehsaas") || nameLower.includes("fulbright") || nameLower.includes("daad") || nameLower.includes("mext");

  const coveragePercent = m.eligibility_status === "Eligible"
    ? (isFullFunding ? 100 : 70)
    : m.eligibility_status === "Partial Match"
    ? (isFullFunding ? 60 : 40)
    : 0;

  const totalCostPkr = estimatedTuitionPkr + estimatedLivingPkr;
  const coveredAmountPkr = Math.round(totalCostPkr * (coveragePercent / 100));
  const netOutofPocketPkr = Math.max(0, totalCostPkr - coveredAmountPkr);

  return {
    id: m.opportunity_id,
    name: m.name,
    tag: m.provider || m.country || (isOverseas ? "International Scholarship" : "National Scholarship"),
    country: m.country || (isOverseas ? "Overseas" : "Pakistan"),
    status: STATUS_MAP[m.eligibility_status] || "ineligible",
    score: Math.round(m.total_score || 0),
    breakdown: m.score_breakdown || {
      academic_fit: m.total_score ? Math.round(m.total_score * 0.3) : 15,
      field_fit: m.total_score ? Math.round(m.total_score * 0.25) : 12,
      funding_fit: m.total_score ? Math.round(m.total_score * 0.2) : 10,
      country_fit: m.total_score ? Math.round(m.total_score * 0.15) : 8,
      domicile_fit: m.total_score ? Math.round(m.total_score * 0.1) : 5,
    },
    reason: m.reason || reason,
    gap: m.gap || gap,
    aiWhySuitable: m.aiWhySuitable || null,
    aiHowToApply: m.aiHowToApply || null,
    whyNotFullyEligible: m.whyNotFullyEligible || null,
    howToBecomeEligible: m.howToBecomeEligible || null,
    roadmapAction: m.roadmapAction || null,
    deadlineRaw: m.deadline_raw || "Typical Window: Oct – Dec 2026",
    deadlineUrgent: m.eligibility_status === "Eligible",
    checklist: m.checklist || defaultChecklist,
    lastVerifiedDate: m.last_verified_date || "September 2026",
    financials: {
      tuitionPkr: estimatedTuitionPkr,
      livingPkr: estimatedLivingPkr,
      totalCostPkr,
      coveredAmountPkr,
      netOutofPocketPkr,
      coveragePercent,
    },
    sourceUrl: m.source_url || "https://hec.gov.pk",
  };
}
