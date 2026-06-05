"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "./GoogleButton";
import { useT } from "@/components/I18nProvider";

export function LoginForm() {
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("email")) {
        setErr(t("auth.confirmEmail"));
      } else {
        setErr(t("auth.invalidCreds"));
      }
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label={t("auth.email")}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div className="relative">
        <Input
          label={t("auth.password")}
          type={show ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-[38px] text-text-muted"
          aria-label={show ? t("auth.hidePw") : t("auth.showPw")}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {err && <p className="text-sm text-error">{err}</p>}
      <Button type="submit" variant="primary" fullWidth loading={loading}>
        {t("auth.signInButton")}
      </Button>

      <div className="flex items-center gap-3 text-xs text-text-muted">
        <div className="h-px flex-1 bg-border" />
        {t("auth.orDivider")}
        <div className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton />

      <div className="flex items-center justify-between text-sm mt-2">
        <Link href="/forgot-password" className="text-primary hover:underline">
          {t("auth.forgot")}
        </Link>
        <Link href="/signup" className="text-text-secondary hover:underline">
          {t("action.signUp")}
        </Link>
      </div>
    </form>
  );
}
