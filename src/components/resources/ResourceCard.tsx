import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import type { Resource } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { SaveButton } from "./SaveButton";
import { formatDistance } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function ResourceCard({ resource, showDistance = true, compact = false }: { resource: Resource; showDistance?: boolean; compact?: boolean }) {
  const desc = resource.short_description || resource.description;

  return (
    <div className="relative bg-white rounded-card border border-border p-5 hover:shadow-card hover:border-primary/30 transition group">
      <div className="absolute top-4 right-4">
        <SaveButton resourceId={resource.id} />
      </div>

      <Link href={`/resources/${resource.id}`} className="block">
        <div className="flex items-start gap-2 pr-12">
          <div className="min-w-0">
            <h3 className="font-semibold text-text leading-snug group-hover:text-primary-dark">{resource.name}</h3>
            {resource.category && (
              <Badge variant="primary" className="mt-1.5">{resource.category.name}</Badge>
            )}
          </div>
        </div>

        <p className="mt-3 text-sm text-text-secondary line-clamp-2">{desc}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {resource.is_free && <Badge variant="success">Free</Badge>}
          {resource.serves_undocumented && <Badge variant="primary">Undoc friendly</Badge>}
          {resource.walk_in_available && <Badge variant="muted">Walk-in</Badge>}
          {resource.weekend_hours && <Badge variant="muted">Weekends</Badge>}
        </div>

        {!compact && resource.languages?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {resource.languages.slice(0, 5).map((l) => (
              <span key={l} className="text-[10px] font-medium uppercase tracking-wider text-text-muted bg-slate-50 px-1.5 py-0.5 rounded">
                {l}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            {resource.google_rating && (
              <span
                className="inline-flex items-center gap-1"
                title={
                  resource.rating_source === "estimated"
                    ? "Reputational estimate — not yet synced from Google"
                    : "Live Google rating"
                }
              >
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium">{resource.google_rating.toFixed(1)}</span>
                <span className="text-text-muted">({resource.google_review_count ?? 0})</span>
                {resource.rating_source === "estimated" && (
                  <span className="text-[10px] uppercase tracking-wider text-text-muted ml-0.5">
                    est.
                  </span>
                )}
              </span>
            )}
            {showDistance && resource.distance !== undefined && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary-dark font-medium">{formatDistance(resource.distance)}</span>
              </span>
            )}
          </div>
          <Button size="sm" variant="primary">Get Help →</Button>
        </div>
      </Link>
    </div>
  );
}
