// Expand compact hour strings like "M-Th 10a-8p, F-Sa 10a-6p, Su 2p-6p"
// into "Mon-Thu 10AM-8PM, Fri-Sat 10AM-6PM, Sun 2PM-6PM".

const DAYS_LONG_FIRST: Array<[RegExp, string]> = [
  [/\bThurs?\b/g, "Thu"],
  [/\bTues\b/g, "Tue"],
  [/\bWeds?\b/g, "Wed"],
  [/\bSat\b/g, "Sat"],
  [/\bSun\b/g, "Sun"],
  [/\bMon\b/g, "Mon"],
  [/\bFri\b/g, "Fri"],
  [/\bTh\b/g, "Thu"],
  [/\bSa\b/g, "Sat"],
  [/\bSu\b/g, "Sun"],
  [/\bM\b/g, "Mon"],
  [/\bT\b/g, "Tue"],
  [/\bW\b/g, "Wed"],
  [/\bF\b/g, "Fri"],
];

function expandTimes(s: string): string {
  return s.replace(/(\d{1,2})(?::(\d{2}))?\s*([apAP])(?:\.?[mM]\.?)?\b/g, (_m, h, mm, ap) => {
    const suffix = ap.toLowerCase() === "a" ? "AM" : "PM";
    return mm ? `${h}:${mm}${suffix}` : `${h}${suffix}`;
  });
}

function expandDays(s: string): string {
  let out = s;
  for (const [re, replacement] of DAYS_LONG_FIRST) {
    out = out.replace(re, replacement);
  }
  return out;
}

export function formatHours(input: string | null | undefined): string {
  if (!input) return "";
  return expandDays(expandTimes(input));
}
