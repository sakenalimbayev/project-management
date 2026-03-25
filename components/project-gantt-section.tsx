"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectGantt } from "@/components/project-gantt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { StageStatus } from "@/app/generated/prisma";

type EditorRow = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  status: StageStatus;
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
  };
}

type ProjectGanttSectionProps = {
  projectId: string;
  stages: SerializedProjectStage[];
  canEdit: boolean;
};

export function ProjectGanttSection({
  projectId,
  stages: initialStages,
  canEdit,
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
        }))
    );
  }, [open, initialStages]);

  const save = async () => {
    setError(null);
    const trimmed = rows.filter((r) => r.label.trim());
    if (trimmed.length === 0) {
      setError("Add at least one stage with a label, or remove all to clear.");
      return;
    }
    for (let i = 0; i < trimmed.length; i++) {
      const r = trimmed[i];
      if (r.endDate < r.startDate) {
        setError(`Stage ${i + 1}: end date must be on or after start date.`);
        return;
      }
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
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to save stages.");
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
        setError(data?.error ?? "Failed to clear stages.");
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
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Edit stages
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Project stages</DialogTitle>
                <DialogDescription>
                  Add, remove, or reorder stages. Dates define the Gantt bars.
                  Saving replaces all stages for this project.
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
                        Stage {index + 1}
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
                        Remove
                      </Button>
                    </div>
                    <Input
                      placeholder="Label"
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
                          Start
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
                          End
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
                        Status
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
                        <option value="PLANNED">Planned</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="COMPLETED">Completed</option>
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
                  Add stage
                </Button>
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
                  Clear all stages
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="button" disabled={saving} onClick={save}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
      {!ganttStages.length ? (
        <Typography variant="muted" className="text-sm">
          {canEdit
            ? "No stages yet. Use Edit stages to add your schedule."
            : "No schedule has been published for this project yet."}
        </Typography>
      ) : null}
      <ProjectGantt stages={ganttStages} />
    </div>
  );
}
