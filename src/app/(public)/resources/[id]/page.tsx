import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Phone, Globe, MapPin, Mail, Clock, CheckCircle2, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { SaveButton } from "@/components/resources/SaveButton";
import { DirectionsButton } from "@/components/resources/DirectionsButton";
import { ReviewsSection } from "@/components/resources/ReviewsSection";
import { FlagButton } from "@/components/resources/FlagButton";
import { CopyAddress } from "@/components/resources/CopyAddress";
import { Button } from "@/components/ui/Button";
import { DisclaimerBanner, categoryDisclaimerKind, InfoChangesNote } from "@/components/ui/DisclaimerBanner";
import { getServerMessages, resolveKey, formatMessage } from "@/lib/i18n";
import { formatHours } from "@/lib/format-hours";
import { ensureFreshGoogleReviews } from "@/lib/google-places";
import { ensureFreshCharityData } from "@/lib/nonprofit-data";
import { NonprofitVerification } from "@/components/resources/NonprofitVerification";
import type { Resource, Review } from "@/types";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { messages } = await getServerMessages();
  const t = (key: string, vars?: Record<string, string | number>) =>
    formatMessage(resolveKey(messages, key), vars);

  const { data: resource } = await supabase
    .from("resources")
    .select("*, category:categories(*)")
    .eq("id", id)
    .single();

  if (!resource) notFound();
  const r = resource as Resource;

  await supabase.rpc("increment_click", { r_id: id }).throwOnError().then(() => {}, () => {});
  await supabase.from("resources").update({ click_count: (r.click_count || 0) + 1 }).eq("id", id);

  await Promise.all([
    ensureFreshGoogleReviews(id, r.google_place_id),
    ensureFreshCharityData(id, r.ein, r.charity_synced_at),
  ]);

  const { data: refreshedResource } = await supabase
    .from("resources")
    .select("charity_data")
    .eq("id", id)
    .single();
  const charityData = refreshedResource?.charity_data || r.charity_data;

  const { data: reviews } = await supabase
    .from("resource_reviews")
    .select("*")
    .eq("resource_id", id)
    .eq("is_approved", true)
    .order("google_time", { ascending: false, nullsFirst: false });

  const mapSrc = r.google_place_id
    ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=place_id:${r.google_place_id}`
    : r.address
      ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(r.address)}`
      : null;

  const categoryLabel = r.category ? resolveKey(messages, `category.${r.category.slug}`, r.category.name) : "";
  const disclaimerKind = categoryDisclaimerKind(r.category?.slug);
  const updatedAt = r.updated_at
    ? new Date(r.updated_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/resources" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
        {t("resources.backToResources")}
      </Link>

      {disclaimerKind && (
        <DisclaimerBanner kind={disclaimerKind} messages={messages} className="mt-4" />
      )}

      <div className="mt-4 bg-white rounded-card border border-border p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-2 mb-2">
          {r.category && <Badge variant="primary">{categoryLabel}</Badge>}
          {r.is_free && <Badge variant="success">{t("resources.free")}</Badge>}
          {r.is_verified && (
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3" /> {t("resources.verified")}
            </Badge>
          )}
          {r.serves_undocumented && <Badge variant="primary">{t("resources.undocFriendlyBadge")}</Badge>}
        </div>
        <h1 className="text-3xl font-semibold text-text">{r.name}</h1>
        {r.google_rating && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="inline-flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i <= Math.round(r.google_rating!) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                />
              ))}
            </span>
            <span className="font-semibold">{r.google_rating.toFixed(1)}</span>
            <span className="text-text-muted">{t("resources.googleReviews", { count: r.google_review_count || 0 })}</span>
          </div>
        )}
        {r.languages?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {r.languages.map((l) => (
              <span key={l} className="rounded-pill bg-primary-light text-primary-dark text-xs font-medium px-2.5 py-0.5 uppercase tracking-wider">
                {l}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {r.address && (
            <DirectionsButton address={r.address} placeId={r.google_place_id} />
          )}
          {r.website_url && (
            <a href={r.website_url} target="_blank" rel="noreferrer">
              <Button variant="outline">
                <Globe className="h-4 w-4" /> {t("action.visitWebsite")}
              </Button>
            </a>
          )}
          {r.phone && (
            <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}>
              <Button variant="outline">
                <Phone className="h-4 w-4" /> {t("action.call")}
              </Button>
            </a>
          )}
          <SaveButton resourceId={r.id} showLabel />
        </div>

        <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center gap-x-4 gap-y-2">
          <InfoChangesNote messages={messages} />
          {updatedAt && (
            <span className="text-xs text-text-muted">
              {t("disclaimer.lastUpdated", { date: updatedAt })}
            </span>
          )}
        </div>
      </div>

      {mapSrc && (
        <div className="mt-4 bg-white rounded-card border border-border overflow-hidden">
          <iframe
            className="w-full h-[300px] border-0"
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          {r.address && (
            <div className="p-4 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>{r.address}</span>
              <CopyAddress address={r.address} />
            </div>
          )}
        </div>
      )}

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <section className="bg-white rounded-card border border-border p-6">
            <h2 className="text-lg font-semibold mb-2">{t("resources.about")}</h2>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{r.description}</p>
          </section>

          {r.eligibility && (
            <section className="bg-white rounded-card border border-border p-6">
              <h2 className="text-lg font-semibold mb-2">{t("resources.whoCanUse")}</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{r.eligibility}</p>
            </section>
          )}
          {r.how_to_apply && (
            <section className="bg-white rounded-card border border-border p-6">
              <h2 className="text-lg font-semibold mb-2">{t("resources.howToGet")}</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{r.how_to_apply}</p>
            </section>
          )}
          {r.what_to_bring && (
            <section className="bg-white rounded-card border border-border p-6">
              <h2 className="text-lg font-semibold mb-2">{t("resources.whatToBring")}</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{r.what_to_bring}</p>
            </section>
          )}

          {charityData && (
            <NonprofitVerification data={charityData} messages={messages} />
          )}

          <ReviewsSection
            reviews={(reviews || []) as Review[]}
            avgRating={r.google_rating || undefined}
            totalCount={r.google_review_count || undefined}
            placeId={r.google_place_id}
            websiteUrl={r.website_url}
          />
        </div>

        <aside className="space-y-4">
          <section className="bg-white rounded-card border border-border p-6">
            <h3 className="label mb-3">{t("resources.contact")}</h3>
            <ul className="flex flex-col gap-3 text-sm">
              {r.phone && (
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-primary mt-0.5" />
                  <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="text-primary-dark hover:underline">
                    {r.phone}
                  </a>
                </li>
              )}
              {r.website_url && (
                <li className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-primary mt-0.5" />
                  <a href={r.website_url} target="_blank" rel="noreferrer" className="text-primary-dark hover:underline inline-flex items-center gap-1 break-all">
                    {r.website_url.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              )}
              {r.email && (
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-primary mt-0.5" />
                  <a href={`mailto:${r.email}`} className="text-primary-dark hover:underline break-all">
                    {r.email}
                  </a>
                </li>
              )}
              {r.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <span className="text-text-secondary">{r.address}</span>
                </li>
              )}
            </ul>
          </section>

          {r.hours && (
            <section className="bg-white rounded-card border border-border p-6">
              <h3 className="label mb-3">{t("resources.hours")}</h3>
              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <ul className="text-text-secondary flex flex-col gap-1">
                  {formatHours(r.hours)
                    .split(/[,\n]/)
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                </ul>
              </div>
            </section>
          )}

          <section className="bg-white rounded-card border border-border p-6">
            <h3 className="label mb-3">{t("resources.availabilityTitle")}</h3>
            <ul className="flex flex-col gap-1.5 text-sm text-text-secondary">
              {r.walk_in_available && <li>{t("resources.walkInYes")}</li>}
              {r.weekend_hours && <li>{t("resources.weekendYes")}</li>}
              {r.evening_hours && <li>{t("resources.eveningYes")}</li>}
              {r.phone_intake && <li>{t("resources.phoneYes")}</li>}
              {r.is_free && <li>{t("resources.freeYes")}</li>}
            </ul>
          </section>

          <div className="text-center">
            <FlagButton resourceId={r.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}
