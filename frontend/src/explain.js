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
  const name = matchResult.name || "this opportunity";
  const country = matchResult.country || "your destination";

  if (matchResult.eligibility_status === "Eligible") {
    return {
      reason: `Strong match for ${name}. Your academic standing, residency status, and degree discipline satisfy all eligibility thresholds.`,
      gap: null,
    };
  }

  const sentence = failed.length
    ? `Requires attention: ${failed.join("; ")}.`
    : "This opportunity is a partial match based on current profile parameters.";

  return {
    reason: sentence,
    gap: failed.length
      ? `Action required: Resolve ${failed.join(", ")} to qualify for this intake.`
      : "Review official guidelines to verify departmental criteria.",
  };
}
