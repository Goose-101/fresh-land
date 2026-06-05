"use client";
import { useState } from "react";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import type { Review } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  yelp: "Yelp",
  facebook: "Facebook",
  site: "Their website",
  website: "Their website",
  manual: "Fresh Land",
  user: "Fresh Land",
};

function sourceLabel(source: string | null | undefined): string {
  if (!source) return "Other";
  const key = source.toLowerCase();
  return SOURCE_LABELS[key] || source.charAt(0).toUpperCase() + source.slice(1);
}

function sourceVariant(source: string | null | undefined): "muted" | "primary" | "success" {
  if (!source) return "muted";
  const key = source.toLowerCase();
  if (key === "manual" || key === "user") return "success";
  if (key === "site" || key === "website") return "primary";
  return "muted";
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const px = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(px, i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-300")}
        />
      ))}
    </div>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const text = review.text || "";
  const truncate = text.length > 200;
  const shown = expanded || !truncate ? text : text.slice(0, 200) + "…";
  const initials = (review.author_name || "G")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="border-b border-border last:border-0 py-4">
      <div className="flex items-start gap-3">
        {review.author_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={review.author_photo_url} alt="" className="h-9 w-9 rounded-full" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-primary-light text-primary-dark grid place-items-center text-xs font-semibold">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{review.author_name || "Anonymous"}</span>
            <Stars rating={review.rating} />
            {review.relative_time_description && (
              <span className="text-xs text-text-muted">{review.relative_time_description}</span>
            )}
            <Badge variant={sourceVariant(review.source)}>{sourceLabel(review.source)}</Badge>
          </div>
          {text && (
            <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
              {shown}
              {truncate && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="ml-1 text-primary hover:underline text-sm"
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReviewsSection({
  reviews,
  avgRating,
  totalCount,
  placeId,
  websiteUrl,
}: {
  reviews: Review[];
  avgRating?: number;
  totalCount?: number;
  placeId?: string | null;
  websiteUrl?: string | null;
}) {
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? reviews : reviews.slice(0, 5);
  const distribution = [5, 4, 3, 2, 1].map((r) => ({
    r,
    c: reviews.filter((rv) => Math.round(rv.rating) === r).length,
  }));
  const max = Math.max(...distribution.map((d) => d.c), 1);

  const sources = Array.from(new Set(reviews.map((r) => (r.source || "other").toLowerCase())));
  const hasNonGoogle = sources.some((s) => s !== "google");

  return (
    <section className="bg-white rounded-card border border-border p-6">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <h2 className="text-lg font-semibold">What people say</h2>
        {sources.map((s) => (
          <Badge key={s} variant={sourceVariant(s)}>{sourceLabel(s)}</Badge>
        ))}
      </div>

      {reviews.length === 0 ? (
        avgRating || totalCount ? (
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <div className="text-5xl font-semibold text-text">
              {avgRating ? avgRating.toFixed(1) : "—"}
            </div>
            <Stars rating={avgRating || 0} size="lg" />
            <p className="text-sm text-text-secondary">
              {totalCount ? `${totalCount.toLocaleString()} reviews on Google` : "Rated on Google"}
            </p>
            {placeId && (
              <a
                href={`https://search.google.com/local/reviews?placeid=${placeId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-1 px-4 py-2 rounded-btn bg-primary text-white text-sm font-medium hover:bg-primary-dark transition"
              >
                Read all reviews on Google →
              </a>
            )}
            {!placeId && websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-1 px-4 py-2 rounded-btn bg-primary text-white text-sm font-medium hover:bg-primary-dark transition"
              >
                Read on their website →
              </a>
            )}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-text-secondary">
              No reviews yet for this resource.
            </p>
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-btn border border-border text-sm font-medium hover:bg-slate-50 transition"
              >
                Visit their website →
              </a>
            )}
          </div>
        )
      ) : (
        <>
          <div className="grid sm:grid-cols-[auto_1fr] gap-6 pb-5 border-b border-border">
            <div className="text-center sm:text-left">
              <div className="text-4xl font-semibold text-text">
                {avgRating ? avgRating.toFixed(1) : "—"}
              </div>
              <Stars rating={avgRating || 0} size="lg" />
              <div className="text-xs text-text-muted mt-1">
                {totalCount ?? reviews.length} reviews
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {distribution.map(({ r, c }) => (
                <div key={r} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-text-muted">{r}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <div className="flex-1 bg-slate-100 h-1.5 rounded-pill overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-pill"
                      style={{ width: `${(c / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-text-muted">{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {display.map((r) => (
              <ReviewItem key={r.id} review={r} />
            ))}
          </div>

          {reviews.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
            >
              {showAll ? (
                <>Show fewer reviews <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>See all {reviews.length} reviews <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          )}

          <div className="mt-3 flex flex-col gap-1">
            {placeId && (
              <a
                href={`https://search.google.com/local/reviews?placeid=${placeId}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View all reviews on Google →
              </a>
            )}
            {hasNonGoogle && websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View more on their website →
              </a>
            )}
          </div>
        </>
      )}
    </section>
  );
}
