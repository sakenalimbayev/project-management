"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

function parseAmount(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

type ProjectBudgetWidgetProps = {
  totalBudget: string;
  spentAmount: string;
  currency?: string;
};

export function ProjectBudgetWidget({
  totalBudget,
  spentAmount,
  currency = "USD",
}: ProjectBudgetWidgetProps) {
  const total = parseAmount(totalBudget);
  const spent = parseAmount(spentAmount);
  const remaining = total - spent;
  const overBudget = total > 0 && spent > total;
  const pct =
    total > 0 ? Math.min(100, Math.max(0, (spent / total) * 100)) : 0;

  const fmt = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 rounded-lg border bg-gradient-to-br from-muted/40 to-muted/10 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total budget
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
            {fmt.format(total)}
          </p>
        </div>
        <div className="rounded-full bg-background/80 p-2 shadow-sm ring-1 ring-border">
          <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Spent</span>
          <span className="tabular-nums text-foreground">{fmt.format(spent)}</span>
        </div>
        <Progress
          value={overBudget ? 100 : pct}
          className={cn(
            "h-2.5",
            overBudget &&
              "bg-destructive/20 [&_[data-slot=progress-indicator]]:bg-destructive"
          )}
        />
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="text-muted-foreground">Remaining</span>
          {total <= 0 ? (
            <span className="font-medium tabular-nums text-muted-foreground">
              —
            </span>
          ) : remaining < 0 ? (
            <span className="font-semibold tabular-nums text-destructive">
              Over by {fmt.format(-remaining)}
            </span>
          ) : (
            <span className="font-semibold tabular-nums text-foreground">
              {fmt.format(remaining)}
            </span>
          )}
        </div>
        {overBudget ? (
          <p className="text-xs text-destructive">
            Spending has exceeded the allocated budget.
          </p>
        ) : null}
      </div>
    </div>
  );
}
