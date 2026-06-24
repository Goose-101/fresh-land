import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  // Pre-fetch the profile server-side so the client renders with data already
  // populated — no spinner, no empty form, no client-side hang risk.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  // If the profile row doesn't exist yet, fall back to a minimal one built from
  // the auth user so the form still has the user's name/email pre-filled.
  const initialProfile = profile || {
    id: authUser.id,
    full_name:
      (authUser.user_metadata?.full_name as string)?.trim() ||
      (authUser.user_metadata?.name as string)?.trim() ||
      authUser.email?.split("@")[0] ||
      "",
    email: authUser.email || "",
    avatar_url: null,
  };

  return (
    <SettingsClient
      initialProfile={initialProfile}
      initialEmail={authUser.email || ""}
    />
  );
}
