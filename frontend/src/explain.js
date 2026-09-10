// explain.js
// ---------------------------------------------------------------
// TEMPORARY STAND-IN for Member C (why-this-match explanation) and
// Member D (gap-to-action). Aimen's backend only returns
// `reasons_failed` — a list of raw rule-failure strings, empty when
// eligible. This turns that raw list into the `reason` / `gap` text
// the Detail screen shows, so the UI works end-to-end today.
//
// REPLACE THIS FILE once C and D have real endpoints — the shape
// (reason: string, gap: string|null) is the contract to keep, so
// swapping this out shouldn't require changing any screen.
// ---------------------------------------------------------------

export function explainMatch(matchResult) {
  const failed = matchResult.reasons_failed || [];

  if (matchResult.eligibility_status === "Eligible") {
    return {
      reason: "Based on your profile, you meet every eligibility rule checked for this opportunity.",
      gap: null,
    };
  }

  const sentence = failed.length ? failed.join(". ") + "." : "This opportunity is a partial or uncertain fit based on your profile.";

  return {
    reason: sentence,
    gap: sentence,
  };
}
