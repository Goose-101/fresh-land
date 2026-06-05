"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import type { Category, Resource } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ResourceGrid } from "./ResourceGrid";
import { haversineDistance } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { useT } from "@/components/I18nProvider";

type Props = {
  resources: Resource[];
  categories: Category[];
  initialCategory?: string;
};

const CITIES = ["Atlanta", "Clarkston", "Norcross", "Decatur", "Marietta"];
const CITY_COORDS: Record<string, [number, number]> = {
  Atlanta: [33.749, -84.388],
  Clarkston: [33.8135, -84.2395],
  Norcross: [33.9412, -84.2135],
  Decatur: [33.7748, -84.2963],
  Marietta: [33.9526, -84.5499],
};
const LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "am", label: "አማርኛ" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "so", label: "Somali" },
  { code: "vi", label: "Tiếng Việt" },
];

export function ResourceFilter({ resources, categories, initialCategory }: Props) {
  const { user } = useAppStore();
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory || "all");
  const [showFilters, setShowFilters] = useState(false);
  const [city, setCity] = useState(user?.city || "Atlanta");
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [sort, setSort] = useState<"distance" | "rating" | "reviews">("distance");
  const [langs, setLangs] = useState<string[]>([]);
  const [walkIn, setWalkIn] = useState(false);
  const [weekend, setWeekend] = useState(false);
  const [evening, setEvening] = useState(false);
  const [phoneIntake, setPhoneIntake] = useState(false);
  const [freeOnly, setFreeOnly] = useState(true);
  const [undocFriendly, setUndocFriendly] = useState(true);

  useEffect(() => {
    setCity(user?.city || "Atlanta");
  }, [user?.city]);

  const activeCoords: [number, number] =
    userCoords || CITY_COORDS[city] || CITY_COORDS.Atlanta;

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUserCoords([p.coords.latitude, p.coords.longitude]),
      () => {}
    );
  };

  const toggleLang = (c: string) =>
    setLangs((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = resources
      .map((r) => ({
        ...r,
        distance:
          r.latitude && r.longitude
            ? haversineDistance(activeCoords[0], activeCoords[1], r.latitude, r.longitude)
            : undefined,
      }))
      .filter((r) => {
        if (category !== "all" && r.category?.slug !== category) return false;
        if (q && !`${r.name} ${r.description}`.toLowerCase().includes(q)) return false;
        if (freeOnly && !r.is_free) return false;
        if (undocFriendly && !r.serves_undocumented) return false;
        if (walkIn && !r.walk_in_available) return false;
        if (weekend && !r.weekend_hours) return false;
        if (evening && !r.evening_hours) return false;
        if (phoneIntake && !r.phone_intake) return false;
        if (langs.length && !r.languages.some((l) => langs.includes(l))) return false;
        return true;
      });

    if (sort === "distance") {
      list.sort((a, b) => (a.distance ?? 9e9) - (b.distance ?? 9e9));
    } else if (sort === "rating") {
      list.sort((a, b) => (b.google_rating ?? 0) - (a.google_rating ?? 0));
    } else if (sort === "reviews") {
      list.sort((a, b) => (b.google_review_count ?? 0) - (a.google_review_count ?? 0));
    }
    return list;
  }, [resources, query, category, activeCoords, sort, langs, walkIn, weekend, evening, phoneIntake, freeOnly, undocFriendly]);

  const activeFilterCount =
    langs.length +
    [walkIn, weekend, evening, phoneIntake].filter(Boolean).length +
    (freeOnly ? 0 : 1) +
    (undocFriendly ? 0 : 1);

  const clearAll = () => {
    setLangs([]);
    setWalkIn(false);
    setWeekend(false);
    setEvening(false);
    setPhoneIntake(false);
    setFreeOnly(true);
    setUndocFriendly(true);
  };

  const sortLabel =
    sort === "distance" ? t("resources.sortedNearest", { city }) :
    sort === "rating" ? t("resources.sortedRating") :
    t("resources.sortedReviews");

  const categoryLabel = category !== "all" ? t(`category.${category}`) : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            className="pl-9"
            placeholder={t("resources.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4" />
          {t("resources.filters")}
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-pill bg-primary text-white text-xs px-1.5">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {[{ slug: "all" } as { slug: string }, ...categories].map((c) => {
          const active = category === c.slug;
          const label = c.slug === "all" ? t("resources.all") : t(`category.${c.slug}`);
          return (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={cn(
                "whitespace-nowrap rounded-pill px-4 py-1.5 text-sm font-medium transition border",
                active
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-border text-text-secondary hover:bg-slate-50"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {category === "all" && (
        <CategoryTileGrid
          categories={categories}
          onSelect={(slug) => setCategory(slug)}
        />
      )}

      {category !== "all" && (
        <SelectedCategoryHero
          category={categories.find((c) => c.slug === category)}
        />
      )}

      {showFilters && (
        <div className="bg-white rounded-card border border-border p-5 animate-fade-in space-y-5">
          <div>
            <div className="label mb-2">{t("resources.sortByDistance")}</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCity(c); setUserCoords(null); }}
                  className={cn(
                    "rounded-pill border px-3 py-1.5 text-xs font-medium",
                    city === c && !userCoords
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-border text-text-secondary"
                  )}
                >
                  {c}
                </button>
              ))}
              <button
                onClick={useMyLocation}
                className={cn(
                  "rounded-pill border px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1",
                  userCoords ? "bg-primary text-white border-primary" : "bg-white border-border"
                )}
              >
                <MapPin className="h-3 w-3" /> {t("resources.useMyLocation")}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { k: "distance", l: t("resources.nearestFirst") },
                { k: "rating", l: t("resources.topRated") },
                { k: "reviews", l: t("resources.mostReviewed") },
              ].map((s) => (
                <button
                  key={s.k}
                  onClick={() => setSort(s.k as typeof sort)}
                  className={cn(
                    "rounded-pill border px-3 py-1.5 text-xs font-medium",
                    sort === s.k ? "bg-primary-light border-primary text-primary-dark" : "bg-white border-border"
                  )}
                >
                  {s.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label mb-2">{t("resources.langSpoken")}</div>
            <div className="flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => toggleLang(l.code)}
                  className={cn(
                    "rounded-pill border px-3 py-1.5 text-xs font-medium",
                    langs.includes(l.code) ? "bg-primary text-white border-primary" : "bg-white border-border"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label mb-2">{t("resources.availability")}</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { k: walkIn, s: setWalkIn, l: t("resources.walkIn") },
                { k: weekend, s: setWeekend, l: t("resources.weekend") },
                { k: evening, s: setEvening, l: t("resources.evening") },
                { k: phoneIntake, s: setPhoneIntake, l: t("resources.phoneIntake") },
              ].map((c, i) => (
                <button
                  key={i}
                  onClick={() => c.s(!c.k)}
                  className={cn(
                    "rounded-pill border px-3 py-1.5 text-xs font-medium",
                    c.k ? "bg-primary text-white border-primary" : "bg-white border-border"
                  )}
                >
                  {c.l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />
                {t("resources.freeOnly")}
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={undocFriendly} onChange={(e) => setUndocFriendly(e.target.checked)} />
                {t("resources.undocFriendly")}
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button variant="ghost" onClick={clearAll}>
              <X className="h-4 w-4" /> {t("action.clearAll")}
            </Button>
            <Button variant="primary" onClick={() => setShowFilters(false)} className="ml-auto">
              {t("action.apply")}
            </Button>
          </div>
        </div>
      )}

      <div className="text-sm text-text-secondary">
        {t("resources.showing", { count: filtered.length })}
        {category !== "all" && <> {t("resources.inCategory", { category: categoryLabel })}</>}{" · "}
        {sortLabel}
      </div>

      <ResourceGrid resources={filtered} />
    </div>
  );
}

function CategoryTileGrid({
  categories,
  onSelect,
}: {
  categories: Category[];
  onSelect: (slug: string) => void;
}) {
  const { t } = useT();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-6">
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.slug)}
          className="group text-left"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-slate-100">
            {c.image_url ? (
              <Image
                src={c.image_url}
                alt={c.image_alt || c.name}
                fill
                sizes="(min-width:1024px) 20vw, (min-width:640px) 33vw, 50vw"
                className="object-cover group-hover:opacity-90 transition-opacity"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-text-muted text-xs">
                No image yet
              </div>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-text group-hover:text-primary-dark group-hover:underline">
            {t(`category.${c.slug}`, undefined, c.name)}
          </p>
        </button>
      ))}
    </div>
  );
}

function SelectedCategoryHero({ category }: { category: Category | undefined }) {
  const { t } = useT();
  if (!category?.image_url) return null;
  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-white">
      <div className="relative aspect-[21/8]">
        <Image
          src={category.image_url}
          alt={category.image_alt || category.name}
          fill
          sizes="100vw"
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="text-xs uppercase tracking-wider opacity-90">
            {t("resources.category", undefined, "Category")}
          </p>
          <p className="text-xl font-semibold drop-shadow">
            {t(`category.${category.slug}`, undefined, category.name)}
          </p>
          {category.description && (
            <p className="text-sm opacity-95 mt-0.5 line-clamp-2 drop-shadow">
              {category.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
