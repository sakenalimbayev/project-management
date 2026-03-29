"use client";

import { ProjectBudgetWidget } from "@/components/project-budget-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type ProjectBudgetSectionProps = {
  projectId: string;
  totalBudget: string;
  spentAmount: string;
  canEdit: boolean;
};

export function ProjectBudgetSection({
  projectId,
  totalBudget,
  spentAmount,
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
      setError("Total budget must be a positive number.");
      return;
    }
    if (Number.isNaN(spentNum) || spentNum < 0) {
      setError("Spent amount must be zero or a positive number.");
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
          typeof json?.error === "string" ? json.error : "Could not save budget."
        );
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Budget</CardTitle>
          {canEdit ? (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => handleOpenChange(true)}
            >
              Edit
            </Button>
          ) : null}
        </div>
        {canEdit ? (
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit budget</DialogTitle>
                <DialogDescription>
                  Update total allocation and amount spent. Global admins and
                  project administrators can change these values.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <Field>
                  <FieldLabel htmlFor="edit-total-budget">
                    Total budget
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
                    Full budget allocated to this project.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-spent-amount">
                    Amount spent
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
                    Total spent to date (can exceed total for tracking
                    overruns).
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
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        <ProjectBudgetWidget
          totalBudget={totalBudget}
          spentAmount={spentAmount}
        />
      </CardContent>
    </Card>
  );
}
