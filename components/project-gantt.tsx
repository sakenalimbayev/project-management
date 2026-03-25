"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { GanttStage } from "@/types/gantt";

function parseDate(iso: string): Date {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return new Date();
  }
  return d;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function monthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  let cur = startOfMonth(start);
  const last = startOfMonth(end);
  while (cur <= last) {
    months.push(new Date(cur));
    cur = addMonths(cur, 1);
  }
  if (months.length === 0) {
    months.push(startOfMonth(start));
  }
  return months;
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

const statusStyles: Record<
  NonNullable<GanttStage["status"]>,
  string
> = {
  completed: "bg-emerald-600/90 text-white",
  in_progress: "bg-primary text-primary-foreground",
  planned: "bg-muted-foreground/35 text-foreground",
};

export const defaultGanttStages: GanttStage[] = [
  {
    id: "1",
    label: "Discovery & planning",
    start: "2025-01-01",
    end: "2025-03-15",
    status: "completed",
  },
  {
    id: "2",
    label: "Build & integration",
    start: "2025-03-01",
    end: "2025-08-31",
    status: "in_progress",
  },
  {
    id: "3",
    label: "QA & launch readiness",
    start: "2025-08-15",
    end: "2025-10-24",
    status: "planned",
  },
];

type ProjectGanttProps = {
  stages: GanttStage[];
  /** Extra padding on the time axis (0–0.2 typical) */
  axisPadding?: number;
};

export function ProjectGantt({
  stages,
  axisPadding = 0.04,
}: ProjectGanttProps) {
  const { min, max, range, monthTicks, barLayouts } = useMemo(() => {
    if (stages.length === 0) {
      const now = new Date();
      return {
        min: now.getTime(),
        max: addMonths(now, 6).getTime(),
        range: 1,
        monthTicks: monthsBetween(now, addMonths(now, 6)),
        barLayouts: [] as {
          stage: GanttStage;
          leftPct: number;
          widthPct: number;
        }[],
      };
    }

    let minT = Infinity;
    let maxT = -Infinity;
    for (const s of stages) {
      const a = parseDate(s.start).getTime();
      const b = parseDate(s.end).getTime();
      minT = Math.min(minT, a, b);
      maxT = Math.max(maxT, a, b);
    }
    const pad = (maxT - minT) * axisPadding || 7 * 24 * 60 * 60 * 1000;
    const min = minT - pad;
    const max = maxT + pad;
    const range = Math.max(max - min, 1);

    const monthTicks = monthsBetween(new Date(min), new Date(max));

    const barLayouts = stages.map((stage) => {
      const a = parseDate(stage.start).getTime();
      const b = parseDate(stage.end).getTime();
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      const leftPct = ((lo - min) / range) * 100;
      const widthPct = Math.max(((hi - lo) / range) * 100, 0.8);
      return { stage, leftPct, widthPct };
    });

    return { min, max, range, monthTicks, barLayouts };
  }, [stages, axisPadding]);

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-card">
      <div className="min-w-[640px]">
        {/* Timeline header */}
        <div className="flex border-b border-border">
          <div
            className="shrink-0 border-r border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground w-[160px] md:w-[180px]"
            aria-hidden
          >
            Stage
          </div>
          <div className="relative flex-1 min-h-10">
            <div
              className="grid h-full"
              style={{
                gridTemplateColumns: `repeat(${monthTicks.length}, minmax(0, 1fr))`,
              }}
            >
              {monthTicks.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "border-l border-border/80 px-1 py-2 text-center text-xs font-medium text-muted-foreground first:border-l-0",
                    i === monthTicks.length - 1 && "border-r border-border/80"
                  )}
                >
                  {formatMonth(m)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stage rows */}
        <div className="divide-y divide-border">
          {barLayouts.map(({ stage, leftPct, widthPct }) => (
            <div key={stage.id} className="flex min-h-[48px] items-stretch">
              <div className="flex w-[160px] shrink-0 items-center border-r border-border bg-muted/20 px-3 py-2 text-sm font-medium md:w-[180px]">
                <span className="line-clamp-2">{stage.label}</span>
              </div>
              <div className="relative flex-1 bg-muted/5 py-2 pr-2 pl-0">
                <div
                  className="pointer-events-none absolute inset-y-2 left-0 right-2 grid"
                  style={{
                    gridTemplateColumns: `repeat(${monthTicks.length}, minmax(0, 1fr))`,
                  }}
                >
                  {monthTicks.map((_, i) => (
                    <div
                      key={i}
                      className="border-l border-border/50 first:border-l-0"
                    />
                  ))}
                </div>
                <div
                  className={cn(
                    "relative z-[1] flex h-8 items-center rounded-md px-2 text-xs font-medium shadow-sm",
                    statusStyles[stage.status ?? "planned"]
                  )}
                  style={{
                    marginLeft: `${leftPct}%`,
                    width: `${widthPct}%`,
                    minWidth: "2.5rem",
                  }}
                  title={`${stage.start} → ${stage.end}`}
                >
                  <span className="truncate">
                    {parseDate(stage.start).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    {" — "}
                    {parseDate(stage.end).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
