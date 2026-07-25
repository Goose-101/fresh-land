"use client";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";
import {
  TASKS,
  isTaskVisible,
  FOCUS_AREA_OPTIONS,
  type FocusArea,
  type ImmigrationStatus,
  type OnboardingState,
  type TimeInUS,
} from "@/lib/pathway-tasks";

type Draft = {
  timeInUS: TimeInUS | null;
  status: ImmigrationStatus | null;
  hasChildren: boolean | null;
  focusAreas: FocusArea[];
  alreadyDone: Set<string>;
};

const TIME_OPTIONS: { value: TimeInUS; label: string }[] = [
  { value: "lt1m", label: "Less than 1 month" },
  { value: "1to6m", label: "1 to 6 months" },
  { value: "6to12m", label: "6 to 12 months" },
  { value: "over1y", label: "Over a year" },
];

const STATUS_OPTIONS: { value: ImmigrationStatus; label: string }[] = [
  { value: "work", label: "Work Visa" },
  { value: "student", label: "Student Visa" },
  { value: "refugee", label: "Refugee or Asylum Seeker" },
  { value: "greencard", label: "Green Card Holder" },
  { value: "undocumented", label: "Undocumented" },
  { value: "other", label: "Prefer not to say" },
];

export function OnboardingModal({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (state: OnboardingState, alreadyDone: string[]) => void;
}) {
  const { t } = useT();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [draft, setDraft] = useState<Draft>({
    timeInUS: null,
    status: null,
    hasChildren: null,
    focusAreas: [],
    alreadyDone: new Set(),
  });

  const candidateTasks = useMemo(() => {
    if (step !== 5) return [];
    const ob: OnboardingState = {
      completedAt: null,
      timeInUS: draft.timeInUS,
      status: draft.status,
      hasChildren: draft.hasChildren,
      focusAreas: draft.focusAreas,
    };
    return TASKS.filter((task) => isTaskVisible(task, ob));
  }, [draft, step]);

  const finish = (alreadySet: Set<string>) => {
    const final: OnboardingState = {
      completedAt: new Date().toISOString(),
      timeInUS: draft.timeInUS,
      status: draft.status,
      hasChildren: draft.hasChildren,
      focusAreas: draft.focusAreas,
    };
    onComplete(final, Array.from(alreadySet));
  };

  const toggleFocus = (area: FocusArea) => {
    setDraft((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter((a) => a !== area)
        : [...prev.focusAreas, area],
    }));
  };

  const canAdvance =
    (step === 1 && draft.timeInUS) ||
    (step === 2 && draft.status) ||
    (step === 3 && draft.hasChildren !== null) ||
    (step === 4 && draft.focusAreas.length > 0) ||
    step === 5;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("pathway.onboarding.title", undefined, "Let's personalize your pathway")}
      size="lg"
    >
      <div className="flex flex-col gap-5">
        <Stepper current={step} />

        {step === 1 && (
          <Choice
            heading={t(
              "pathway.onboarding.q1",
              undefined,
              "How long have you been in the US?"
            )}
            sub={t(
              "pathway.onboarding.q1Sub",
              undefined,
              "We'll show the milestones that matter most for where you are right now."
            )}
            options={TIME_OPTIONS}
            value={draft.timeInUS}
            onSelect={(v) => setDraft({ ...draft, timeInUS: v })}
          />
        )}

        {step === 2 && (
          <Choice
            heading={t(
              "pathway.onboarding.q2",
              undefined,
              "What is your current immigration status?"
            )}
            sub={t(
              "pathway.onboarding.q2Sub",
              undefined,
              "This stays private on your device — it just helps us tailor a few tasks."
            )}
            options={STATUS_OPTIONS}
            value={draft.status}
            onSelect={(v) => setDraft({ ...draft, status: v })}
          />
        )}

        {step === 3 && (
          <Choice
            heading={t(
              "pathway.onboarding.q3",
              undefined,
              "Do you have children?"
            )}
            sub={t(
              "pathway.onboarding.q3Sub",
              undefined,
              "We'll add school enrollment and family resources if you do."
            )}
            options={[
              { value: true, label: "Yes" },
              { value: false, label: "No" },
            ]}
            value={draft.hasChildren}
            onSelect={(v) => setDraft({ ...draft, hasChildren: v })}
          />
        )}

        {step === 4 && (
          <FocusAreasStep
            selected={draft.focusAreas}
            onToggle={toggleFocus}
          />
        )}

        {step === 5 && (
          <AlreadyDoneStep
            tasks={candidateTasks}
            selected={draft.alreadyDone}
            onChange={(set) => setDraft({ ...draft, alreadyDone: set })}
          />
        )}

        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            onClick={() => (step > 1 ? setStep(((step - 1) as 1 | 2 | 3 | 4)) : onClose())}
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 1
              ? t("action.cancel", undefined, "Cancel")
              : t("action.back", undefined, "Back")}
          </Button>

          {step < 5 ? (
            <Button
              onClick={() => setStep(((step + 1) as 2 | 3 | 4 | 5))}
              disabled={!canAdvance}
            >
              {t("action.continue", undefined, "Continue")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => finish(new Set())}>
                {t("pathway.onboarding.skip", undefined, "Skip this step")}
              </Button>
              <Button onClick={() => finish(draft.alreadyDone)}>
                <Sparkles className="h-4 w-4" />
                {t("pathway.onboarding.start", undefined, "Start my pathway")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            n <= current ? "bg-primary" : "bg-slate-200"
          )}
        />
      ))}
    </div>
  );
}

function FocusAreasStep({
  selected,
  onToggle,
}: {
  selected: FocusArea[];
  onToggle: (a: FocusArea) => void;
}) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h4 className="text-lg font-semibold">
          {t(
            "pathway.onboarding.q4",
            undefined,
            "What matters most to you right now?"
          )}
        </h4>
        <p className="text-sm text-text-secondary mt-1">
          {t(
            "pathway.onboarding.q4Sub",
            undefined,
            "Pick the areas you want help with — your pathway will focus on these. Choose at least one."
          )}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {FOCUS_AREA_OPTIONS.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={cn(
                "text-left rounded-card border px-4 py-3 text-sm font-medium transition flex items-center justify-between",
                active
                  ? "border-primary bg-primary-light ring-2 ring-primary/20"
                  : "border-border bg-white hover:border-primary"
              )}
            >
              <span>{opt.label}</span>
              {active && <CheckCircle2 className="h-4 w-4 text-primary shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Choice<T extends string | boolean>({
  heading,
  sub,
  options,
  value,
  onSelect,
}: {
  heading: string;
  sub: string;
  options: { value: T; label: string }[];
  value: T | null;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h4 className="text-lg font-semibold">{heading}</h4>
        <p className="text-sm text-text-secondary mt-1">{sub}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={cn(
                "text-left rounded-card border px-4 py-3 text-sm font-medium transition",
                active
                  ? "border-primary bg-primary-light ring-2 ring-primary/20"
                  : "border-border bg-white hover:border-primary"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AlreadyDoneStep({
  tasks,
  selected,
  onChange,
}: {
  tasks: { id: string; Icon: any; fallbackTitle: string; titleKey: string }[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  const { t } = useT();
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h4 className="text-lg font-semibold">
          {t(
            "pathway.onboarding.q4",
            undefined,
            "Which one of the following have you got taken care of?"
          )}
        </h4>
        <p className="text-sm text-text-secondary mt-1">
          {t(
            "pathway.onboarding.q4Sub",
            undefined,
            "Check off anything that's already done — we'll celebrate it and skip the prompt."
          )}
        </p>
      </div>
      <div className="text-xs text-primary font-medium">
        {selected.size} {t("pathway.onboarding.alreadyCount", undefined, "already done")}
      </div>
      <ul className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
        {tasks.map((task) => {
          const checked = selected.has(task.id);
          const Icon = task.Icon;
          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => toggle(task.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-card border px-3 py-2.5 text-left transition",
                  checked
                    ? "border-primary bg-primary-light"
                    : "border-border bg-white hover:border-primary"
                )}
              >
                <span
                  className={cn(
                    "h-9 w-9 rounded-btn grid place-items-center shrink-0",
                    checked ? "bg-primary text-white" : "bg-primary-light text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium">
                  {t(task.titleKey, undefined, task.fallbackTitle)}
                </span>
                {checked ? (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-text-muted shrink-0" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}