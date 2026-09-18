"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarRange,
  CheckCircle2,
  Eye,
  Globe2,
  Landmark,
  Mail,
  MapPin,
  Plus,
  Tag,
  Target,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BulkImportProjectsDialog } from "@/components/dialog/bulk-import-projects-dialog";
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
import type {
  FundingSource,
  ProjectScale,
  ProjectStatus,
  ProjectType,
  ProjectVisibility,
  StageStatus,
} from "@/app/generated/prisma";
import { STAGE_STATUS_LABELS } from "@/lib/stage-status";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_ORDER } from "@/lib/project-status";
import { PROJECT_TYPE_LABELS, PROJECT_TYPE_ORDER } from "@/lib/project-type";
import { PROJECT_SCALE_LABELS, PROJECT_SCALE_ORDER, SCALES_REQUIRING_LOCATION } from "@/lib/project-scale";
import { FUNDING_SOURCE_LABELS, FUNDING_SOURCE_ORDER } from "@/lib/funding-source";
import { PROJECT_VISIBILITY_LABELS, PROJECT_VISIBILITY_ORDER } from "@/lib/project-visibility";
import { PROJECT_CATEGORY_SUGGESTIONS } from "@/lib/project-category";
import { DOCUMENT_TYPE_SUGGESTIONS } from "@/lib/document-type";
import { formatFileSize } from "@/lib/format-file-size";
import { uploadProjectDocuments } from "@/services/api/projects/documents";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const SHORT_DESCRIPTION_MAX_LENGTH = 200;

type ProjectFormState = {
  name: string;
  shortName: string;
  description: string;
  category: string;
  projectType: ProjectType | "";
  ministryId: string;
  responsibleOrganization: string;
  projectManagerName: string;
  officialContactEmail: string;
  ownerId: string;
  goal: string;
  scale: ProjectScale | "";
  locationId: string;
  startDate: string;
  plannedEndDate: string;
  actualEndDate: string;
  status: ProjectStatus;
  totalBudget: string;
  spentAmount: string;
  infoAsOfDate: string;
  nextUpdateDate: string;
  visibility: ProjectVisibility;
};

type StageFormRow = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  status: StageStatus;
  plannedBudget: string;
};

type KpiFormRow = {
  key: string;
  name: string;
  baselineValue: string;
  targetValue: string;
  unit: string;
};

type YearlyBudgetFormRow = {
  key: string;
  year: string;
  plannedAmount: string;
  actualAmount: string;
};

type DocumentFileRow = {
  key: string;
  file: File;
  documentType: string;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

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

function emptyKpiRow(): KpiFormRow {
  return {
    key: crypto.randomUUID(),
    name: "",
    baselineValue: "",
    targetValue: "",
    unit: "",
  };
}

function emptyYearlyBudgetRow(): YearlyBudgetFormRow {
  return {
    key: crypto.randomUUID(),
    year: String(new Date().getFullYear()),
    plannedAmount: "0",
    actualAmount: "0",
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormState>({
    name: "",
    shortName: "",
    description: "",
    category: "",
    projectType: "",
    ministryId: "",
    responsibleOrganization: "",
    projectManagerName: "",
    officialContactEmail: "",
    ownerId: "",
    goal: "",
    scale: "",
    locationId: "",
    startDate: today(),
    plannedEndDate: "",
    actualEndDate: "",
    status: "PLANNED",
    totalBudget: "",
    spentAmount: "",
    infoAsOfDate: today(),
    nextUpdateDate: "",
    visibility: "DRAFT",
  });
  const [stages, setStages] = useState<StageFormRow[]>([]);
  const [kpis, setKpis] = useState<KpiFormRow[]>([]);
  const [yearlyBudgets, setYearlyBudgets] = useState<YearlyBudgetFormRow[]>([]);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [documentFiles, setDocumentFiles] = useState<DocumentFileRow[]>([]);
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

  const updateKpi = (key: string, patch: Partial<KpiFormRow>) => {
    setKpis((prev) => prev.map((k) => (k.key === key ? { ...k, ...patch } : k)));
  };

  const removeKpi = (key: string) => {
    setKpis((prev) => prev.filter((k) => k.key !== key));
  };

  const updateYearlyBudget = (key: string, patch: Partial<YearlyBudgetFormRow>) => {
    setYearlyBudgets((prev) => prev.map((y) => (y.key === key ? { ...y, ...patch } : y)));
  };

  const removeYearlyBudget = (key: string) => {
    setYearlyBudgets((prev) => prev.filter((y) => y.key !== key));
  };

  const toggleFundingSource = (source: FundingSource) => {
    setFundingSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const handleDocumentFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).map((file) => ({
      key: crypto.randomUUID(),
      file,
      documentType: "",
    }));
    setDocumentFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeDocumentFile = (key: string) => {
    setDocumentFiles((prev) => prev.filter((f) => f.key !== key));
  };

  const updateDocumentType = (key: string, documentType: string) => {
    setDocumentFiles((prev) => prev.map((f) => (f.key === key ? { ...f, documentType } : f)));
  };

  const numericTotalBudget = Number(form.totalBudget) || 0;
  const stagesBudgetSum = useMemo(
    () => stages.reduce((sum, s) => sum + (Number(s.plannedBudget) || 0), 0),
    [stages]
  );
  const stagesBudgetExceeded = stagesBudgetSum > numericTotalBudget;
  const locationRequired = form.scale !== "" && SCALES_REQUIRING_LOCATION.includes(form.scale as ProjectScale);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (
      !form.name ||
      !form.description ||
      !form.projectType ||
      !form.ministryId ||
      !form.ownerId ||
      !form.goal ||
      !form.scale ||
      !form.startDate ||
      !form.plannedEndDate ||
      !form.totalBudget ||
      !form.infoAsOfDate
    ) {
      setError("Заполните все обязательные поля.");
      return;
    }

    if (form.description.length > SHORT_DESCRIPTION_MAX_LENGTH) {
      setError(`Краткое описание не должно превышать ${SHORT_DESCRIPTION_MAX_LENGTH} символов.`);
      return;
    }

    if (locationRequired && !form.locationId) {
      setError("Для выбранного масштаба необходимо указать регион/населённый пункт.");
      return;
    }

    if (form.plannedEndDate < form.startDate) {
      setError("Плановая дата завершения не может быть раньше даты начала.");
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

    const trimmedKpis = kpis.filter((k) => k.name.trim());
    for (let i = 0; i < trimmedKpis.length; i++) {
      const k = trimmedKpis[i];
      if (!k.baselineValue.trim() || !k.targetValue.trim()) {
        setError(`Показатель ${i + 1}: укажите исходное и целевое значения.`);
        return;
      }
    }

    const trimmedYearlyBudgets = yearlyBudgets.filter((y) => y.year.trim());
    const seenYears = new Set<string>();
    for (let i = 0; i < trimmedYearlyBudgets.length; i++) {
      const y = trimmedYearlyBudgets[i];
      const yearNum = Number(y.year);
      if (!Number.isInteger(yearNum)) {
        setError(`Бюджет по годам, строка ${i + 1}: укажите корректный год.`);
        return;
      }
      if (seenYears.has(y.year)) {
        setError(`Бюджет по годам: год ${y.year} указан более одного раза.`);
        return;
      }
      seenYears.add(y.year);
      const planned = Number(y.plannedAmount);
      if (Number.isNaN(planned) || planned < 0) {
        setError(`Бюджет по годам, ${y.year}: плановая сумма должна быть неотрицательным числом.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          shortName: form.shortName || null,
          description: form.description,
          category: form.category || null,
          projectType: form.projectType,
          ministryId: form.ministryId,
          responsibleOrganization: form.responsibleOrganization || null,
          projectManagerName: form.projectManagerName || null,
          officialContactEmail: form.officialContactEmail || null,
          ownerId: form.ownerId,
          goal: form.goal,
          kpis: trimmedKpis.map((k) => ({
            name: k.name.trim(),
            baselineValue: k.baselineValue.trim(),
            targetValue: k.targetValue.trim(),
            unit: k.unit.trim() || null,
          })),
          scale: form.scale,
          locationId: form.locationId || null,
          startDate: form.startDate,
          plannedEndDate: form.plannedEndDate,
          actualEndDate: form.actualEndDate || null,
          fundingSources,
          totalBudget: numericTotal.toString(),
          spentAmount: numericSpent.toString(),
          yearlyBudgets: trimmedYearlyBudgets.map((y) => ({
            year: Number(y.year),
            plannedAmount: y.plannedAmount,
            actualAmount: y.actualAmount || "0",
          })),
          infoAsOfDate: form.infoAsOfDate,
          nextUpdateDate: form.nextUpdateDate || null,
          visibility: form.visibility,
          status: form.status,
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

      if (documentFiles.length > 0) {
        try {
          await uploadProjectDocuments(
            data.project.id,
            documentFiles.map((f) => f.file),
            documentFiles.map((f) => f.documentType || null)
          );
        } catch {
          // Project was already created; documents can be added from its page.
        }
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

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
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
        <BulkImportProjectsDialog />
      </div>

      <form onSubmit={handleSubmit}>
        {/* 1. Основная информация */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Основная информация</h2>
          </div>
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
                  placeholder="Введите полное название проекта"
                  required
                />
                <FieldDescription>
                  Полное официальное наименование проекта
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="shortName">Краткое название / код проекта</FieldLabel>
                <Input
                  id="shortName"
                  value={form.shortName}
                  onChange={handleChange("shortName")}
                  placeholder="Например, ИС Госуслуги 2.0"
                />
                <FieldDescription>
                  Удобное сокращённое наименование для интерфейса
                </FieldDescription>
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="description">
                  Краткое описание проекта <span className="text-red-500">*</span>
                </FieldLabel>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={handleChange("description")}
                  placeholder="Опишите простым языком, какую проблему решает проект и что будет создано"
                  maxLength={SHORT_DESCRIPTION_MAX_LENGTH}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  required
                />
                <FieldDescription>
                  {form.description.length}/{SHORT_DESCRIPTION_MAX_LENGTH} символов
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="category">Категория / направление цифровизации</FieldLabel>
                <div className="relative">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                  <Input
                    id="category"
                    list="category-suggestions"
                    value={form.category}
                    onChange={handleChange("category")}
                    placeholder="Например, Электронное правительство"
                    className="pl-9"
                  />
                  <datalist id="category-suggestions">
                    {PROJECT_CATEGORY_SUGGESTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="projectType">
                  Тип проекта <span className="text-red-500">*</span>
                </FieldLabel>
                <select
                  id="projectType"
                  className={selectClassName}
                  value={form.projectType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, projectType: e.target.value as ProjectType }))
                  }
                  required
                >
                  <option value="" disabled>
                    Выберите тип проекта
                  </option>
                  {PROJECT_TYPE_ORDER.map((t) => (
                    <option key={t} value={t}>
                      {PROJECT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </Field>
            </FieldGroup>
          </FieldSet>
        </div>

        {/* 2. Ответственный государственный орган */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Ответственный государственный орган
            </h2>
          </div>
          <FieldSet>
            <FieldGroup className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              <Field>
                <FieldLabel>
                  Государственный орган <span className="text-red-500">*</span>
                </FieldLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-start gap-2 font-normal">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      {form.ministryId
                        ? ministries.find((m) => m.id === form.ministryId)?.name ??
                        "Выберите орган"
                        : "Выберите орган"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72">
                    <DropdownMenuLabel>Поиск</DropdownMenuLabel>
                    <div className="px-2 pb-2">
                      <Input
                        placeholder="Поиск государственных органов"
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
                      <DropdownMenuItem disabled>Не найдено</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <FieldDescription>
                  Министерство, акимат или иной государственный орган
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="responsibleOrganization">
                  Подведомственная организация / оператор
                </FieldLabel>
                <div className="relative">
                  <Landmark className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                  <Input
                    id="responsibleOrganization"
                    value={form.responsibleOrganization}
                    onChange={handleChange("responsibleOrganization")}
                    placeholder='Например, АО «...»'
                    className="pl-9"
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="projectManagerName">Руководитель проекта</FieldLabel>
                <Input
                  id="projectManagerName"
                  value={form.projectManagerName}
                  onChange={handleChange("projectManagerName")}
                  placeholder="ФИО ответственного руководителя"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="officialContactEmail">Официальный контакт</FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                  <Input
                    id="officialContactEmail"
                    type="email"
                    value={form.officialContactEmail}
                    onChange={handleChange("officialContactEmail")}
                    placeholder="project@gov.kz"
                    className="pl-9"
                  />
                </div>
                <FieldDescription>
                  Контакт для официальных запросов
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>
                  Владелец проекта в системе <span className="text-red-500">*</span>
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
            </FieldGroup>
          </FieldSet>
        </div>

        {/* 3. Цель и ключевые показатели */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Цель проекта</h2>
          </div>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="goal">
                  Цель проекта <span className="text-red-500">*</span>
                </FieldLabel>
                <div className="relative">
                  <Target className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-blue-500" />
                  <textarea
                    id="goal"
                    value={form.goal}
                    onChange={handleChange("goal")}
                    placeholder="Конкретная и, по возможности, измеримая цель"
                    className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent py-2 pl-9 pr-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    required
                  />
                </div>
              </Field>
            </FieldGroup>
          </FieldSet>

          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-gray-900">Ключевые показатели (KPI)</p>
            {kpis.map((kpi, index) => (
              <div key={kpi.key} className="space-y-3 rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Показатель {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive"
                    onClick={() => removeKpi(kpi.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                </div>
                <Input
                  placeholder="Наименование показателя"
                  value={kpi.name}
                  onChange={(e) => updateKpi(kpi.key, { name: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder="Исходное значение"
                    value={kpi.baselineValue}
                    onChange={(e) => updateKpi(kpi.key, { baselineValue: e.target.value })}
                  />
                  <Input
                    placeholder="Целевое значение"
                    value={kpi.targetValue}
                    onChange={(e) => updateKpi(kpi.key, { targetValue: e.target.value })}
                  />
                  <Input
                    placeholder="Единица измерения"
                    value={kpi.unit}
                    onChange={(e) => updateKpi(kpi.key, { unit: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setKpis((prev) => [...prev, emptyKpiRow()])}
            >
              <Plus className="h-4 w-4" />
              Добавить показатель
            </Button>
          </div>
        </div>

        {/* 4. География */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">География</h2>
          </div>
          <FieldSet>
            <FieldGroup className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="scale">
                  Масштаб проекта <span className="text-red-500">*</span>
                </FieldLabel>
                <div className="relative">
                  <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                  <select
                    id="scale"
                    className={cn(selectClassName, "pl-9")}
                    value={form.scale}
                    onChange={(e) => {
                      const nextScale = e.target.value as ProjectScale;
                      setForm((prev) => ({
                        ...prev,
                        scale: nextScale,
                        locationId: SCALES_REQUIRING_LOCATION.includes(nextScale)
                          ? prev.locationId
                          : "",
                      }));
                    }}
                    required
                  >
                    <option value="" disabled>
                      Выберите масштаб
                    </option>
                    {PROJECT_SCALE_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {PROJECT_SCALE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
              {locationRequired && (
                <Field>
                  <FieldLabel>
                    Регион / населённый пункт <span className="text-red-500">*</span>
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
                </Field>
              )}
            </FieldGroup>
          </FieldSet>
        </div>

        {/* 5. Сроки и статус */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Сроки и статус</h2>
          </div>
          <FieldSet>
            <FieldGroup className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="startDate">
                  Дата начала <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange("startDate")}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="plannedEndDate">
                  Плановая дата завершения <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="plannedEndDate"
                  type="date"
                  value={form.plannedEndDate}
                  onChange={handleChange("plannedEndDate")}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="actualEndDate">Фактическая дата завершения</FieldLabel>
                <Input
                  id="actualEndDate"
                  type="date"
                  value={form.actualEndDate}
                  onChange={handleChange("actualEndDate")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="status">
                  Статус проекта <span className="text-red-500">*</span>
                </FieldLabel>
                <select
                  id="status"
                  className={selectClassName}
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value as ProjectStatus }))
                  }
                >
                  {PROJECT_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {PROJECT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>
            </FieldGroup>
          </FieldSet>
        </div>

        {/* Этапы проекта */}
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
                      className={selectClassName}
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

        {/* 6. Финансирование */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Финансирование</h2>
          </div>
          <FieldSet>
            <FieldGroup className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
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
              </Field>
            </FieldGroup>
          </FieldSet>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-gray-900">Источник финансирования</p>
            <div className="flex flex-wrap gap-2">
              {FUNDING_SOURCE_ORDER.map((source) => (
                <label
                  key={source}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm",
                    fundingSources.includes(source)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-input"
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5"
                    checked={fundingSources.includes(source)}
                    onChange={() => toggleFundingSource(source)}
                  />
                  {FUNDING_SOURCE_LABELS[source]}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-gray-900">Бюджет по годам</p>
            {yearlyBudgets.map((row, index) => (
              <div key={row.key} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3">
                <div>
                  {index === 0 && (
                    <label className="mb-1 block text-xs text-muted-foreground">Год</label>
                  )}
                  <Input
                    type="number"
                    value={row.year}
                    onChange={(e) => updateYearlyBudget(row.key, { year: e.target.value })}
                  />
                </div>
                <div>
                  {index === 0 && (
                    <label className="mb-1 block text-xs text-muted-foreground">План</label>
                  )}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.plannedAmount}
                    onChange={(e) => updateYearlyBudget(row.key, { plannedAmount: e.target.value })}
                  />
                </div>
                <div>
                  {index === 0 && (
                    <label className="mb-1 block text-xs text-muted-foreground">Факт</label>
                  )}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.actualAmount}
                    onChange={(e) => updateYearlyBudget(row.key, { actualAmount: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => removeYearlyBudget(row.key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setYearlyBudgets((prev) => [...prev, emptyYearlyBudgetRow()])}
            >
              <Plus className="h-4 w-4" />
              Добавить год
            </Button>
          </div>
        </div>

        {/* 7. Документы */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Подтверждающие документы</h2>
            <p className="text-sm text-muted-foreground">
              Прикрепите публичные документы проекта (необязательно)
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
              onChange={handleDocumentFilesChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent text-sm shadow-xs outline-none file:mr-3 file:h-full file:border-0 file:border-r file:border-input file:bg-muted file:px-3 file:text-sm file:font-medium focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
            {documentFiles.length > 0 && (
              <ul className="space-y-2">
                {documentFiles.map((entry) => (
                  <li
                    key={entry.key}
                    className="space-y-2 rounded-md border p-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate">{entry.file.name}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(entry.file.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDocumentFile(entry.key)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Удалить файл"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <input
                      list="document-type-suggestions"
                      value={entry.documentType}
                      onChange={(e) => updateDocumentType(entry.key, e.target.value)}
                      placeholder="Тип документа (например, Паспорт проекта)"
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    />
                  </li>
                ))}
                <datalist id="document-type-suggestions">
                  {DOCUMENT_TYPE_SUGGESTIONS.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </ul>
            )}
          </div>
        </div>

        {/* 8. Актуальность и публикация */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Актуальность и публикация</h2>
          </div>
          <FieldSet>
            <FieldGroup className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="infoAsOfDate">
                  Дата актуальности информации <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="infoAsOfDate"
                  type="date"
                  value={form.infoAsOfDate}
                  onChange={handleChange("infoAsOfDate")}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="nextUpdateDate">Следующее плановое обновление</FieldLabel>
                <Input
                  id="nextUpdateDate"
                  type="date"
                  value={form.nextUpdateDate}
                  onChange={handleChange("nextUpdateDate")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="visibility">Видимость</FieldLabel>
                <div className="relative">
                  <Eye className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                  <select
                    id="visibility"
                    className={cn(selectClassName, "pl-9")}
                    value={form.visibility}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, visibility: e.target.value as ProjectVisibility }))
                    }
                  >
                    {PROJECT_VISIBILITY_ORDER.map((v) => (
                      <option key={v} value={v}>
                        {PROJECT_VISIBILITY_LABELS[v]}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
            </FieldGroup>
          </FieldSet>
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
