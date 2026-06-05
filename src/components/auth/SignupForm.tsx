"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "./GoogleButton";
import { passwordStrength, cn } from "@/lib/utils";
import { useT } from "@/components/I18nProvider";

export function SignupForm() {
  const router = useRouter();
  const { t } = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = pw ? passwordStrength(pw) : null;
  const strengthLabel =
    strength === "weak" ? t("auth.strengthWeak") :
    strength === "medium" ? t("auth.strengthMedium") :
    strength === "strong" ? t("auth.strengthStrong") : "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) return setErr(t("auth.passwordShort"));
    if (pw !== pw2) return setErr(t("auth.passwordMismatch"));

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        setErr(t("auth.emailTaken"));
      } else {
        setErr(error.message);
      }
      return;
    }
    // If the user is already confirmed (e.g. email confirmation disabled in
    // Supabase), skip the verify step and go straight to onboarding.
    if (data.user?.email_confirmed_at) {
      router.push("/onboarding?start=1");
      router.refresh();
      return;
    }
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input label={t("auth.fullName")} value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label={t("auth.email")} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <div>
        <Input
          label={t("auth.password")}
          type="password"
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
          minLength={8}
        />
        {strength && (
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <div className="flex gap-0.5 flex-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-pill",
                    strength === "weak" && i === 1 && "bg-error",
                    strength === "medium" && i <= 2 && "bg-warning",
                    strength === "strong" && "bg-primary",
                    !((strength === "weak" && i === 1) ||
                      (strength === "medium" && i <= 2) ||
                      strength === "strong") && "bg-slate-200"
                  )}
                />
              ))}
            </div>
            <span
              className={cn(
                strength === "weak" && "text-error",
                strength === "medium" && "text-warning",
                strength === "strong" && "text-primary"
              )}
            >
              {strengthLabel}
            </span>
          </div>
        )}
      </div>
      <Input
        label={t("auth.confirmPassword")}
        type="password"
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
        required
      />
      {err && <p className="text-sm text-error">{err}</p>}

      <Button type="submit" variant="primary" fullWidth loading={loading}>
        {t("action.signUp")}
      </Button>

      <div className="flex items-center gap-3 text-xs text-text-muted">
        <div className="h-px flex-1 bg-border" />
        {t("auth.orDivider")}
        <div className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton />

      <p className="text-xs text-text-muted leading-relaxed mt-2">
        {t("auth.privacyNote")}
      </p>
      <p className="text-sm text-center mt-2">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          {t("action.signIn")}
        </Link>
      </p>
    </form>
  );
}
