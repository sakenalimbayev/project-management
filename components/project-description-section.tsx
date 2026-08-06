"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { ProjectDescriptionDialog } from "@/components/dialog/project-description-dialog";

type ProjectDescriptionSectionProps = {
  projectId: string;
  description: string | null;
  canEdit: boolean;
};

export function ProjectDescriptionSection({
  projectId,
  description,
  canEdit,
}: ProjectDescriptionSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(description ?? "");
  }, [description]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setValue(description ?? "");
      setError(null);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/project/${projectId}/description`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: value.trim() || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json?.error === "string" ? json.error : "Не удалось сохранить описание.");
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
          <CardTitle>Описание проекта</CardTitle>
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
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Изменить описание</DialogTitle>
                <DialogDescription>
                  Обновите описание проекта. Оно отображается на странице проекта и видно всем
                  пользователям.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <Field>
                  <FieldLabel htmlFor="edit-project-description">Описание проекта</FieldLabel>
                  <textarea
                    id="edit-project-description"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Введите описание проекта"
                    rows={8}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  />
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
      <CardContent>
        <p className="line-clamp-6 whitespace-pre-line text-sm leading-7 text-gray-700">
          {description || "Описание отсутствует."}
        </p>
        {description && (
          <div className="mt-3">
            <ProjectDescriptionDialog projectDescription={description} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
