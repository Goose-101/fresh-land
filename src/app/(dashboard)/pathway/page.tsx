import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PathwayClient } from "@/components/pathway/PathwayClient";

export const metadata = { title: "My Pathway — Fresh Land" };

export default async function PathwayPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const [{ data: profile }, { data: categories }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", authUser.id).single(),
    supabase.from("categories").select("id, slug").eq("is_active", true),
  ]);

  const firstName =
    (profile?.full_name || "").trim().split(/\s+/)[0] || "Friend";
  const categoryIdBySlug: Record<string, string> = {};
  for (const c of categories || []) categoryIdBySlug[c.slug] = c.id;

  return (
    <PathwayClient userName={firstName} categoryIdBySlug={categoryIdBySlug} />
  );
}