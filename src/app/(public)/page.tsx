import Link from "next/link";
import { Search, MapPin, CheckCircle2, Mic, Scale, Home, Briefcase, Heart, BookOpen, DollarSign, AlertCircle, Users, Phone, Trees, Bus, UtensilsCrossed, Baby, Church, Library, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LiveUsersBadge } from "@/components/LiveUsersBadge";
import { createClient } from "@/lib/supabase/server";
import { getServerMessages } from "@/lib/i18n";
import { resolveKey, formatMessage } from "@/lib/i18n-utils";
import type { Resource, Category } from "@/types";

const CATEGORY_ICONS: Record<string, any> = {
  legal: Scale,
  housing: Home,
  employment: Briefcase,
  healthcare: Heart,
  education: BookOpen,
  financial: DollarSign,
  emergency: AlertCircle,
  community: Users,
  parks: Trees,
  transportation: Bus,
  food: UtensilsCrossed,
  family: Baby,
  faith: Church,
  libraries: Library,
  womens: HeartHandshake,
};

// Always fetch fresh so new resources show up immediately.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const { messages } = await getServerMessages();
  const t = (key: string, vars?: Record<string, string | number>) =>
    formatMessage(resolveKey(messages, key), vars);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let needsOnboarding = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();
    needsOnboarding = !profile?.onboarding_complete;
  }

  const [{ data: categories }, { data: featured }, { data: counts }] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("display_order"),
    supabase.from("resources").select("*, category:categories(*)").eq("is_featured", true).eq("is_active", true).limit(3),
    supabase.from("resources").select("category_id").eq("is_active", true),
  ]);

  const catCounts = (counts || []).reduce<Record<string, number>>((acc, r: any) => {
    if (r.category_id) acc[r.category_id] = (acc[r.category_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-light via-white to-white pt-10 pb-16 sm:pt-16 sm:pb-24">
        <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 hero-glow pointer-events-none" aria-hidden />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <LiveUsersBadge
            template={resolveKey(messages, "home.liveUsers", "{count} people exploring right now")}
          />
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            <span className="text-gradient">{t("home.tagline")}</span>
          </h1>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            {t("home.subtagline")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {needsOnboarding ? (
              <Link href="/onboarding?start=1">
                <Button size="lg">{t("action.continueSetup")}</Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg">{t("action.getStarted")}</Button>
              </Link>
            )}
            <Link href="/resources">
              <Button variant="outline" size="lg">{t("action.browse")}</Button>
            </Link>
          </div>
          <p className="mt-5 text-xs text-text-muted">{t("home.languageLine")}</p>
          <LanguageSwitcher />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-semibold text-center mb-10">{t("home.howItWorks")}</h2>
        <div className="grid md:grid-cols-3 gap-6 md:gap-4 relative">
          <div className="hidden md:block absolute top-8 left-1/6 right-1/6 border-t-2 border-dashed border-border" />
          {[
            { n: 1, Icon: Search, title: t("home.step1Title"), text: t("home.step1Body") },
            { n: 2, Icon: MapPin, title: t("home.step2Title"), text: t("home.step2Body") },
            { n: 3, Icon: CheckCircle2, title: t("home.step3Title"), text: t("home.step3Body") },
          ].map((s) => (
            <div key={s.n} className="relative z-10 bg-white rounded-card border border-border p-6 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-primary-light grid place-items-center text-primary font-semibold">
                {s.n}
              </div>
              <s.Icon className="h-6 w-6 text-primary mx-auto mt-3" />
              <h3 className="font-semibold mt-2">{s.title}</h3>
              <p className="text-sm text-text-secondary mt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">{t("home.needHelp")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(categories || []).map((c: Category) => {
            const Icon = CATEGORY_ICONS[c.slug] || Users;
            const translatedName = resolveKey(messages, `category.${c.slug}`, c.name);
            return (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="group bg-white rounded-card border border-border p-5 hover:border-primary hover:shadow-card transition"
              >
                <div
                  className="h-11 w-11 rounded-btn grid place-items-center mb-3"
                  style={{ backgroundColor: `${c.color}15`, color: c.color || "#059669" }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm group-hover:text-primary-dark">{translatedName}</h3>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{c.description}</p>
                <p className="text-xs text-text-muted mt-2">
                  {t("home.resourcesCount", { count: catCounts[c.id] || 0 })}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {(featured?.length ?? 0) > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <h2 className="text-2xl font-semibold mb-6">{t("home.topResources")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(featured as Resource[]).map((r) => (
              <ResourceCard key={r.id} resource={r} showDistance={false} />
            ))}
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-primary-light border border-primary/20 rounded-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5">
          <div className="h-14 w-14 rounded-full bg-primary grid place-items-center text-white shrink-0">
            <Mic className="h-7 w-7" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-semibold text-primary-dark">{t("home.aiTitle")}</h3>
            <p className="text-sm text-text-secondary mt-1">{t("home.aiBody")}</p>
          </div>
        </div>
      </section>

      <section className="bg-orange-50 border-y border-orange-200 py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-3 text-orange-900">
          <Phone className="h-5 w-5" />
          <p className="text-sm font-medium">{t("home.emergency")}</p>
        </div>
      </section>
    </>
  );
}
