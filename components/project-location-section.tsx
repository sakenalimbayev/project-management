"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
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
import { LocationMapWidget } from "@/components/location-map-widget";
import { cn } from "@/lib/utils";

type LocationOption = {
  id: string;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

function locationLabel(location: { city: string | null; region: string | null }): string {
  if (location.city && location.region) return `${location.city}, ${location.region}`;
  return location.city ?? location.region ?? "Без названия";
}

type ProjectLocationSectionProps = {
  projectId: string;
  location: LocationOption;
  canEdit: boolean;
};

export function ProjectLocationSection({
  projectId,
  location,
  canEdit,
}: ProjectLocationSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [locationId, setLocationId] = useState(location.id);
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setLocationId(location.id);
      setError(null);
      setLoadingOptions(true);
      fetch("/api/location")
        .then((res) => res.json())
        .then((json) => setOptions(json?.data ?? []))
        .catch(() => setError("Не удалось загрузить список регионов."))
        .finally(() => setLoadingOptions(false));
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/project/${projectId}/location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json?.error === "string" ? json.error : "Не удалось сохранить регион.");
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
          <CardTitle>Регион реализации</CardTitle>
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
                <DialogTitle>Изменить регион реализации</DialogTitle>
                <DialogDescription>
                  Выберите регион из списка доступных в системе.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <Field>
                  <FieldLabel htmlFor="edit-project-location">Регион</FieldLabel>
                  {loadingOptions ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Загрузка списка регионов…
                    </p>
                  ) : (
                    <select
                      id="edit-project-location"
                      className={cn(selectClassName)}
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                    >
                      {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {locationLabel(opt)}
                        </option>
                      ))}
                    </select>
                  )}
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
                <Button type="button" onClick={handleSave} disabled={saving || loadingOptions}>
                  {saving ? "Сохранение…" : "Сохранить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        <LocationMapWidget
          city={location.city}
          region={location.region}
          latitude={location.latitude}
          longitude={location.longitude}
        />
      </CardContent>
    </Card>
  );
}
