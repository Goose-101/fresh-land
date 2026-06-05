import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Heart, BookMarked, Sparkles, Bell, Calendar } from "lucide-react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Button } from "@/components/ui/Button";
import { PathwayReminderBadge } from "@/components/pathway/PathwayReminderBadge";
import { differenceInDays } from "date-fns";
import { getServerMessages, resolveKey, formatMessage } from "@/lib/i18n";
import type { Resource } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { messages, lang } = await getServerMessages();
  const t = (key: string, vars?: Record<string, string | number>) =>
    formatMessage(resolveKey(messages, key), vars);

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const [
    { data: profile },
    { count: savedCount },
    { data: savedPreview },
    { data: notifs },
    { data: newResources },
    { data: progress },
    { data: pathway },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authUser.id).single(),
    supabase.from("saved_resources").select("id", { count: "exact", head: true }).eq("user_id", authUser.id),
    supabase
      .from("saved_resources")
      .select("id, saved_at, resource:resources(*, category:categories(*))")
      .eq("user_id", authUser.id)
      .order("saved_at", { ascending: false })
      .limit(3),
    supabase.from("notifications").select("*").eq("user_id", authUser.id).eq("is_read", false).order("created_at", { ascending: false }).limit(3),
    supabase
      .from("resources")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("user_progress").select("id", { count: "exact", head: true }).eq("user_id", authUser.id),
    supabase.from("pathways").select("*, steps:pathway_steps(*)").eq("is_active", true).limit(1).maybeSingle(),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] || t("dashboard.fallbackName");
  const daysOn = profile?.created_at ? differenceInDays(new Date(), new Date(profile.created_at)) : 0;
  const stepsDone = (progress as any)?.count || 0;
  const totalSteps = pathway?.steps?.length || 0;
  const pathwayProgress = totalSteps ? Math.round((stepsDone / totalSteps) * 100) : 0;

  const h = new Date().getHours();
  const greeting = h < 12 ? t("dashboard.morning") : h < 18 ? t("dashboard.afternoon") : t("dashboard.evening");

  const today = new Date().toLocaleDateString(lang, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto p-5 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">{t("dashboard.greeting", { greeting, name: firstName })}</h1>
        <p className="text-text-secondary text-sm mt-1">{today}</p>
      </div>

      {pathway && (
        <Link
          href="/pathway"
          className="relative block bg-gradient-to-br from-primary to-primary-dark text-white rounded-card p-6 hover:shadow-modal transition"
        >
          <PathwayReminderBadge />
          <div className="flex items-center gap-2 text-primary-light/90 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            {t("dashboard.yourPathway")}
          </div>
          <h2 className="text-2xl font-semibold mt-2">{pathway.title}</h2>
          <p className="text-sm text-primary-light/90 mt-1">
            {t("dashboard.stepsOf", { done: stepsDone, total: totalSteps })}
          </p>
          <div className="mt-4 h-2 bg-white/20 rounded-pill overflow-hidden">
            <div className="h-full bg-white rounded-pill" style={{ width: `${pathwayProgress}%` }} />
          </div>
          <div className="mt-4">
            <span className="inline-block bg-white text-primary-dark rounded-btn px-4 py-2 text-sm font-semibold">
              {t("dashboard.continue")}
            </span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("dashboard.statSaved"), value: savedCount || 0, Icon: Heart },
          { label: t("dashboard.statSteps"), value: stepsDone, Icon: BookMarked },
          { label: t("dashboard.statDays"), value: Math.max(1, daysOn), Icon: Calendar },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-card border border-border p-4 text-center">
            <s.Icon className="h-5 w-5 text-primary mx-auto" />
            <p className="text-2xl font-semibold mt-1">{s.value}</p>
            <p className="label mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {t("dashboard.savedSection")}
            {savedCount ? <span className="ml-2 text-sm font-normal text-text-muted">({savedCount})</span> : null}
          </h2>
          <Link href="/saved" className="text-sm text-primary hover:underline">
            {t("action.viewAll")} →
          </Link>
        </div>
        {savedPreview?.length ? (
          <div className="grid md:grid-cols-3 gap-4">
            {(savedPreview as any[]).map((s) => (
              <ResourceCard key={s.id} resource={s.resource} showDistance={false} compact />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-card border border-dashed border-border p-6 text-center">
            <p className="text-sm text-text-secondary">{t("dashboard.noSaved")}</p>
            <Link href="/resources" className="mt-3 inline-block">
              <Button variant="primary" size="sm">{t("action.browse")}</Button>
            </Link>
          </div>
        )}
      </section>

      {notifs && notifs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> {t("dashboard.notifications")}
          </h2>
          <div className="bg-white rounded-card border border-border divide-y divide-border">
            {notifs.map((n) => (
              <div key={n.id} className="p-4">
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-xs text-text-secondary mt-1">{n.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("dashboard.newNear")}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(newResources as Resource[] || []).map((r) => (
            <ResourceCard key={r.id} resource={r} showDistance={false} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
