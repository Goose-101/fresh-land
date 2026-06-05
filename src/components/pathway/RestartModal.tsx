"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, Circle, RotateCcw, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";
import {
  TASKS,
  isTaskVisible,
  type OnboardingState,
  type PathwayTask,
} from "@/lib/pathway-tasks";

export function RestartModal({
  open,
  onClose,
  onboarding,
  onResetTasks,
  onRedoOnboarding,
}: {
  open: boolean;
  onClose: () => void;
  onboarding: OnboardingState;
  onResetTasks: (ids: string[]) => void;
  onRedoOnboarding: () => void;
}) {
  const { t } = useT();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const byCategory = useMemo(() => {
    const map = new Map<string, PathwayTask[]>();
    for (const task of TASKS) {
      if (!isTaskVisible(task, onboarding)) continue;
      const list = map.get(task.category) || [];
      list.push(task);
      map.set(task.category, list);
    }
    return map;
  }, [onboarding]);

  const toggleTask = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleCategory = (ids: string[]) => {
    const allSelected = ids.every((id) => selected.has(id));
    const next = new Set(selected);
    if (allSelected) for (const id of ids) next.delete(id);
    else for (const id of ids) next.add(id);
    setSelected(next);
  };

  const apply = () => {
    onResetTasks(Array.from(selected));
    setSelected(new Set());
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setSelected(new Set());
        onClose();
      }}
      title={t("pathway.restart.title", undefined, "Restart your pathway")}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          {t(
            "pathway.restart.body",
            undefined,
            "Pick the tasks or categories you want to start over. Everything else stays exactly as it is."
          )}
        </p>

        <ul className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {Array.from(byCategory.entries()).map(([cat, tasks]) => {
            const ids = tasks.map((task) => task.id);
            const allSelected = ids.every((id) => selected.has(id));
            const selectedCount = ids.filter((id) => selected.has(id)).length;
            const someSelected = selectedCount > 0 && !allSelected;
            return (
              <li key={cat} className="rounded-card border border-border bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(ids)}
                  className="w-full flex items-center justify-between px-3 py-2 border-b border-border bg-slate-50/40 hover:bg-slate-50"
                >
                  <span className="text-sm font-medium">
                    {t(`category.${cat}`, undefined, cat)}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      allSelected
                        ? "text-primary font-medium"
                        : someSelected
                        ? "text-amber-700"
                        : "text-text-muted"
                    )}
                  >
                    {allSelected
                      ? t("pathway.restart.allSelected", undefined, "All selected")
                      : someSelected
                      ? `${selectedCount}/${ids.length}`
                      : t("pathway.restart.selectAll", undefined, "Select all")}
                  </span>
                </button>
                <ul className="p-2 flex flex-col gap-1">
                  {tasks.map((task) => {
                    const checked = selected.has(task.id);
                    const Icon = task.Icon;
                    return (
                      <li key={task.id}>
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className={cn(
                            "w-full flex items-center gap-2 rounded-btn px-2 py-1.5 text-left transition",
                            checked ? "bg-primary-light" : "hover:bg-slate-50"
                          )}
                        >
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          <span className="flex-1 text-sm">
                            {t(task.titleKey, undefined, task.fallbackTitle)}
                          </span>
                          {checked ? (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-text-muted shrink-0" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <button
            onClick={() => {
              setSelected(new Set());
              onClose();
              onRedoOnboarding();
            }}
            className="text-xs text-text-secondary hover:text-primary inline-flex items-center gap-1"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t(
              "pathway.restart.redoPreferences",
              undefined,
              "Re-do my preferences instead"
            )}
          </button>

          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              onClick={() => {
                setSelected(new Set());
                onClose();
              }}
            >
              {t("action.cancel", undefined, "Cancel")}
            </Button>
            <Button onClick={apply} disabled={selected.size === 0}>
              <RotateCcw className="h-4 w-4" />
              {t("pathway.restart.apply", undefined, "Reset selected")}
              {selected.size > 0 && ` (${selected.size})`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}