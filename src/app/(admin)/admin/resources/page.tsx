import { createClient } from "@/lib/supabase/server";
import { AdminResourcesClient } from "./AdminResourcesClient";

export const metadata = { title: "Admin · Resources — Fresh Land" };

export default async function AdminResourcesPage() {
  const supabase = await createClient();
  const [{ data: resources }, { data: categories }] = await Promise.all([
    supabase
      .from("resources")
      .select("*, category:categories(*)")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("display_order"),
  ]);
  return (
    <AdminResourcesClient
      initialResources={resources || []}
      categories={categories || []}
    />
  );
}
