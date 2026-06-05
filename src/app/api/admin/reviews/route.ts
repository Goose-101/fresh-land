import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401 } as const;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return { ok: false, status: 403 } as const;
  return { ok: true, userId: user.id } as const;
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get("resourceId");
  if (!resourceId) return NextResponse.json({ error: "resourceId required" }, { status: 400 });

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("resource_reviews")
    .select("*")
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data || [] });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const body = await req.json();
  const {
    resourceId,
    authorName,
    authorPhotoUrl,
    rating,
    text,
    source,
    language,
  } = body as {
    resourceId: string;
    authorName: string;
    authorPhotoUrl?: string;
    rating: number;
    text: string;
    source: string;
    language?: string;
  };

  if (!resourceId || !authorName?.trim() || !text?.trim()) {
    return NextResponse.json({ error: "resourceId, authorName, text required" }, { status: 400 });
  }
  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("resource_reviews")
    .insert({
      resource_id: resourceId,
      author_name: authorName.trim(),
      author_photo_url: authorPhotoUrl || null,
      rating: Math.round(r),
      text: text.trim(),
      source: source || "manual",
      language: language || "en",
      is_approved: true,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = await createAdminClient();
  const { error } = await admin.from("resource_reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
