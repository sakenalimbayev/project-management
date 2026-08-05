"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectGantt } from "@/components/project-gantt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Typography } from "@/components/ui/typography";
import {
  mapStagesToGantt,
  type SerializedProjectStage,
} from "@/lib/map-project-stages";
import { STAGE_STATUS_LABELS } from "@/lib/stage-status";
import type { StageStatus } from "@/app/generated/prisma";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";

type EditorRow = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  status: StageStatus;
  plannedBudget: string;
};

function emptyRow(): EditorRow {
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  return {
    key: crypto.randomUUID(),
    label: "",
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    status: "PLANNED",
    plannedBudget: "0",
  };
}

type ProjectGanttSectionProps = {
  projectId: string;
  stages: SerializedProjectStage[];
  canEdit: boolean;
  totalBudget: string;
};

export function ProjectGanttSection({
  projectId,
  stages: initialStages,
  canEdit,
  totalBudget,
}: ProjectGanttSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<EditorRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ganttStages = useMemo(
    () => mapStagesToGantt(initialStages),
    [initialStages]
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (!initialStages.length) {
      setRows([emptyRow()]);
      return;
    }
    setRows(
      [...initialStages]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({
          key: s.id,
          label: s.label,
          startDate: s.startDate.slice(0, 10),
          endDate: s.endDate.slice(0, 10),
          status: s.status,
          plannedBudget: s.plannedBudget,
        }))
    );
  }, [open, initialStages]);

  const budgetSum = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.plannedBudget) || 0), 0),
    [rows]
  );
  const budgetExceeded = budgetSum > Number(totalBudget);

  const save = async () => {
    setError(null);
    const trimmed = rows.filter((r) => r.label.trim());
    if (trimmed.length === 0) {
      setError("Добавьте хотя бы один этап с названием или удалите все, чтобы очистить.");
      return;
    }
    for (let i = 0; i < trimmed.length; i++) {
      const r = trimmed[i];
      if (r.endDate < r.startDate) {
        setError(`Этап ${i + 1}: дата окончания не может быть раньше даты начала.`);
        return;
      }
      if (Number.isNaN(Number(r.plannedBudget)) || Number(r.plannedBudget) < 0) {
        setError(`Этап ${i + 1}: плановый бюджет должен быть неотрицательным числом.`);
        return;
      }
    }
    const sum = trimmed.reduce((acc, r) => acc + Number(r.plannedBudget), 0);
    if (sum > Number(totalBudget)) {
      setError(
        `Сумма бюджетов этапов (${sum.toLocaleString("ru-RU")}) не может превышать общий бюджет проекта (${Number(totalBudget).toLocaleString("ru-RU")}).`
      );
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/project/${projectId}/stages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stages: trimmed.map((r) => ({
            label: r.label.trim(),
            startDate: r.startDate,
            endDate: r.endDate,
            status: r.status,
            plannedBudget: r.plannedBudget,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Не удалось сохранить этапы.");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const clearAll = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/project/${projectId}/stages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stages: [] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Не удалось очистить этапы.");
        return;
      }
      setRows([]);
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>График проекта</CardTitle>
            <CardDescription>
              Этапы по времени (диаграмма Ганта). Этапы управляются
              администраторами проекта.
            </CardDescription>
          </div>
          {canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                  Управление этапами
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Этапы проекта</DialogTitle>
                  <DialogDescription>
                    Добавляйте, удаляйте и меняйте порядок этапов. Даты
                    определяют полосы диаграммы Ганта. Сохранение заменяет
                    все этапы проекта.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {rows.map((row, index) => (
                    <div
                      key={row.key}
                      className="space-y-2 rounded-md border border-border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Этап {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-destructive"
                          onClick={() =>
                            setRows((prev) => prev.filter((r) => r.key !== row.key))
                          }
                        >
                          Удалить
                        </Button>
                      </div>
                      <Input
                        placeholder="Название этапа"
                        value={row.label}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r) =>
                              r.key === row.key
                                ? { ...r, label: e.target.value }
                                : r
                            )
                          )
                        }
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">
                            Дата начала
                          </label>
                          <Input
                            type="date"
                            value={row.startDate}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? { ...r, startDate: e.target.value }
                                    : r
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">
                            Дата окончания
                          </label>
                          <Input
                            type="date"
                            value={row.endDate}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? { ...r, endDate: e.target.value }
                                    : r
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          Плановый бюджет
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.plannedBudget}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r) =>
                                r.key === row.key
                                  ? { ...r, plannedBudget: e.target.value }
                                  : r
                              )
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          Статус
                        </label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                          value={row.status}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r) =>
                                r.key === row.key
                                  ? {
                                      ...r,
                                      status: e.target.value as StageStatus,
                                    }
                                  : r
                              )
                            )
                          }
                        >
                          {Object.entries(STAGE_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setRows((prev) => [...prev, emptyRow()])}
                  >
                    Добавить этап
                  </Button>
                  <p
                    className={cn(
                      "text-xs",
                      budgetExceeded ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    Бюджет по этапам: {budgetSum.toLocaleString("ru-RU")} из{" "}
                    {Number(totalBudget).toLocaleString("ru-RU")}
                  </p>
                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => clearAll()}
                  >
                    Очистить все этапы
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Отмена
                    </Button>
                    <Button
                      type="button"
                      disabled={saving || budgetExceeded}
                      onClick={save}
                    >
                      {saving ? "Сохранение…" : "Сохранить"}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!ganttStages.length ? (
          <Typography variant="muted" className="mb-3 text-sm">
            {canEdit
              ? "Этапы ещё не добавлены. Используйте «Управление этапами», чтобы задать график."
              : "График для этого проекта пока не опубликован."}
          </Typography>
        ) : null}
        <ProjectGantt stages={ganttStages} />
      </CardContent>
    </Card>
  );
}
