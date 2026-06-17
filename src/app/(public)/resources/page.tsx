import { createClient } from "@/lib/supabase/server";
import { ResourceFilter } from "@/components/resources/ResourceFilter";
import { getServerMessages, resolveKey, formatMessage } from "@/lib/i18n";
import type { Resource, Category } from "@/types";

// Always fetch fresh data so new resources show up immediately after being
// added in Supabase — no rebuild needed.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Resources — Fresh Land" };

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { messages } = await getServerMessages();
  const t = (key: string, vars?: Record<string, string | number>) =>
    formatMessage(resolveKey(messages, key), vars);

  const [{ data: resources }, { data: categories }] = await Promise.all([
    supabase
      .from("resources")
      .select("*, category:categories(*)")
      .eq("is_active", true),
    supabase.from("categories").select("*").eq("is_active", true).order("display_order"),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">{t("resources.pageTitle")}</h1>
        <p className="text-text-secondary mt-1">
          {t("resources.pageBody")}
        </p>
      </div>
      <ResourceFilter
        resources={(resources || []) as Resource[]}
        categories={(categories || []) as Category[]}
        initialCategory={params.category}
      />
    </div>
  );
}
