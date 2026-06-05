import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoriesRaw = searchParams.get("categories");
  const city = searchParams.get("city");
  const limit = Number(searchParams.get("limit") || 5);
  const supabase = await createClient();

  let q = supabase
    .from("resources")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("google_rating", { ascending: false, nullsFirst: false });

  if (categoriesRaw) {
    const slugs = categoriesRaw.split(",").filter(Boolean);
    if (slugs.length) {
      const { data: cats } = await supabase.from("categories").select("id").in("slug", slugs);
      const ids = (cats || []).map((c) => c.id);
      if (ids.length) q = q.in("category_id", ids);
    }
  }
  if (city) q = q.eq("city", city);

  const { data } = await q.limit(limit);
  return NextResponse.json({ resources: data || [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = await createClient();

  if (body.action === "flag") {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("notifications").insert({
      user_id: user?.id,
      type: "flag",
      title: "Flag received",
      message: `Thanks for flagging. Reason: ${body.reason}`,
    }).throwOnError().then(() => {}, () => {});
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
