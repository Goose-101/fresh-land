// ProPublica Nonprofit Explorer API integration.
// Fetches IRS Form 990 data by EIN. No API key, no signup — the entire
// dataset is publicly available because IRS data is public.
//
// API docs: https://projects.propublica.org/nonprofits/api

import { createAdminClient } from "./supabase/server";
import type { CharityData } from "@/types";

const ENDPOINT = "https://projects.propublica.org/nonprofits/api/v2";

// IRS Form 990 data updates annually. Cache for 90 days — anything fresher
// would be wasted requests.
const STALE_MS = 90 * 24 * 60 * 60 * 1000;

// IRS subsection codes — "03" = 501(c)(3) public charity / private foundation.
const SUBSECTION_501C3 = "03";

// ProPublica returns a profile-style "score" on the org page but not via API.
// We synthesize a transparency level from the number of years they've filed
// Form 990s — a long, consistent filing history is itself a trust signal.
function profileLevelFromFilings(filings: number): CharityData["profile_level"] {
  if (filings >= 10) return "Platinum";
  if (filings >= 5) return "Gold";
  if (filings >= 3) return "Silver";
  if (filings >= 1) return "Bronze";
  return "None";
}

function normalizeEin(input: string): string {
  return input.replace(/[^\d]/g, "").padStart(9, "0");
}

export async function fetchNonprofitByEin(rawEin: string): Promise<CharityData | null> {
  if (!rawEin) return null;
  const ein = normalizeEin(rawEin);
  if (ein.length !== 9) return null;

  try {
    const res = await fetch(`${ENDPOINT}/organizations/${ein}.json`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      if (res.status !== 404) console.error("[propublica] HTTP", res.status);
      return null;
    }

    const json = await res.json();
    const org = json?.organization;
    if (!org) return null;

    const filings = json?.filings_with_data || [];
    const latest = filings[0];

    return {
      ein,
      organization_name: org.name,
      mission: latest?.mission || org.mission || undefined,
      foundation_type: org.classification,
      ntee_code: org.ntee_code,
      ntee_description: org.ntee_description,
      ruling_year: org.ruling ? Number(String(org.ruling).slice(0, 4)) : undefined,
      profile_level: profileLevelFromFilings(filings.length),
      total_revenue: latest?.totrevenue ? Number(latest.totrevenue) : undefined,
      total_expenses: latest?.totfuncexpns ? Number(latest.totfuncexpns) : undefined,
      fiscal_year: latest?.tax_prd_yr ? Number(latest.tax_prd_yr) : undefined,
      is_501c3: org.subsection_code === SUBSECTION_501C3,
      city: org.city,
      state: org.state,
      website: undefined,
    };
  } catch (e: any) {
    console.error("[propublica] fetch failed", e?.message);
    return null;
  }
}

export async function ensureFreshCharityData(
  resourceId: string,
  ein: string | null | undefined,
  syncedAt: string | null | undefined
): Promise<void> {
  if (!ein) return;

  const stale =
    !syncedAt || Date.now() - new Date(syncedAt).getTime() > STALE_MS;
  if (!stale) return;

  const data = await fetchNonprofitByEin(ein);
  if (!data) return;

  try {
    const supabase = await createAdminClient();
    await supabase
      .from("resources")
      .update({
        charity_data: data,
        charity_synced_at: new Date().toISOString(),
      })
      .eq("id", resourceId);
  } catch (e: any) {
    console.error("[propublica] cache write failed", e?.message);
  }
}
