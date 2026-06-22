"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LanguageStep } from "@/components/onboarding/LanguageStep";
import { NeedsStep } from "@/components/onboarding/NeedsStep";
import { useT } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import {
  Loader2,
  LogIn,
  Sun,
  Moon,
  Monitor,
  Download,
  Shield,
  Sliders,
  Mail,
  Pause,
  Play,
  AlertTriangle,
} from "lucide-react";
import { LANGUAGES, type Theme, type NotificationPrefs, type PrivacyPrefs } from "@/types";

const TAB_KEYS = [
  "profile",
  "language",
  "notifications",
  "privacy",
  "accessibility",
  "account",
] as const;
type Tab = typeof TAB_KEYS[number];

const DEFAULT_NOTIF: Required<NotificationPrefs> = {
  channels: { email: true, sms: false, push: false },
  events: { newResources: true, events: true, digest: false, pathway: true, savedChanges: true },
  digestFrequency: "weekly",
  quietHours: { enabled: false, start: "22:00", end: "07:00" },
  categoryFilters: [],
};

const DEFAULT_PRIVACY: Required<PrivacyPrefs> = {
  communityVisible: true,
  anonymousPosting: false,
  hideFromSearch: false,
};

const FONT_SCALES = [
  { v: 0.9, k: "fontSmall" },
  { v: 1, k: "fontDefault" },
  { v: 1.125, k: "fontLarge" },
  { v: 1.25, k: "fontXLarge" },
];

export default function SettingsPage() {
  const {
    user,
    setUser,
    showToast,
    setCurrentLanguage,
    theme,
    setTheme,
    accessibility,
    setAccessibility,
  } = useAppStore();
  const { t, setLang } = useT();
  const tr = (key: string, fallback: string) => t(`settings.${key}`, undefined, fallback);

  const [tab, setTab] = useState<Tab>("profile");
  const [ready, setReady] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [householdSize, setHouseholdSize] = useState<number | "">("");
  const [childrenCount, setChildrenCount] = useState<number | "">("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [yearsInUs, setYearsInUs] = useState<number | "">("");
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([]);

  // Language
  const [language, setLanguage] = useState("en");

  // Needs
  const [needs, setNeeds] = useState<string[]>([]);

  // Notifications
  const [notif, setNotif] = useState<Required<NotificationPrefs>>(DEFAULT_NOTIF);

  // Privacy
  const [privacy, setPrivacy] = useState<Required<PrivacyPrefs>>(DEFAULT_PRIVACY);

  // Account
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [paused, setPaused] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const [saving, setSaving] = useState(false);

  // When user isn't in the Zustand store, check Supabase directly and self-heal.
  // Hard cap at 3 seconds — if Supabase doesn't respond, we proceed anyway with
  // a minimal user (constructed from auth metadata) so the UI never hangs.
  // The middleware already verified the user is signed in to reach this page,
  // so we can trust that and render the form.
  useEffect(() => {
    if (user) {
      setReady(true);
      return;
    }
    let cancelled = false;
    const supabase = createClient();

    // Failsafe: never let this page hang. After 3s, proceed regardless.
    const failsafe = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 3000);

    (async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!authUser) {
          clearTimeout(failsafe);
          setReady(true);
          return;
        }
        const fallbackName =
          (authUser.user_metadata?.full_name as string)?.trim() ||
          (authUser.user_metadata?.name as string)?.trim() ||
          authUser.email?.split("@")[0] ||
          "Member";

        // Set a minimal user immediately so the form renders even if the
        // profile query is slow.
        setUser({
          id: authUser.id,
          full_name: fallbackName,
          email: authUser.email || "",
          avatar_url: null,
          preferred_language: "en",
          city: "Atlanta",
          state: "GA",
          zip: null,
          needs: [],
          immigration_status: null,
          has_children: false,
          english_comfort: "medium",
          years_in_us: null,
          is_admin: false,
          onboarding_complete: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
        clearTimeout(failsafe);
        setReady(true);

        // Then fetch the real profile in the background.
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();
        if (cancelled) return;
        if (profile) {
          setUser(profile);
        }
      } catch {
        clearTimeout(failsafe);
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, [user, setUser]);

  useEffect(() => {
    if (!user) return;
    setName(user.full_name || "");
    setPreferredName(user.preferred_name || "");
    setPhone(user.phone || "");
    setSmsOptIn(!!user.phone_sms_opt_in);
    setCity(user.city || "");
    setZip(user.zip || "");
    setHouseholdSize(user.household_size ?? "");
    setChildrenCount(user.children_count ?? "");
    setCountryOfOrigin(user.country_of_origin || "");
    setYearsInUs(user.years_in_us ?? "");
    setLanguagesSpoken(user.languages_spoken || []);
    setLanguage(user.preferred_language || "en");
    setNeeds(user.needs || []);
    setNotif({ ...DEFAULT_NOTIF, ...(user.notification_prefs || {}) });
    setPrivacy({ ...DEFAULT_PRIVACY, ...(user.privacy_prefs || {}) });
    setPaused(!!user.is_paused);
  }, [user]);

  const tabLabels: Record<Tab, string> = {
    profile: t("settings.tabProfile"),
    language: t("settings.tabLanguage"),
    notifications: t("settings.tabNotifications"),
    privacy: tr("tabPrivacy", "Privacy"),
    accessibility: tr("tabAccessibility", "Accessibility"),
    account: t("settings.tabAccount"),
  };

  const save = async (payload: Record<string, any>) => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select()
      .single();
    setSaving(false);
    if (error) return showToast("error", t("settings.saveFail"));
    if (data) setUser(data);
    showToast("success", t("settings.savedOk"));
  };

  const onLanguageChange = async (code: string) => {
    setLanguage(code);
    setCurrentLanguage(code);
    if (user) {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .update({ preferred_language: code })
        .eq("id", user.id)
        .select()
        .single();
      if (data) setUser(data);
    }
    setLang(code);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const supabase = createClient();
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) return showToast("error", t("settings.uploadFail"));
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await save({ avatar_url: publicUrl });
  };

  const doDelete = async () => {
    if (!user || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        setDeleting(false);
        showToast("error", tr("deleteFailed", "Couldn't delete your account."));
        return;
      }
      window.location.href = "/";
    } catch {
      setDeleting(false);
      showToast("error", tr("deleteFailed", "Couldn't delete your account."));
    }
  };

  const toggleLangSpoken = (code: string) =>
    setLanguagesSpoken((prev) => (prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]));

  const setTheme_ = (next: Theme) => {
    setTheme(next);
    if (user) save({ theme: next });
  };

  const onChangeEmail = async () => {
    if (!newEmail) return;
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) return showToast("error", error.message);
    showToast("success", tr("emailChangeSent", "Check your new inbox to confirm."));
    setNewEmail("");
  };

  const onDownload = async () => {
    if (!user) return;
    const supabase = createClient();
    const [{ data: saved }, { data: notifs }] = await Promise.all([
      supabase.from("saved_resources").select("*").eq("user_id", user.id),
      supabase.from("notifications").select("*").eq("user_id", user.id),
    ]);
    const blob = new Blob(
      [JSON.stringify({ profile: user, saved, notifications: notifs }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freshland-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const togglePause = async () => {
    const next = !paused;
    setPaused(next);
    await save({ is_paused: next });
  };

  const sendTestEmail = async () => {
    setSendingTest(true);
    try {
      const res = await fetch("/api/email/test", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", json?.error || "Test email failed.");
      } else {
        showToast("success", "Test email sent — check your inbox.");
      }
    } finally {
      setSendingTest(false);
    }
  };

  if (!ready && !user) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center text-text-muted">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }

  // If we still don't have a user after ready, just keep showing the loader.
  // We won't reach this normally — the middleware blocks unsigned users from
  // /settings, and the effect above populates a minimal user. But keep it as
  // a safety net so we never flash a "Sign in" prompt at an actually-signed-in
  // user.
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center text-text-muted">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-5 md:p-8 space-y-6">
      <h1 className="text-3xl font-semibold">{t("settings.title")}</h1>

      <div className="flex gap-1 border-b border-border overflow-x-auto scrollbar-hide">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition",
              tab === key ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text"
            )}
          >
            {tabLabels[key]}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="space-y-4">
          <section className="bg-white rounded-card border border-border p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary-light text-primary-dark grid place-items-center font-semibold text-xl overflow-hidden">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  (preferredName || user.full_name || "U")[0]?.toUpperCase()
                )}
              </div>
              <label className="text-sm font-medium text-primary cursor-pointer hover:underline">
                {t("settings.changeAvatar")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                />
              </label>
            </div>

            <h2 className="label">{tr("sectionPersonal", "Personal info")}</h2>
            <Input label={t("auth.fullName")} value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label={tr("preferredName", "Preferred name")}
              hint={tr("preferredNameHint", "What should we call you?")}
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
            />
            <Input label={t("auth.email")} value={user.email || ""} disabled />
            <Input
              label={tr("phone", "Phone number")}
              hint={tr("phoneHint", "Used only for resource updates you opt into.")}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(404) 555-1234"
            />
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} />
              {tr("smsOptIn", "Allow text messages (SMS)")}
            </label>
          </section>

          <section className="bg-white rounded-card border border-border p-6 space-y-4">
            <h2 className="label">{tr("sectionContact", "Contact")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={t("settings.city")} value={city} onChange={(e) => setCity(e.target.value)} />
              <Input
                label={tr("zip", "ZIP code")}
                hint={tr("zipHint", "For accurate distance to services.")}
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="30307"
              />
            </div>
          </section>

          <section className="bg-white rounded-card border border-border p-6 space-y-4">
            <h2 className="label">{tr("sectionHousehold", "Household")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label={tr("householdSize", "Household size")}
                hint={tr("householdSizeHint", "How many people live with you, including yourself.")}
                type="number"
                min={1}
                value={householdSize}
                onChange={(e) => setHouseholdSize(e.target.value === "" ? "" : Number(e.target.value))}
              />
              <Input
                label={tr("childrenCount", "Number of children")}
                type="number"
                min={0}
                value={childrenCount}
                onChange={(e) => setChildrenCount(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </section>

          <section className="bg-white rounded-card border border-border p-6 space-y-4">
            <h2 className="label">{tr("sectionBackground", "Your background")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label={tr("countryOfOrigin", "Country of origin")}
                hint={tr("countryOfOriginHint", "Helps us tailor legal and cultural resources.")}
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
              />
              <Input
                label={tr("yearsInUs", "Years in the US")}
                type="number"
                min={0}
                value={yearsInUs}
                onChange={(e) => setYearsInUs(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div>
              <div className="label mb-2">{tr("languagesSpoken", "Languages I speak")}</div>
              <p className="text-xs text-text-muted mb-2">{tr("languagesSpokenHint", "Separate from the app's language — used to match resources.")}</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => toggleLangSpoken(l.code)}
                    className={cn(
                      "rounded-pill border px-3 py-1.5 text-xs font-medium",
                      languagesSpoken.includes(l.code)
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-border text-text-secondary"
                    )}
                  >
                    {l.nativeName}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="sticky bottom-4 flex justify-end">
            <Button
              loading={saving}
              onClick={() =>
                save({
                  full_name: name,
                  preferred_name: preferredName || null,
                  phone: phone || null,
                  phone_sms_opt_in: smsOptIn,
                  city,
                  zip: zip || null,
                  household_size: householdSize === "" ? null : householdSize,
                  children_count: childrenCount === "" ? null : childrenCount,
                  country_of_origin: countryOfOrigin || null,
                  years_in_us: yearsInUs === "" ? null : yearsInUs,
                  languages_spoken: languagesSpoken,
                })
              }
            >
              {t("action.saveChanges")}
            </Button>
          </div>
        </div>
      )}

      {tab === "language" && (
        <div className="bg-white rounded-card border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">{t("settings.langHeader")}</h2>
          <LanguageStep value={language} onChange={onLanguageChange} />
          {saving && (
            <p className="mt-3 text-xs text-text-muted inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> {t("settings.saving")}
            </p>
          )}
        </div>
      )}

      {tab === "notifications" && (
        <div className="space-y-4">
          <section className="bg-white rounded-card border border-border p-6 space-y-3">
            <h2 className="label">{tr("notifChannels", "How should we reach you?")}</h2>
            {[
              { k: "email", l: tr("channelEmail", "Email") },
              { k: "sms", l: tr("channelSms", "Text (SMS)") },
              { k: "push", l: tr("channelPush", "Push notifications") },
            ].map((c) => (
              <label key={c.k} className="flex items-center justify-between py-1.5">
                <span className="text-sm">{c.l}</span>
                <input
                  type="checkbox"
                  checked={!!notif.channels[c.k as keyof typeof notif.channels]}
                  onChange={(e) =>
                    setNotif({ ...notif, channels: { ...notif.channels, [c.k]: e.target.checked } })
                  }
                />
              </label>
            ))}
          </section>

          <section className="bg-white rounded-card border border-border p-6 space-y-3">
            <h2 className="label">{tr("notifEvents2", "What to notify me about")}</h2>
            {[
              { k: "newResources", l: t("settings.notifNewResources") },
              { k: "events", l: t("settings.notifEvents") },
              { k: "pathway", l: t("settings.notifPathway") },
              { k: "savedChanges", l: tr("notifSavedChanges", "Changes to my saved resources") },
              { k: "digest", l: t("settings.notifDigest") },
            ].map((c) => (
              <label key={c.k} className="flex items-center justify-between py-1.5">
                <span className="text-sm">{c.l}</span>
                <input
                  type="checkbox"
                  checked={!!notif.events[c.k as keyof typeof notif.events]}
                  onChange={(e) =>
                    setNotif({ ...notif, events: { ...notif.events, [c.k]: e.target.checked } })
                  }
                />
              </label>
            ))}
          </section>

          <section className="bg-white rounded-card border border-border p-6">
            <div className="label mb-3">{tr("digestFrequency", "Digest frequency")}</div>
            <div className="flex flex-wrap gap-2">
              {[
                { k: "daily", l: tr("digestDaily", "Daily") },
                { k: "weekly", l: tr("digestWeekly", "Weekly") },
                { k: "off", l: tr("digestOff", "Off") },
              ].map((o) => (
                <button
                  key={o.k}
                  type="button"
                  onClick={() => setNotif({ ...notif, digestFrequency: o.k as "daily" | "weekly" | "off" })}
                  className={cn(
                    "rounded-pill border px-3 py-1.5 text-xs font-medium",
                    notif.digestFrequency === o.k
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-border text-text-secondary"
                  )}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-card border border-border p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{tr("quietHours", "Quiet hours")}</h2>
              <input
                type="checkbox"
                checked={!!notif.quietHours.enabled}
                onChange={(e) => setNotif({ ...notif, quietHours: { ...notif.quietHours, enabled: e.target.checked } })}
              />
            </div>
            <p className="text-sm text-text-secondary">{tr("quietHoursBody", "We won't send you notifications during this window.")}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="label mb-1">{tr("quietFrom", "From")}</div>
                <input
                  type="time"
                  className="w-full px-3 py-2 rounded-btn border border-border text-sm bg-white"
                  value={notif.quietHours.start || "22:00"}
                  onChange={(e) => setNotif({ ...notif, quietHours: { ...notif.quietHours, start: e.target.value } })}
                  disabled={!notif.quietHours.enabled}
                />
              </div>
              <div>
                <div className="label mb-1">{tr("quietTo", "To")}</div>
                <input
                  type="time"
                  className="w-full px-3 py-2 rounded-btn border border-border text-sm bg-white"
                  value={notif.quietHours.end || "07:00"}
                  onChange={(e) => setNotif({ ...notif, quietHours: { ...notif.quietHours, end: e.target.value } })}
                  disabled={!notif.quietHours.enabled}
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <Button loading={saving} onClick={() => save({ notification_prefs: notif })}>
              {t("action.save")}
            </Button>
          </div>
          <p className="text-xs text-text-muted">{t("settings.autoSaveNote")}</p>
        </div>
      )}

      {tab === "privacy" && (
        <div className="space-y-4">
          <section className="bg-white rounded-card border border-border p-6 space-y-3">
            <h2 className="text-lg font-semibold inline-flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> {tr("privacyHeader", "Privacy")}
            </h2>
            {[
              { k: "communityVisible", l: tr("privacyCommunityVisible", "Show my profile in the community") },
              { k: "anonymousPosting", l: tr("privacyAnonymous", "Post anonymously by default") },
              { k: "hideFromSearch", l: tr("privacyHideSearch", "Hide me from admin search") },
            ].map((c) => (
              <label key={c.k} className="flex items-center justify-between py-1.5">
                <span className="text-sm">{c.l}</span>
                <input
                  type="checkbox"
                  checked={!!privacy[c.k as keyof PrivacyPrefs]}
                  onChange={(e) => setPrivacy({ ...privacy, [c.k]: e.target.checked })}
                />
              </label>
            ))}
            <div className="flex justify-end pt-2">
              <Button loading={saving} onClick={() => save({ privacy_prefs: privacy })}>
                {t("action.save")}
              </Button>
            </div>
          </section>
        </div>
      )}

      {tab === "accessibility" && (
        <div className="space-y-4">
          <section className="bg-white rounded-card border border-border p-6 space-y-3">
            <h2 className="text-lg font-semibold inline-flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" /> {tr("themeHeader", "Theme")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { k: "light" as Theme, l: tr("themeLight", "Light"), Icon: Sun },
                { k: "dark" as Theme, l: tr("themeDark", "Dark"), Icon: Moon },
                { k: "system" as Theme, l: tr("themeSystem", "Match system"), Icon: Monitor },
              ].map(({ k, l, Icon }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTheme_(k)}
                  className={cn(
                    "rounded-pill border px-4 py-2 text-sm font-medium inline-flex items-center gap-2",
                    theme === k
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-border text-text-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" /> {l}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-card border border-border p-6 space-y-3">
            <h2 className="label">{tr("fontSize", "Text size")}</h2>
            <div className="flex flex-wrap gap-2">
              {FONT_SCALES.map((f) => (
                <button
                  key={f.v}
                  type="button"
                  onClick={() => setAccessibility({ fontScale: f.v })}
                  className={cn(
                    "rounded-pill border px-3 py-1.5 text-xs font-medium",
                    accessibility.fontScale === f.v
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-border text-text-secondary"
                  )}
                >
                  {tr(f.k, f.k)}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-card border border-border p-6 space-y-3">
            <label className="flex items-start justify-between gap-4 py-1.5">
              <span>
                <span className="text-sm font-medium block">{tr("highContrast", "High contrast")}</span>
                <span className="text-xs text-text-muted">{tr("highContrastBody", "Stronger borders and text for easier reading.")}</span>
              </span>
              <input
                type="checkbox"
                checked={accessibility.highContrast}
                onChange={(e) => setAccessibility({ highContrast: e.target.checked })}
              />
            </label>
            <label className="flex items-start justify-between gap-4 py-1.5">
              <span>
                <span className="text-sm font-medium block">{tr("reduceMotion", "Reduce motion")}</span>
                <span className="text-xs text-text-muted">{tr("reduceMotionBody", "Minimize animations throughout the app.")}</span>
              </span>
              <input
                type="checkbox"
                checked={accessibility.reduceMotion}
                onChange={(e) => setAccessibility({ reduceMotion: e.target.checked })}
              />
            </label>
          </section>
        </div>
      )}

      {tab === "account" && (
        <div className="space-y-4">
          <div className="bg-white rounded-card border border-border p-6">
            <h2 className="text-lg font-semibold mb-2">{t("settings.changePw")}</h2>
            <p className="text-sm text-text-secondary mb-3">{t("settings.changePwBody")}</p>
            <Button
              variant="outline"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.resetPasswordForEmail(user.email!);
                showToast("success", t("settings.resetLinkSent"));
              }}
            >
              {t("action.sendResetLink")}
            </Button>
          </div>

          <div className="bg-white rounded-card border border-border p-6">
            <h2 className="text-lg font-semibold mb-2 inline-flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> {tr("changeEmail", "Change email")}
            </h2>
            <p className="text-sm text-text-secondary mb-3">{tr("changeEmailBody", "We'll send a confirmation link to the new address.")}</p>
            <div className="flex gap-2">
              <Input
                type="email"
                className="flex-1"
                placeholder={tr("newEmailPlaceholder", "new@email.com")}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Button variant="outline" onClick={onChangeEmail}>
                {tr("sendChangeLink", "Send change link")}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-card border border-border p-6">
            <h2 className="text-lg font-semibold mb-2 inline-flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> {tr("testEmail", "Test email")}
            </h2>
            <p className="text-sm text-text-secondary mb-3">
              {tr(
                "testEmailBody",
                "Send a test email to your address to confirm notifications are working."
              )}
            </p>
            <Button variant="outline" onClick={sendTestEmail} loading={sendingTest}>
              {tr("sendTestEmail", "Send test email")}
            </Button>
          </div>

          <div className="bg-white rounded-card border border-border p-6">
            <h2 className="text-lg font-semibold mb-3">{t("settings.myNeeds")}</h2>
            <NeedsStep value={needs} onChange={setNeeds} />
            <Button className="mt-4" loading={saving} onClick={() => save({ needs })}>
              {t("action.save")}
            </Button>
          </div>

          <div className="bg-white rounded-card border border-border p-6">
            <h2 className="text-lg font-semibold mb-2 inline-flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" /> {tr("downloadData", "Download my data")}
            </h2>
            <p className="text-sm text-text-secondary mb-3">{tr("downloadDataBody", "Export your profile, saved resources, and settings as JSON.")}</p>
            <Button variant="outline" onClick={onDownload}>
              <Download className="h-4 w-4" /> {tr("downloadButton", "Download")}
            </Button>
          </div>

          <div className="bg-white rounded-card border border-border p-6">
            <h2 className="text-lg font-semibold mb-2 inline-flex items-center gap-2">
              {paused ? <Play className="h-5 w-5 text-primary" /> : <Pause className="h-5 w-5 text-primary" />}
              {tr("pauseAccount", "Pause account")}
            </h2>
            <p className="text-sm text-text-secondary mb-3">{tr("pauseAccountBody", "Temporarily hide your profile without deleting it.")}</p>
            <Button variant="outline" onClick={togglePause}>
              {paused ? tr("unpauseButton", "Unpause") : tr("pauseButton", "Pause")}
            </Button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-card p-6">
            <h2 className="text-lg font-semibold text-red-800 inline-flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> {t("settings.dangerZone")}
            </h2>
            <p className="text-sm text-red-900 mt-1">{t("settings.dangerBody")}</p>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="mt-3 text-sm font-semibold text-red-700 hover:text-red-900 underline underline-offset-2"
            >
              {tr("deleteAccountLink", "Delete my account")}
            </button>
          </div>
        </div>
      )}

      <Modal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title={tr("deleteConfirmTitle", "Are you sure?")}
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          {tr(
            "deleteConfirmBody",
            "This will permanently delete your profile, saved resources, AI conversations, and community posts. This cannot be undone."
          )}
        </p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(false)}
            disabled={deleting}
          >
            {t("action.noKeep", undefined, "No, keep my account")}
          </Button>
          <Button variant="danger" onClick={doDelete} loading={deleting}>
            {t("action.yesDelete", undefined, "Yes, delete my account")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}