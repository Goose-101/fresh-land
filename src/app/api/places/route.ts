import { NextResponse } from "next/server";
import { getPlaceDetails, syncResourceWithGoogle } from "@/lib/google-places";
import { createClient } from "@/lib/supabase/server";
import {
  placesLimiter,
  checkLimit,
  getClientId,
  rateLimitHeaders,
} from "@/lib/rate-limit";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rl = await checkLimit(placesLimiter, getClientId(req, user?.id));
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId");
  if (!placeId) return NextResponse.json({ error: "placeId required" }, { status: 400 });
  const details = await getPlaceDetails(placeId);
  return NextResponse.json({ details }, { headers: rateLimitHeaders(rl) });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { resourceId, placeId } = await req.json();
  if (!resourceId || !placeId) {
    return NextResponse.json({ error: "resourceId and placeId required" }, { status: 400 });
  }

  await syncResourceWithGoogle(resourceId, placeId);
  return NextResponse.json({ ok: true });
}
