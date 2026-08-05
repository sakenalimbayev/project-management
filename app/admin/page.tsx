"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarRange,
  CheckCircle2,
  MapPin,
  Plus,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FieldSet,
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StageStatus } from "@/app/generated/prisma";
import { STAGE_STATUS_LABELS } from "@/lib/stage-status";

type ProjectFormState = {
  name: string;
  description: string;
  totalBudget: string;
  spentAmount: string;
  ownerId: string;
  ministryId: string;
  locationId: string;
};

type StageFormRow = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  status: StageStatus;
  plannedBudget: string;
};

function emptyStageRow(): StageFormRow {
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

export default function AdminPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormState>({
    name: "",
    description: "",
    totalBudget: "",
    spentAmount: "",
    ownerId: "",
    ministryId: "",
    locationId: "",
  });
  const [stages, setStages] = useState<StageFormRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [ministries, setMinistries] = useState<Array<{ id: string; name: string }>>([]);
  const [locations, setLocations] = useState<Array<{ id: string; city: string | null; region: string | null }>>([]);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ministrySearch, setMinistrySearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          setIsCheckingAuth(false);
          setIsAuthorized(false);
          return;
        }
        const data = await res.json();
        const role = data?.user?.role;
        if (role === "ADMIN") {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch {
        setIsAuthorized(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, ministriesRes, locationsRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/ministry"),
          fetch("/api/location"),
        ]);

        const usersJson = await usersRes.json();
        const ministriesJson = await ministriesRes.json();
        const locationsJson = await locationsRes.json();

        setUsers(
          (usersJson?.data ?? []).map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
          }))
        );
        setMinistries(ministriesJson?.data ?? []);
        setLocations(locationsJson?.data ?? []);
      } catch {
        // swallow; form will still be usable if these fail
      }
    };

    loadData();
  }, []);

  const handleChange =
    (field: keyof ProjectFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      };

  const updateStage = (key: string, patch: Partial<StageFormRow>) => {
    setStages((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const removeStage = (key: string) => {
    setStages((prev) => prev.filter((s) => s.key !== key));
  };

  const numericTotalBudget = Number(form.totalBudget) || 0;
  const stagesBudgetSum = useMemo(
    () => stages.reduce((sum, s) => sum + (Number(s.plannedBudget) || 0), 0),
    [stages]
  );
  const stagesBudgetExceeded = stagesBudgetSum > numericTotalBudget;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.name || !form.totalBudget || !form.ownerId || !form.ministryId || !form.locationId) {
      setError("Заполните все обязательные поля.");
      return;
    }

    const numericTotal = Number(form.totalBudget);
    if (Number.isNaN(numericTotal) || numericTotal <= 0) {
      setError("Общий бюджет должен быть положительным числом.");
      return;
    }

    const spentRaw = form.spentAmount.trim();
    const numericSpent = spentRaw === "" ? 0 : Number(spentRaw);
    if (Number.isNaN(numericSpent) || numericSpent < 0) {
      setError("Сумма уже потраченного должна быть нулем или положительным числом.");
      return;
    }

    const trimmedStages = stages.filter((s) => s.label.trim());
    for (let i = 0; i < trimmedStages.length; i++) {
      const s = trimmedStages[i];
      if (!s.startDate || !s.endDate) {
        setError(`Этап ${i + 1}: укажите даты начала и окончания.`);
        return;
      }
      if (s.endDate < s.startDate) {
        setError(`Этап ${i + 1}: дата окончания не может быть раньше даты начала.`);
        return;
      }
      const stageBudget = Number(s.plannedBudget);
      if (Number.isNaN(stageBudget) || stageBudget < 0) {
        setError(`Этап ${i + 1}: плановый бюджет должен быть неотрицательным числом.`);
        return;
      }
    }
    const stagesSum = trimmedStages.reduce((sum, s) => sum + Number(s.plannedBudget), 0);
    if (stagesSum > numericTotal) {
      setError(
        `Сумма бюджетов этапов (${stagesSum.toLocaleString("ru-RU")}) не может превышать общий бюджет проекта (${numericTotal.toLocaleString("ru-RU")}).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          totalBudget: numericTotal.toString(),
          spentAmount: numericSpent.toString(),
          ownerId: form.ownerId,
          ministryId: form.ministryId,
          locationId: form.locationId,
          status: "PLANNED",
          stages: trimmedStages.map((s) => ({
            label: s.label.trim(),
            startDate: s.startDate,
            endDate: s.endDate,
            status: s.status,
            plannedBudget: s.plannedBudget,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Не удалось создать проект.");
        return;
      }

      router.push(`/project/${data.project.id}`);
    } catch {
      setError("Непредвиденная ошибка при создании проекта.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOwners = useMemo(
    () =>
      users.filter((u) => {
        const term = ownerSearch.toLowerCase();
        return (
          !term ||
          u.email.toLowerCase().includes(term) ||
          (u.name ?? "").toLowerCase().includes(term)
        );
      }),
    [users, ownerSearch]
  );

  const filteredMinistries = useMemo(
    () =>
      ministries.filter((m) =>
        !ministrySearch
          ? true
          : m.name.toLowerCase().includes(ministrySearch.toLowerCase())
      ),
    [ministries, ministrySearch]
  );

  const filteredLocations = useMemo(
    () =>
      locations.filter((l) => {
        const label = `${l.city ?? ""} ${l.region ?? ""}`.toLowerCase();
        return !locationSearch || label.includes(locationSearch.toLowerCase());
      }),
    [locations, locationSearch]
  );

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Typography variant="muted">Проверка прав доступа…</Typography>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Typography variant="muted">
          У вас нет доступа к этой странице.
        </Typography>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Button asChild variant="outline" size="sm" className="mb-6">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Назад к проектам
        </Link>
      </Button>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <CalendarRange className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Создание нового проекта</h1>
          <p className="text-sm text-muted-foreground">
            Заполните информацию о проекте для его создания
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <FieldSet>
            <FieldGroup className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="name">
                  Название проекта <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="name"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Введите название проекта"
                  required
                />
                <FieldDescription>
                  Укажите полное и понятное название проекта
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Описание</FieldLabel>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={handleChange("description")}
                  placeholder="Введите описание проекта (необязательно)"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                />
                <FieldDescription>
                  Краткое описание целей и задач проекта
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="totalBudget">
                  Общий бюджет <span className="text-red-500">*</span>
                </FieldLabel>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                  <Input
                    id="totalBudget"
                    value={form.totalBudget}
                    onChange={handleChange("totalBudget")}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Например, 700000"
                    className="pl-9"
                    required
                  />
                </div>
                <FieldDescription>
                  Полный выделенный бюджет на проект (например, 700000)
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="spentAmount">Уже потрачено</FieldLabel>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                  <Input
                    id="spentAmount"
                    value={form.spentAmount}
                    onChange={handleChange("spentAmount")}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="pl-9"
                  />
                </div>
                <FieldDescription>
                  Сумма уже использованных средств (по умолчанию: 0)
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>
                  Владелец проекта <span className="text-red-500">*</span>
                </FieldLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-start gap-2 font-normal">
                      <User className="h-4 w-4 text-blue-500" />
                      {form.ownerId
                        ? users.find((u) => u.id === form.ownerId)?.email ?? "Выберите владельца"
                        : "Выберите владельца"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72">
                    <DropdownMenuLabel>Поиск владельца</DropdownMenuLabel>
                    <div className="px-2 pb-2">
                      <Input
                        placeholder="Поиск по имени или email"
                        value={ownerSearch}
                        onChange={(e) => setOwnerSearch(e.target.value)}
                      />
                    </div>
                    <DropdownMenuSeparator />
                    {filteredOwners.map((user) => (
                      <DropdownMenuItem
                        key={user.id}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, ownerId: user.id }))
                        }
                        className={cn(
                          "flex flex-col items-start",
                          form.ownerId === user.id && "bg-accent"
                        )}
                      >
                        <span className="text-sm font-medium">
                          {user.name ?? user.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    {filteredOwners.length === 0 && (
                      <DropdownMenuItem disabled>Пользователи не найдены</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <FieldDescription>
                  Только существующие пользователи могут быть владельцами проектов
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>
                  Министерство <span className="text-red-500">*</span>
                </FieldLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-start gap-2 font-normal">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      {form.ministryId
                        ? ministries.find((m) => m.id === form.ministryId)?.name ??
                        "Выберите министерство"
                        : "Выберите министерство"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72">
                    <DropdownMenuLabel>Поиск министерства</DropdownMenuLabel>
                    <div className="px-2 pb-2">
                      <Input
                        placeholder="Поиск министерств"
                        value={ministrySearch}
                        onChange={(e) => setMinistrySearch(e.target.value)}
                      />
                    </div>
                    <DropdownMenuSeparator />
                    {filteredMinistries.map((ministry) => (
                      <DropdownMenuItem
                        key={ministry.id}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, ministryId: ministry.id }))
                        }
                        className={cn(
                          form.ministryId === ministry.id && "bg-accent"
                        )}
                      >
                        {ministry.name}
                      </DropdownMenuItem>
                    ))}
                    {filteredMinistries.length === 0 && (
                      <DropdownMenuItem disabled>Министерства не найдены</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <FieldDescription>
                  Выберите государственный орган (министерство)
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>
                  Регион <span className="text-red-500">*</span>
                </FieldLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-start gap-2 font-normal">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      {form.locationId
                        ? (() => {
                          const loc = locations.find(
                            (l) => l.id === form.locationId
                          );
                          if (!loc) return "Выберите регион";
                          return loc.city ?? loc.region ?? "Без названия";
                        })()
                        : "Выберите регион"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72">
                    <DropdownMenuLabel>Поиск региона</DropdownMenuLabel>
                    <div className="px-2 pb-2">
                      <Input
                        placeholder="Поиск регионов"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                      />
                    </div>
                    <DropdownMenuSeparator />
                    {filteredLocations.map((loc) => (
                      <DropdownMenuItem
                        key={loc.id}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, locationId: loc.id }))
                        }
                        className={cn(
                          form.locationId === loc.id && "bg-accent"
                        )}
                      >
                        {loc.city ?? loc.region ?? "Без названия"}
                      </DropdownMenuItem>
                    ))}
                    {filteredLocations.length === 0 && (
                      <DropdownMenuItem disabled>Регионы не найдены</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <FieldDescription>
                  Выберите регион реализации проекта
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Этапы проекта</h2>
            <p className="text-sm text-muted-foreground">
              Определите план-график и плановый бюджет по этапам (необязательно)
            </p>
          </div>

          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div
                key={stage.key}
                className="space-y-3 rounded-md border border-border p-3"
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
                    onClick={() => removeStage(stage.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                </div>
                <Input
                  placeholder="Название этапа"
                  value={stage.label}
                  onChange={(e) => updateStage(stage.key, { label: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Дата начала
                    </label>
                    <Input
                      type="date"
                      value={stage.startDate}
                      onChange={(e) => updateStage(stage.key, { startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Дата окончания
                    </label>
                    <Input
                      type="date"
                      value={stage.endDate}
                      onChange={(e) => updateStage(stage.key, { endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Плановый бюджет
                    </label>
                    <div className="relative">
                      <Wallet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={stage.plannedBudget}
                        onChange={(e) => updateStage(stage.key, { plannedBudget: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Статус
                    </label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      value={stage.status}
                      onChange={(e) =>
                        updateStage(stage.key, { status: e.target.value as StageStatus })
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
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setStages((prev) => [...prev, emptyStageRow()])}
            >
              <Plus className="h-4 w-4" />
              Добавить этап
            </Button>

            {stages.length > 0 && (
              <p
                className={cn(
                  "text-xs",
                  stagesBudgetExceeded ? "text-destructive" : "text-muted-foreground"
                )}
              >
                Бюджет по этапам: {stagesBudgetSum.toLocaleString("ru-RU")} из{" "}
                {numericTotalBudget.toLocaleString("ru-RU")}
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/")}>
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting || stagesBudgetExceeded}>
            {isSubmitting ? "Создание проекта…" : "Создать проект"}
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
