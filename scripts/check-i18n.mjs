#!/usr/bin/env node
// Compares every locale file in src/messages against en.json (source of truth).
// Exits 1 if any locale is missing keys present in en.json.
// Run: node scripts/check-i18n.mjs

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, "..", "src", "messages");
const SOURCE = "en";

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

const sourcePath = join(messagesDir, `${SOURCE}.json`);
const sourceFlat = flatten(JSON.parse(readFileSync(sourcePath, "utf8")));
const sourceKeys = new Set(Object.keys(sourceFlat));

const files = readdirSync(messagesDir).filter((f) => f.endsWith(".json") && f !== `${SOURCE}.json`);

let totalMissing = 0;
let totalExtra = 0;
let totalEmpty = 0;
const report = [];

for (const file of files.sort()) {
  const locale = basename(file, ".json");
  const flat = flatten(JSON.parse(readFileSync(join(messagesDir, file), "utf8")));
  const keys = new Set(Object.keys(flat));

  const missing = [...sourceKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !sourceKeys.has(k));
  const empty = [...keys].filter((k) => sourceKeys.has(k) && (flat[k] === "" || flat[k] == null));
  const untranslated = [...keys].filter(
    (k) => sourceKeys.has(k) && flat[k] === sourceFlat[k] && typeof flat[k] === "string" && flat[k].length > 2
  );

  totalMissing += missing.length;
  totalExtra += extra.length;
  totalEmpty += empty.length;
  report.push({ locale, missing, extra, empty, untranslated });
}

console.log(`\nSource: ${SOURCE}.json — ${sourceKeys.size} keys\n`);
console.log("Locale  | Missing | Extra | Empty | Untranslated (same as en)");
console.log("--------|---------|-------|-------|--------------------------");
for (const r of report) {
  console.log(
    `${r.locale.padEnd(7)} | ${String(r.missing.length).padStart(7)} | ${String(r.extra.length).padStart(5)} | ${String(r.empty.length).padStart(5)} | ${r.untranslated.length}`
  );
}

const verbose = process.argv.includes("--verbose") || process.argv.includes("-v");
if (verbose) {
  for (const r of report) {
    if (r.missing.length || r.extra.length || r.empty.length) {
      console.log(`\n--- ${r.locale} ---`);
      if (r.missing.length) console.log("Missing keys:\n  " + r.missing.join("\n  "));
      if (r.extra.length) console.log("Extra keys (not in en):\n  " + r.extra.join("\n  "));
      if (r.empty.length) console.log("Empty values:\n  " + r.empty.join("\n  "));
    }
  }
}

if (totalMissing > 0 || totalEmpty > 0) {
  console.log(`\n[FAIL] ${totalMissing} missing, ${totalEmpty} empty values across locales.`);
  console.log("Run with --verbose to see exact keys.");
  process.exit(1);
} else {
  console.log("\n[OK] All locales have every key from en.json with non-empty values.");
  if (totalExtra > 0) {
    console.log(`(${totalExtra} extra keys exist in non-en locales — not breaking, but consider cleanup.)`);
  }
}
