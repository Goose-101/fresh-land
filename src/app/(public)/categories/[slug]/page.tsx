import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResourceFilter } from "@/components/resources/ResourceFilter";
import { getServerMessages, resolveKey } from "@/lib/i18n";
import { DisclaimerBanner, categoryDisclaimerKind } from "@/components/ui/DisclaimerBanner";
import type { Resource, Category } from "@/types";

// Always fetch fresh so new resources added in Supabase show up immediately.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { messages } = await getServerMessages();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const [{ data: resources }, { data: categories }] = await Promise.all([
    supabase
      .from("resources")
      .select("*, category:categories(*)")
      .eq("category_id", category.id)
      .eq("is_active", true),
    supabase.from("categories").select("*").eq("is_active", true).order("display_order"),
  ]);

  const translatedName = resolveKey(messages, `category.${category.slug}`, category.name);
  const disclaimerKind = categoryDisclaimerKind(category.slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold" style={{ color: category.color || "#059669" }}>
          {translatedName}
        </h1>
        {category.description && (
          <p className="text-text-secondary mt-1">{category.description}</p>
        )}
      </div>
      {disclaimerKind && (
        <DisclaimerBanner kind={disclaimerKind} messages={messages} className="mb-6" />
      )}
      <ResourceFilter
        resources={(resources || []) as Resource[]}
        categories={(categories || []) as Category[]}
        initialCategory={category.slug}
      />
    </div>
  );
}
