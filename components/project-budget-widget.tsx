"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatTenge } from "@/lib/format-currency";
import { Wallet } from "lucide-react";

function parseAmount(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

type ProjectBudgetWidgetProps = {
  totalBudget: string;
  spentAmount: string;
};

export function ProjectBudgetWidget({
  totalBudget,
  spentAmount,
}: ProjectBudgetWidgetProps) {
  const total = parseAmount(totalBudget);
  const spent = parseAmount(spentAmount);
  const remaining = total - spent;
  const overBudget = total > 0 && spent > total;
  const pct =
    total > 0 ? Math.min(100, Math.max(0, (spent / total) * 100)) : 0;

  const fmt = (value: number) => formatTenge(value, { decimals: 2 });

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg border border-blue-100 bg-blue-50/40 p-4">
        <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm ring-1 ring-border">
          <Wallet className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Общий бюджет
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-gray-900">
          {fmt(total)}
        </p>
      </div>

      <div className="space-y-2">
        <Progress
          value={overBudget ? 100 : pct}
          className={cn(
            "h-2.5",
            overBudget &&
              "bg-destructive/20 [&_[data-slot=progress-indicator]]:bg-destructive"
          )}
        />
        <div className="flex items-start justify-between gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Потрачено</p>
            <p className="font-semibold tabular-nums text-foreground">
              {fmt(spent)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Остаток</p>
            {total <= 0 ? (
              <p className="font-semibold tabular-nums text-muted-foreground">
                —
              </p>
            ) : remaining < 0 ? (
              <p className="font-semibold tabular-nums text-destructive">
                Превышение на {fmt(-remaining)}
              </p>
            ) : (
              <p className="font-semibold tabular-nums text-foreground">
                {fmt(remaining)}
              </p>
            )}
          </div>
        </div>
        {overBudget ? (
          <p className="text-xs text-destructive">
            Расходы превысили выделенный бюджет.
          </p>
        ) : null}
      </div>
    </div>
  );
}
