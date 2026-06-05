"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Clock,
  Circle,
  Bell,
  ChevronDown,
  ChevronUp,
  ListFilter,
  ArrowUpDown,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Trash2,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/I18nProvider";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  TASKS,
  isTaskVisible,
  visiblePhases,
  phaseTitle,
  phaseSubtitle,
  type PathwayTask,
  type Phase,
  type TaskStatus,
} from "@/lib/pathway-tasks";
import {
  useOnboarding,
  useReminders,
  useTasks,
} from "./use-pathway-storage";
import { OnboardingModal } from "./OnboardingModal";
import { ReminderModal } from "./ReminderModal";
import { ShareWinModal } from "./ShareWinModal";
import { RestartModal } from "./RestartModal";

type Filter = "all" | "not_started" | "in_progress" | "done" | "already";
type Sort = "phase" | "category";

export function PathwayClient({
  userName,
  categoryIdBySlug,
}: {
  userName: string;
  categoryIdBySlug: Record<string, string>;
}) {
  const { t } = useT();
  const { showToast, showReminderBanner } = useAppStore();

  const onboarding = useOnboarding();
  const tasks = useTasks();
  const reminders = useReminders((r) => {
    showReminderBanner(
      t("pathway.reminder.bannerTitle", undefined, "Fresh Land reminder"),
      r.note || t("pathway.reminder.bannerFallback", undefined, "You set a reminder for a pathway task."),
      {
        onView: () => {
          reminders.markViewed(r.id);
          if (typeof document !== "undefined") {
            const el = document.getElementById(`task-${r.taskId}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              el.classList.add("ring-2", "ring-primary");
              setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 2000);
            }
          }
        },
        onDismiss: () => reminders.markViewed(r.id),
      }
    );
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("phase");
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [reminderTask, setReminderTask] = useState<PathwayTask | null>(null);
  const [shareTask, setShareTask] = useState<PathwayTask | null>(null);
  const [collapsedAlready, setCollapsedAlready] = useState<Record<Phase, boolean>>({
    1: true,
    2: true,
    3: true,
  });

  useEffect(() => {
    if (onboarding.hydrated && !onboarding.state.completedAt) {
      setShowOnboarding(true);
    }
  }, [onboarding.hydrated, onboarding.state.completedAt]);

  const handleOnboardComplete = (state: any, alreadyIds: string[]) => {
    onboarding.save(state);
    if (alreadyIds.length) tasks.bulkAlready(alreadyIds);
    setShowOnboarding(false);
  };

  const visibleTasks = useMemo(() => {
    return TASKS.filter((task) => isTaskVisible(task, onboarding.state));
  }, [onboarding.state]);

  const phasesShown = useMemo(
    () => visiblePhases(onboarding.state.timeInUS),
    [onboarding.state.timeInUS]
  );

  const statusOf = (id: string): TaskStatus => tasks.state[id]?.status ?? "not_started";

  const counts = useMemo(() => {
    let done = 0;
    let inProgress = 0;
    let already = 0;
    let remaining = 0;
    for (const task of visibleTasks) {
      const s = statusOf(task.id);
      if (s === "done") done++;
      else if (s === "in_progress") inProgress++;
      else if (s === "already") already++;
      else remaining++;
    }
    return { done, inProgress, already, remaining, total: visibleTasks.length };
  }, [visibleTasks, tasks.state]);

  const overallPct = counts.total
    ? Math.round(((counts.done + counts.already) / counts.total) * 100)
    : 0;

  const phaseProgress = (phase: Phase) => {
    const items = visibleTasks.filter((task) => task.phase === phase);
    if (!items.length) return { pct: 0, done: 0, total: 0 };
    const done = items.filter((task) => {
      const s = statusOf(task.id);
      return s === "done" || s === "already";
    }).length;
    return { pct: Math.round((done / items.length) * 100), done, total: items.length };
  };

  const setStatusWithCelebration = (target: PathwayTask, next: TaskStatus) => {
    const prev = statusOf(target.id);
    tasks.setStatus(target.id, next);
    if (next === "done" && prev !== "done") {
      showToast("success", t("pathway.toast.completed", undefined, "Task completed!"));
      const phase = target.phase;
      const phaseItems = visibleTasks.filter((p) => p.phase === phase);
      const phaseDoneAfter = phaseItems.every((p) => {
        const s = p.id === target.id ? next : statusOf(p.id);
        return s === "done" || s === "already";
      });
      if (phaseDoneAfter) {
        setTimeout(() => {
          showToast(
            "success",
            t(
              "pathway.toast.phase",
              { phase: phaseTitle(phase) },
              `You finished ${phaseTitle(phase)}! 🎉`
            )
          );
        }, 600);
      }
      setTimeout(() => setShareTask(target), 350);
    }
  };

  const passesFilter = (s: TaskStatus) => {
    if (filter === "all") return s !== "already";
    return s === filter;
  };

  const unreadReminderInbox = useMemo(() => {
    return reminders.list
      .filter((r) => {
        if (!r.fired || r.viewed) return false;
        const s = tasks.state[r.taskId]?.status;
        return s !== "done" && s !== "already";
      })
      .map((r) => {
        const task = TASKS.find((task) => task.id === r.taskId);
        return {
          id: r.id,
          taskId: r.taskId,
          note: r.note,
          fireAt: r.fireAt,
          taskTitle: task ? t(task.titleKey, undefined, task.fallbackTitle) : r.note,
        };
      })
      .sort((a, b) => new Date(b.fireAt).getTime() - new Date(a.fireAt).getTime());
  }, [reminders.list, tasks.state, t]);

  const unreadReminderCount = unreadReminderInbox.length;

  const viewReminder = (taskId: string, reminderId: string) => {
    reminders.markViewed(reminderId);
    if (typeof document !== "undefined") {
      const el = document.getElementById(`task-${taskId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary");
        setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 2000);
      }
    }
  };

  const tipFor = (task: PathwayTask) => t(task.tipKey, undefined, task.fallbackTip);
  const titleFor = (task: PathwayTask) => t(task.titleKey, undefined, task.fallbackTitle);
  const descFor = (task: PathwayTask) => t(task.descKey, undefined, task.fallbackDesc);

  const groupedByPhase = useMemo(() => {
    const map = new Map<Phase, PathwayTask[]>();
    for (const phase of phasesShown) map.set(phase, []);
    for (const task of visibleTasks) {
      if (!phasesShown.includes(task.phase)) continue;
      map.get(task.phase)?.push(task);
    }
    return map;
  }, [visibleTasks, phasesShown]);

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, PathwayTask[]>();
    for (const task of visibleTasks) {
      if (!phasesShown.includes(task.phase)) continue;
      const list = map.get(task.category) || [];
      list.push(task);
      map.set(task.category, list);
    }
    return map;
  }, [visibleTasks, phasesShown]);

  const upcomingReminders = reminders.list
    .filter((r) => !r.fired)
    .sort((a, b) => new Date(a.fireAt).getTime() - new Date(b.fireAt).getTime())
    .slice(0, 3);

  if (!onboarding.hydrated || !tasks.hydrated) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded mb-4" />
        <div className="h-32 bg-slate-100 rounded-card" />
      </div>
    );
  }

  if (!onboarding.state.completedAt) {
    return (
      <>
        <div className="max-w-3xl mx-auto p-8 text-center">
          <Compass className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-semibold mt-3">
            {t("pathway.welcome.title", undefined, "Welcome to your pathway")}
          </h1>
          <p className="text-text-secondary mt-2 max-w-xl mx-auto">
            {t(
              "pathway.welcome.body",
              undefined,
              "A personal, encouraging guide through the milestones that matter most after arriving in the US. Answer a few questions to get started."
            )}
          </p>
          <Button className="mt-6" onClick={() => setShowOnboarding(true)}>
            <Sparkles className="h-4 w-4" />
            {t("pathway.welcome.cta", undefined, "Personalize my pathway")}
          </Button>
        </div>
        <OnboardingModal
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardComplete}
        />
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-5 md:p-8 space-y-6">
      <Header
        userName={userName}
        overallPct={overallPct}
        phasesShown={phasesShown}
        phaseProgress={phaseProgress}
        onRestart={() => setShowRestart(true)}
      />

      <StatsBar
        done={counts.done + counts.already}
        inProgress={counts.inProgress}
        remaining={counts.remaining}
      />

      {upcomingReminders.length > 0 && (
        <UpcomingReminders
          items={upcomingReminders.map((r) => ({
            ...r,
            taskTitle: (() => {
              const task = visibleTasks.find((task) => task.id === r.taskId);
              return task ? titleFor(task) : r.note;
            })(),
          }))}
          onRemove={reminders.remove}
        />
      )}

      <Controls
        filter={filter}
        setFilter={setFilter}
        sort={sort}
        setSort={setSort}
        unreadReminderCount={unreadReminderCount}
        unreadReminders={unreadReminderInbox}
        onViewReminder={viewReminder}
        onDismissReminder={reminders.markViewed}
        onClearReminders={reminders.markAllViewed}
      />

      {sort === "phase"
        ? phasesShown.map((phase) => (
            <PhaseSection
              key={phase}
              phase={phase}
              tasks={(groupedByPhase.get(phase) || []).filter((t) => passesFilter(statusOf(t.id)))}
              alreadyTasks={(groupedByPhase.get(phase) || []).filter(
                (t) => statusOf(t.id) === "already"
              )}
              statusOf={statusOf}
              titleFor={titleFor}
              descFor={descFor}
              tipFor={tipFor}
              expandedTip={expandedTip}
              onToggleTip={(id) => setExpandedTip(expandedTip === id ? null : id)}
              onSetStatus={setStatusWithCelebration}
              onReminder={(t) => setReminderTask(t)}
              alreadyOpen={!collapsedAlready[phase]}
              onToggleAlready={() =>
                setCollapsedAlready({
                  ...collapsedAlready,
                  [phase]: !collapsedAlready[phase],
                })
              }
              filter={filter}
            />
          ))
        : Array.from(groupedByCategory.entries()).map(([slug, items]) => (
            <CategorySection
              key={slug}
              slug={slug}
              tasks={items.filter((t) => passesFilter(statusOf(t.id)))}
              statusOf={statusOf}
              titleFor={titleFor}
              descFor={descFor}
              tipFor={tipFor}
              expandedTip={expandedTip}
              onToggleTip={(id) => setExpandedTip(expandedTip === id ? null : id)}
              onSetStatus={setStatusWithCelebration}
              onReminder={(t) => setReminderTask(t)}
            />
          ))}

      <OnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardComplete}
      />

      <ReminderModal
        open={!!reminderTask}
        task={reminderTask}
        existing={reminders.list}
        onClose={() => setReminderTask(null)}
        onSave={(r) =>
          reminders.add(
            r,
            reminderTask ? t(reminderTask.titleKey, undefined, reminderTask.fallbackTitle) : undefined
          )
        }
        onRemove={reminders.remove}
        onRequestPermission={reminders.requestPermission}
      />

      <ShareWinModal
        open={!!shareTask}
        task={shareTask}
        categoryIdBySlug={categoryIdBySlug}
        onClose={() => setShareTask(null)}
      />

      <RestartModal
        open={showRestart}
        onClose={() => setShowRestart(false)}
        onboarding={onboarding.state}
        onResetTasks={(ids) => {
          if (ids.length === 0) return;
          tasks.resetMany(ids);
          showToast(
            "success",
            t(
              "pathway.restart.toast",
              { count: ids.length },
              `Reset ${ids.length} ${ids.length === 1 ? "task" : "tasks"}.`
            )
          );
        }}
        onRedoOnboarding={() => setShowOnboarding(true)}
      />
    </div>
  );
}

function Header({
  userName,
  overallPct,
  phasesShown,
  phaseProgress,
  onRestart,
}: {
  userName: string;
  overallPct: number;
  phasesShown: Phase[];
  phaseProgress: (p: Phase) => { pct: number; done: number; total: number };
  onRestart: () => void;
}) {
  const { t } = useT();
  return (
    <section className="bg-white rounded-card border border-border p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-primary-dark inline-flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" />
            {t(
              "pathway.header.greeting",
              { name: userName },
              `${userName}'s Pathway`
            )}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {t(
              "pathway.header.tagline",
              undefined,
              "Every step you take is one closer to feeling at home."
            )}
          </p>
        </div>
        <button
          onClick={onRestart}
          className="text-xs text-text-muted hover:text-primary inline-flex items-center gap-1 shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("pathway.header.restart", undefined, "Restart")}
        </button>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            {t("pathway.header.overall", undefined, "Overall progress")}
          </span>
          <span className="text-sm font-semibold">{overallPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5">
        {([1, 2, 3] as Phase[]).map((phase) => {
          const visible = phasesShown.includes(phase);
          const { pct, done, total } = phaseProgress(phase);
          return (
            <div
              key={phase}
              className={cn(
                "rounded-card border p-3 flex flex-col items-center text-center transition",
                visible ? "border-border bg-white" : "border-dashed border-border bg-slate-50/40 opacity-60"
              )}
            >
              <Ring pct={visible ? pct : 0} />
              <p className="text-xs font-semibold mt-2 leading-tight">
                {phase === 1
                  ? t("pathway.header.step1", undefined, "First Step")
                  : phase === 2
                  ? t("pathway.header.step2", undefined, "Second Step")
                  : t("pathway.header.step3", undefined, "Third Step")}
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                {visible ? `${done}/${total}` : t("pathway.header.locked", undefined, "Coming up")}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
      <circle cx="28" cy="28" r={r} stroke="#e2e8f0" strokeWidth="5" fill="none" />
      <circle
        cx="28"
        cy="28"
        r={r}
        stroke="currentColor"
        className="text-primary transition-all duration-500"
        strokeWidth="5"
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
      />
      <text
        x="28"
        y="32"
        textAnchor="middle"
        className="fill-text font-semibold"
        fontSize="12"
      >
        {pct}%
      </text>
    </svg>
  );
}

function StatsBar({
  done,
  inProgress,
  remaining,
}: {
  done: number;
  inProgress: number;
  remaining: number;
}) {
  const { t } = useT();
  const items = [
    {
      label: t("pathway.stats.done", undefined, "Done"),
      value: done,
      Icon: CheckCircle2,
      tone: "text-primary bg-primary-light",
    },
    {
      label: t("pathway.stats.inProgress", undefined, "In progress"),
      value: inProgress,
      Icon: Clock,
      tone: "text-amber-700 bg-amber-100",
    },
    {
      label: t("pathway.stats.remaining", undefined, "Remaining"),
      value: remaining,
      Icon: Circle,
      tone: "text-text-secondary bg-slate-100",
    },
  ];
  return (
    <section className="grid grid-cols-3 gap-3">
      {items.map(({ label, value, Icon, tone }) => (
        <div
          key={label}
          className="bg-white rounded-card border border-border px-4 py-3 flex items-center gap-3"
        >
          <span className={cn("h-9 w-9 rounded-btn grid place-items-center shrink-0", tone)}>
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xl font-semibold leading-none">{value}</p>
            <p className="text-xs text-text-muted mt-1">{label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function UpcomingReminders({
  items,
  onRemove,
}: {
  items: { id: string; fireAt: string; note: string; taskTitle: string }[];
  onRemove: (id: string) => void;
}) {
  const { t } = useT();
  return (
    <section className="bg-white rounded-card border border-border p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary mb-2 inline-flex items-center gap-1.5">
        <Bell className="h-3.5 w-3.5 text-primary" />
        {t("pathway.reminder.upcoming", undefined, "Upcoming reminders")}
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-btn border border-border px-3 py-2 text-sm"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{r.taskTitle}</p>
              <p className="text-xs text-text-muted">{new Date(r.fireAt).toLocaleString()}</p>
            </div>
            <button
              onClick={() => onRemove(r.id)}
              className="p-1.5 rounded-btn hover:bg-red-50 text-red-600"
              aria-label={t("action.delete", undefined, "Remove")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Controls({
  filter,
  setFilter,
  sort,
  setSort,
  unreadReminderCount,
  unreadReminders,
  onViewReminder,
  onDismissReminder,
  onClearReminders,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  sort: Sort;
  setSort: (s: Sort) => void;
  unreadReminderCount: number;
  unreadReminders: { id: string; taskId: string; note: string; fireAt: string; taskTitle: string }[];
  onViewReminder: (taskId: string, reminderId: string) => void;
  onDismissReminder: (reminderId: string) => void;
  onClearReminders: () => void;
}) {
  const { t } = useT();
  const [inboxOpen, setInboxOpen] = useState(false);
  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: t("pathway.filter.all", undefined, "All") },
    { value: "not_started", label: t("pathway.filter.notStarted", undefined, "Not started") },
    { value: "in_progress", label: t("pathway.filter.inProgress", undefined, "In progress") },
    { value: "done", label: t("pathway.filter.done", undefined, "Done") },
    { value: "already", label: t("pathway.filter.already", undefined, "Already") },
  ];
  return (
    <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 flex-1 min-w-0">
          <ListFilter className="h-4 w-4 text-text-muted shrink-0" />
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "shrink-0 rounded-pill text-xs font-medium px-3 py-1.5 border transition",
                filter === f.value
                  ? "border-primary bg-primary-light text-primary-dark"
                  : "border-border bg-white text-text-secondary hover:border-primary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {unreadReminderCount > 0 && (
          <div className="relative shrink-0">
            <button
              onClick={() => setInboxOpen((v) => !v)}
              title={t("pathway.reminder.badgeTitle", undefined, "View reminder notifications")}
              className="inline-flex items-center gap-1.5 rounded-pill border border-primary/30 bg-primary-light px-2 py-1 hover:bg-primary-light/80"
            >
              <Bell className="h-3.5 w-3.5 text-primary" />
              <span className="min-w-[18px] h-[18px] grid place-items-center rounded-full bg-primary text-white text-[10px] font-bold leading-none px-1">
                {unreadReminderCount > 9 ? "9+" : unreadReminderCount}
              </span>
            </button>
            {inboxOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setInboxOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-[min(92vw,360px)] bg-white rounded-card border border-border shadow-modal z-40 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-primary-light/30">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                      {t("pathway.reminder.inboxTitle", undefined, "Your reminders")}
                    </p>
                    <button
                      onClick={() => {
                        onClearReminders();
                        setInboxOpen(false);
                      }}
                      className="text-[11px] text-text-secondary hover:text-primary"
                    >
                      {t("pathway.reminder.markAllRead", undefined, "Mark all as read")}
                    </button>
                  </div>
                  <ul className="max-h-[60vh] overflow-y-auto divide-y divide-border">
                    {unreadReminders.map((r) => (
                      <li key={r.id} className="flex items-start gap-2 p-3 hover:bg-slate-50">
                        <button
                          type="button"
                          onClick={() => {
                            onViewReminder(r.taskId, r.id);
                            setInboxOpen(false);
                          }}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="text-sm font-semibold truncate">{r.taskTitle}</p>
                          {r.note && r.note !== r.taskTitle && (
                            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                              {r.note}
                            </p>
                          )}
                          <p className="text-[11px] text-text-muted mt-1">
                            {new Date(r.fireAt).toLocaleString()}
                          </p>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismissReminder(r.id);
                          }}
                          className="p-1 rounded hover:bg-slate-100 shrink-0"
                          aria-label="Dismiss"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-text-muted" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <label className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
        <ArrowUpDown className="h-3.5 w-3.5" />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-btn border border-border px-2 py-1.5 text-xs bg-white"
        >
          <option value="phase">{t("pathway.sort.phase", undefined, "Group by phase")}</option>
          <option value="category">{t("pathway.sort.category", undefined, "Group by category")}</option>
        </select>
      </label>
    </section>
  );
}

function PhaseSection({
  phase,
  tasks,
  alreadyTasks,
  statusOf,
  titleFor,
  descFor,
  tipFor,
  expandedTip,
  onToggleTip,
  onSetStatus,
  onReminder,
  alreadyOpen,
  onToggleAlready,
  filter,
}: {
  phase: Phase;
  tasks: PathwayTask[];
  alreadyTasks: PathwayTask[];
  statusOf: (id: string) => TaskStatus;
  titleFor: (t: PathwayTask) => string;
  descFor: (t: PathwayTask) => string;
  tipFor: (t: PathwayTask) => string;
  expandedTip: string | null;
  onToggleTip: (id: string) => void;
  onSetStatus: (t: PathwayTask, s: TaskStatus) => void;
  onReminder: (t: PathwayTask) => void;
  alreadyOpen: boolean;
  onToggleAlready: () => void;
  filter: Filter;
}) {
  const { t } = useT();
  const phaseDoneCount = (tasks.length ? tasks : alreadyTasks).filter(
    (task) => statusOf(task.id) === "done" || statusOf(task.id) === "already"
  ).length;
  const total = tasks.length + alreadyTasks.length;
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xl font-semibold inline-flex items-center gap-2">
          <PartyPopper
            className={cn(
              "h-4 w-4",
              phaseDoneCount === total && total > 0 ? "text-primary" : "text-text-muted"
            )}
          />
          {t(
            `pathway.phase.${phase}.title`,
            undefined,
            `Phase ${phase} — ${phaseTitle(phase)}`
          )}
          <span className="text-xs text-text-muted font-normal">{phaseSubtitle(phase)}</span>
        </h2>
      </div>
      {tasks.length === 0 && filter !== "already" && (
        <div className="rounded-card border border-dashed border-border bg-white px-4 py-6 text-center text-sm text-text-muted">
          {filter === "all"
            ? t("pathway.empty.allDone", undefined, "All tasks in this phase are complete. 🎉")
            : t("pathway.empty.filter", undefined, "No tasks match this filter.")}
        </div>
      )}
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            status={statusOf(task.id)}
            title={titleFor(task)}
            desc={descFor(task)}
            tip={tipFor(task)}
            tipExpanded={expandedTip === task.id}
            onToggleTip={() => onToggleTip(task.id)}
            onSetStatus={(s) => onSetStatus(task, s)}
            onReminder={() => onReminder(task)}
          />
        ))}
      </div>
      {alreadyTasks.length > 0 && filter !== "already" && (
        <div className="mt-4">
          <button
            onClick={onToggleAlready}
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary"
          >
            {alreadyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {t(
              "pathway.alreadyDone.label",
              { count: alreadyTasks.length },
              `Already done (${alreadyTasks.length})`
            )}
          </button>
          {alreadyOpen && (
            <ul className="mt-2 flex flex-col gap-2">
              {alreadyTasks.map((task) => {
                const Icon = task.Icon;
                return (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 rounded-btn border border-primary/20 bg-primary-light/40 px-3 py-2"
                  >
                    <span className="h-8 w-8 rounded-btn grid place-items-center bg-primary text-white shrink-0">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm flex-1">{titleFor(task)}</span>
                    <button
                      onClick={() => onSetStatus(task, "not_started")}
                      className="text-[11px] text-text-muted hover:text-primary"
                    >
                      {t("pathway.alreadyDone.undo", undefined, "Move back")}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function CategorySection({
  slug,
  tasks,
  statusOf,
  titleFor,
  descFor,
  tipFor,
  expandedTip,
  onToggleTip,
  onSetStatus,
  onReminder,
}: {
  slug: string;
  tasks: PathwayTask[];
  statusOf: (id: string) => TaskStatus;
  titleFor: (t: PathwayTask) => string;
  descFor: (t: PathwayTask) => string;
  tipFor: (t: PathwayTask) => string;
  expandedTip: string | null;
  onToggleTip: (id: string) => void;
  onSetStatus: (t: PathwayTask, s: TaskStatus) => void;
  onReminder: (t: PathwayTask) => void;
}) {
  const { t } = useT();
  if (tasks.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">
        {t(`category.${slug}`, undefined, slug)}
      </h2>
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            status={statusOf(task.id)}
            title={titleFor(task)}
            desc={descFor(task)}
            tip={tipFor(task)}
            tipExpanded={expandedTip === task.id}
            onToggleTip={() => onToggleTip(task.id)}
            onSetStatus={(s) => onSetStatus(task, s)}
            onReminder={() => onReminder(task)}
          />
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useT();
  const map: Record<TaskStatus, { label: string; cls: string; Icon: any }> = {
    not_started: {
      label: t("pathway.badge.notStarted", undefined, "Not yet"),
      cls: "bg-slate-100 text-text-secondary",
      Icon: Circle,
    },
    in_progress: {
      label: t("pathway.badge.inProgress", undefined, "In progress"),
      cls: "bg-amber-100 text-amber-800",
      Icon: Clock,
    },
    done: {
      label: t("pathway.badge.done", undefined, "Completed"),
      cls: "bg-primary-light text-primary-dark",
      Icon: CheckCircle2,
    },
    already: {
      label: t("pathway.badge.already", undefined, "Already done"),
      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      Icon: CheckCircle2,
    },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill text-[11px] font-medium px-2 py-0.5",
        cls
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function TaskCard({
  task,
  status,
  title,
  desc,
  tip,
  tipExpanded,
  onToggleTip,
  onSetStatus,
  onReminder,
}: {
  task: PathwayTask;
  status: TaskStatus;
  title: string;
  desc: string;
  tip: string;
  tipExpanded: boolean;
  onToggleTip: () => void;
  onSetStatus: (s: TaskStatus) => void;
  onReminder: () => void;
}) {
  const { t } = useT();
  const Icon = task.Icon;
  const isDone = status === "done" || status === "already";
  return (
    <article
      id={`task-${task.id}`}
      className={cn(
        "bg-white rounded-card border p-4 transition scroll-mt-24",
        isDone ? "border-primary/30 bg-primary-light/30" : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "h-10 w-10 rounded-btn grid place-items-center shrink-0",
            isDone ? "bg-primary text-white" : "bg-primary-light text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("font-semibold text-sm", isDone && "text-primary-dark")}>
              {title}
            </h3>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-text-secondary mt-1">{desc}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={`/categories/${task.resourceCategory}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {t("pathway.task.findResources", undefined, "Find resources")}
              <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              onClick={onToggleTip}
              className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-primary"
            >
              <Lightbulb className="h-3 w-3" />
              {tipExpanded
                ? t("pathway.task.hideTip", undefined, "Hide tip")
                : t("pathway.task.showTip", undefined, "Show tip")}
            </button>
            <button
              onClick={onReminder}
              className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-primary"
            >
              <Bell className="h-3 w-3" />
              {t("pathway.task.remind", undefined, "Remind me")}
            </button>
          </div>

          {tipExpanded && (
            <p className="mt-3 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-btn px-3 py-2">
              <Lightbulb className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
              {tip}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {status !== "in_progress" && status !== "done" && (
              <button
                onClick={() => onSetStatus("in_progress")}
                className="text-xs rounded-pill border border-border px-3 py-1 hover:border-primary hover:text-primary"
              >
                {t("pathway.task.startIt", undefined, "Start working on it")}
              </button>
            )}
            {status !== "done" && (
              <button
                onClick={() => onSetStatus("done")}
                className="text-xs rounded-pill bg-primary text-white px-3 py-1 hover:bg-primary-dark inline-flex items-center gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                {t("pathway.task.markDone", undefined, "Mark done")}
              </button>
            )}
            {status === "done" && (
              <button
                onClick={() => onSetStatus("not_started")}
                className="text-xs rounded-pill border border-border px-3 py-1 text-text-secondary hover:border-primary"
              >
                {t("pathway.task.undo", undefined, "Undo")}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}