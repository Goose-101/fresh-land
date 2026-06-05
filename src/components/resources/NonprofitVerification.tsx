import { ShieldCheck, Award, ExternalLink } from "lucide-react";
import type { CharityData } from "@/types";
import { resolveKey, type Messages } from "@/lib/i18n-utils";

const PROFILE_COLORS: Record<string, string> = {
  Platinum: "bg-slate-100 text-slate-800 border-slate-300",
  Gold:     "bg-amber-100 text-amber-800 border-amber-300",
  Silver:   "bg-zinc-100 text-zinc-700 border-zinc-300",
  Bronze:   "bg-orange-100 text-orange-800 border-orange-300",
};

function formatMoney(n?: number): string | null {
  if (n == null || isNaN(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function NonprofitVerification({
  data,
  messages,
}: {
  data: CharityData;
  messages: Messages;
}) {
  const t = (key: string, fallback: string) =>
    resolveKey(messages, `verification.${key}`, fallback);

  const profileLevel = data.profile_level && data.profile_level !== "None" ? data.profile_level : null;
  const profileClass = profileLevel ? PROFILE_COLORS[profileLevel] : "";
  const yearsActive = data.ruling_year ? new Date().getFullYear() - data.ruling_year : null;
  const revenue = formatMoney(data.total_revenue);

  return (
    <section className="bg-white rounded-card border border-border p-6">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{t("verifiedNonprofit", "Verified nonprofit")}</h3>
            {data.is_501c3 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-emerald-100 text-emerald-800 border border-emerald-200">
                501(c)(3)
              </span>
            )}
            {profileLevel && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-pill border inline-flex items-center gap-1 ${profileClass}`}>
                <Award className="h-3 w-3" /> {profileLevel}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {t("dataFrom", "Verified by Candid (formerly GuideStar) and the IRS")}
          </p>

          {data.mission && (
            <p className="text-sm text-text-secondary mt-3 leading-relaxed">{data.mission}</p>
          )}

          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {yearsActive != null && (
              <div>
                <dt className="text-xs text-text-muted">{t("yearsActive", "Years active")}</dt>
                <dd className="font-semibold">{yearsActive}+</dd>
              </div>
            )}
            {data.ruling_year && (
              <div>
                <dt className="text-xs text-text-muted">{t("rulingYear", "Founded")}</dt>
                <dd className="font-semibold">{data.ruling_year}</dd>
              </div>
            )}
            {revenue && (
              <div>
                <dt className="text-xs text-text-muted">
                  {t("revenue", "Revenue")} {data.fiscal_year ? `(${data.fiscal_year})` : ""}
                </dt>
                <dd className="font-semibold">{revenue}</dd>
              </div>
            )}
            {data.ntee_description && (
              <div className="col-span-2">
                <dt className="text-xs text-text-muted">{t("classification", "Type")}</dt>
                <dd className="font-medium text-sm">{data.ntee_description}</dd>
              </div>
            )}
          </dl>

          {data.ein && (
            <p className="text-xs text-text-muted mt-3">
              EIN {data.ein.replace(/^(\d{2})(\d{7})$/, "$1-$2")} ·{" "}
              <a
                href={`https://www.irs.gov/charities-non-profits/tax-exempt-organization-search`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                {t("verifyOnIrs", "Verify on IRS.gov")} <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
