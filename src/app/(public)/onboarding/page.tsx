"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { LanguageStep } from "@/components/onboarding/LanguageStep";
import { LocationStep } from "@/components/onboarding/LocationStep";
import { NeedsStep } from "@/components/onboarding/NeedsStep";
import { useAppStore } from "@/store";
import { useT } from "@/components/I18nProvider";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, setUser, setCurrentLanguage } = useAppStore();
  const { t } = useT();
  const [allowed, setAllowed] = useState(false);
  const [step, setStep] = useState(1);

  // Require an explicit "start=1" intent to be here. Without it, send the user
  // back to the homepage so reloads + bookmarks don't drop them mid-flow.
  // Once we've seen the intent, strip it from the URL so a future reload
  // also bounces back to the homepage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (params.get("start") === "1") {
      window.history.replaceState({}, "", "/onboarding");
      setAllowed(true);
    } else {
      router.replace("/");
    }
  }, [params, router]);
  const [language, setLanguage] = useState(user?.preferred_language || "en");
  const [city, setCity] = useState(user?.city || "Atlanta");
  const [needs, setNeeds] = useState<string[]>(user?.needs || []);
  const [saving, setSaving] = useState(false);

  const total = 4;

  const next = async () => {
    if (step === 1) {
      setCurrentLanguage(language);
      document.cookie = `language=${language};path=/;max-age=31536000`;
    }
    setStep(step + 1);
  };

  const finish = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push("/login");
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .update({
        preferred_language: language,
        city,
        needs,
        onboarding_complete: true,
      })
      .eq("id", authUser.id)
      .select()
      .single();
    if (data) setUser(data);
    router.push("/dashboard");
    router.refresh();
  };

  const firstName = user?.full_name?.split(" ")[0];

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="py-5 px-4 sm:px-6 max-w-3xl mx-auto w-full">
        <Logo />
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pb-16">
        <div className="mb-6">
          <div className="flex gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-pill ${i < step ? "bg-primary" : "bg-slate-200"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-text-muted label">{t("onboarding.stepOf", { step, total })}</p>
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-semibold mb-2">{t("onboarding.welcome")}</h1>
            <p className="text-text-secondary mb-6">{t("onboarding.whichLang")}</p>
            <LanguageStep value={language} onChange={setLanguage} />
            <div className="mt-8 flex justify-end">
              <Button onClick={next}>{t("action.continue")} <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-semibold mb-2">{t("onboarding.whereTitle")}</h1>
            <p className="text-text-secondary mb-6">{t("onboarding.whereBody")}</p>
            <LocationStep value={city} onChange={setCity} />
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>{t("action.back")}</Button>
              <Button onClick={next} disabled={!city.trim()}>{t("action.continue")} <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-semibold mb-2">{t("onboarding.needsTitle")}</h1>
            <p className="text-text-secondary mb-6">{t("onboarding.needsBody")}</p>
            <NeedsStep value={needs} onChange={setNeeds} />
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>{t("action.back")}</Button>
              <Button onClick={next} disabled={!needs.length}>{t("action.continue")} <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary-light grid place-items-center mb-5">
              <CheckCircle2 className="h-9 w-9 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold mb-2">
              {firstName ? t("onboarding.allSetNamed", { name: firstName }) : t("onboarding.allSet")}
            </h1>
            <p className="text-text-secondary max-w-md mx-auto mb-6">
              {t("onboarding.allSetBody")}
            </p>
            <Button size="lg" onClick={finish} loading={saving}>
              {t("onboarding.goDashboard")} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
