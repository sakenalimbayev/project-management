"use client";

import { ProjectBudgetWidget } from "@/components/project-budget-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FundingSource } from "@/app/generated/prisma";
import { FUNDING_SOURCE_LABELS } from "@/lib/funding-source";
import type { ProjectWithRelations } from "@/types/project";

type ProjectBudgetSectionProps = {
  projectId: string;
  totalBudget: string;
  spentAmount: string;
  fundingSources?: FundingSource[];
  yearlyBudgets?: NonNullable<ProjectWithRelations["yearlyBudgets"]>;
  canEdit: boolean;
};

export function ProjectBudgetSection({
  projectId,
  totalBudget,
  spentAmount,
  fundingSources = [],
  yearlyBudgets = [],
  canEdit,
}: ProjectBudgetSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(totalBudget);
  const [spent, setSpent] = useState(spentAmount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTotal(totalBudget);
    setSpent(spentAmount);
  }, [totalBudget, spentAmount]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setTotal(totalBudget);
      setSpent(spentAmount);
      setError(null);
    }
  };

  const handleSave = async () => {
    setError(null);
    const totalNum = Number(total);
    const spentNum = Number(spent);
    if (Number.isNaN(totalNum) || totalNum <= 0) {
      setError("Общий бюджет должен быть положительным числом.");
      return;
    }
    if (Number.isNaN(spentNum) || spentNum < 0) {
      setError("Потраченная сумма должна быть нулём или положительным числом.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/project/${projectId}/budget`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalBudget: totalNum.toString(),
          spentAmount: spentNum.toString(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof json?.error === "string" ? json.error : "Не удалось сохранить бюджет."
        );
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте снова.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Бюджет проекта</CardTitle>
          {canEdit ? (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => handleOpenChange(true)}
            >
              <Pencil className="h-4 w-4" />
              Редактировать
            </Button>
          ) : null}
        </div>
        {canEdit ? (
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Изменить бюджет</DialogTitle>
                <DialogDescription>
                  Обновите общий бюджет и потраченную сумму. Изменять эти
                  значения могут глобальные администраторы и администраторы
                  проекта.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <Field>
                  <FieldLabel htmlFor="edit-total-budget">
                    Общий бюджет
                  </FieldLabel>
                  <Input
                    id="edit-total-budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                  />
                  <FieldDescription>
                    Полный бюджет, выделенный на этот проект.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-spent-amount">
                    Потрачено
                  </FieldLabel>
                  <Input
                    id="edit-spent-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={spent}
                    onChange={(e) => setSpent(e.target.value)}
                  />
                  <FieldDescription>
                    Сумма, потраченная на данный момент (может превышать
                    бюджет для отслеживания перерасхода).
                  </FieldDescription>
                </Field>
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={saving}
                >
                  Отмена
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? "Сохранение…" : "Сохранить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <ProjectBudgetWidget
          totalBudget={totalBudget}
          spentAmount={spentAmount}
        />
        {fundingSources.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Источники финансирования
            </p>
            <div className="flex flex-wrap gap-1.5">
              {fundingSources.map((source) => (
                <span
                  key={source}
                  className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                >
                  {FUNDING_SOURCE_LABELS[source]}
                </span>
              ))}
            </div>
          </div>
        )}
        {yearlyBudgets.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Бюджет по годам
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[280px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-1.5 pr-3 font-medium">Год</th>
                    <th className="py-1.5 pr-3 font-medium">План</th>
                    <th className="py-1.5 font-medium">Факт</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyBudgets.map((y) => (
                    <tr key={y.id} className="border-b last:border-0">
                      <td className="py-1.5 pr-3">{y.year}</td>
                      <td className="py-1.5 pr-3">{Number(y.plannedAmount).toLocaleString("ru-RU")}</td>
                      <td className="py-1.5">{Number(y.actualAmount).toLocaleString("ru-RU")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
