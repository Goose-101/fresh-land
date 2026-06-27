import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-side photo upload to Supabase storage. Browser-to-Supabase storage
// connections were hanging on the user's network, so we relay the upload
// through this endpoint. The browser does one fast fetch() to our own
// Vercel function, which then uploads to Supabase using a reliable
// server-to-server connection.
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "not signed in" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "no file provided" }, { status: 400 });
    }

    const blob = file as File;
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB cap on the server too
    if (blob.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `file too large (${Math.round(blob.size / 1024)} KB, max 10 MB)` },
        { status: 400 }
      );
    }

    const path = `${authUser.id}/${Date.now()}.jpg`;
    const arrayBuffer = await blob.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from("community-photos")
      .upload(path, arrayBuffer, {
        contentType: blob.type || "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json(
        { error: uploadErr.message },
        { status: 500 }
      );
    }

    const { data: pub } = supabase.storage
      .from("community-photos")
      .getPublicUrl(path);

    return NextResponse.json({ url: pub.publicUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "server error" },
      { status: 500 }
    );
  }
}

// Allow larger request bodies for photo uploads.
export const runtime = "nodejs";
export const maxDuration = 60;
