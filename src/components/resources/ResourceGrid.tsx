import type { Resource } from "@/types";
import { ResourceCard } from "./ResourceCard";

export function ResourceGrid({ resources, showDistance = true }: { resources: Resource[]; showDistance?: boolean }) {
  if (!resources.length) {
    return (
      <div className="text-center py-16 bg-white rounded-card border border-dashed border-border">
        <p className="text-text-secondary">No resources match these filters.</p>
        <p className="text-sm text-text-muted mt-1">Try clearing some filters or changing your location.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((r) => (
        <ResourceCard key={r.id} resource={r} showDistance={showDistance} />
      ))}
    </div>
  );
}
