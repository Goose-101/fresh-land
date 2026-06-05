"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Resource, SavedResource } from "@/types";
import { Input } from "@/components/ui/Input";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { cn, timeAgo } from "@/lib/utils";

type Item = SavedResource & { resource: Resource };

export function SavedClient({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"recent" | "name" | "category">("recent");

  const categories = useMemo(() => {
    const set = new Map<string, string>();
    items.forEach((i) => {
      if (i.resource.category) set.set(i.resource.category.slug, i.resource.category.name);
    });
    return Array.from(set.entries());
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.filter((i) => {
      if (category !== "all" && i.resource.category?.slug !== category) return false;
      if (q && !i.resource.name.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sort === "name") list.sort((a, b) => a.resource.name.localeCompare(b.resource.name));
    else if (sort === "category")
      list.sort((a, b) => (a.resource.category?.name || "").localeCompare(b.resource.category?.name || ""));
    else list.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
    return list;
  }, [items, query, category, sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            className="pl-9"
            placeholder="Search your saved resources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="rounded-btn border border-border px-3 py-2.5 bg-white text-sm"
        >
          <option value="recent">Date saved (newest)</option>
          <option value="name">Alphabetical</option>
          <option value="category">By category</option>
        </select>
      </div>
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-pill border px-3 py-1 text-xs font-medium",
              category === "all" ? "bg-primary text-white border-primary" : "bg-white border-border"
            )}
          >
            All
          </button>
          {categories.map(([slug, name]) => (
            <button
              key={slug}
              onClick={() => setCategory(slug)}
              className={cn(
                "rounded-pill border px-3 py-1 text-xs font-medium",
                category === slug ? "bg-primary text-white border-primary" : "bg-white border-border"
              )}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((i) => (
          <div key={i.id} className="space-y-1">
            <ResourceCard resource={i.resource} />
            <p className="text-xs text-text-muted text-right">Saved {timeAgo(i.saved_at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
