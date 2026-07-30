import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Save a resource for the signed-in user. Runs server-side so the login
// session is read from cookies (reliable) instead of depending on the browser
// being able to read the session locally.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const resourceId = (body as { resourceId?: string }).resourceId;
  if (!resourceId) {
    return NextResponse.json({ error: "resourceId required" }, { status: 400 });
  }

  // Idempotent: a duplicate save is a no-op, not an error.
  const { error } = await supabase
    .from("saved_resources")
    .upsert(
      { user_id: user.id, resource_id: resourceId },
      { onConflict: "user_id,resource_id", ignoreDuplicates: true }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, saved: true });
}

// Remove a saved resource for the signed-in user.
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get("resourceId");
  if (!resourceId) {
    return NextResponse.json({ error: "resourceId required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("saved_resources")
    .delete()
    .eq("user_id", user.id)
    .eq("resource_id", resourceId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort save-count decrement; never fail the request on this.
  await supabase.rpc("decrement_save_count", { r_id: resourceId }).then(
    () => {},
    () => {}
  );

  return NextResponse.json({ ok: true, saved: false });
}
