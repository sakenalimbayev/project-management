import { parseCSV, stringifyCSV } from "@/lib/csv";
import type { BulkProjectImportRow } from "@/types/bulk-import";

export const CSV_HEADERS = [
  "name",
  "description",
  "ministryName",
  "locationCity",
  "locationRegion",
  "totalBudget",
  "spentAmount",
  "status",
  "ownerEmail",
  "stagesJson",
] as const;

export type BulkImportParseResult = {
  rows: BulkProjectImportRow[];
  errors: string[];
};

export function parseCsvProjectRows(text: string): BulkImportParseResult {
  const table = parseCSV(text);
  if (table.length === 0) {
    return { rows: [], errors: ["Файл пуст."] };
  }

  const [header, ...dataRows] = table;
  const normalizedHeader = header.map((h) => h.trim());
  const errors: string[] = [];
  const rows: BulkProjectImportRow[] = [];

  const get = (cells: string[], key: string) => {
    const idx = normalizedHeader.indexOf(key);
    if (idx === -1) return undefined;
    const value = cells[idx]?.trim();
    return value ? value : undefined;
  };

  dataRows.forEach((cells, i) => {
    const rowNum = i + 2;
    if (cells.length === 1 && cells[0].trim() === "") return;

    const name = get(cells, "name");
    const ministryName = get(cells, "ministryName");
    const totalBudget = get(cells, "totalBudget");
    if (!name || !ministryName || !totalBudget) {
      errors.push(`Строка ${rowNum}: заполните обязательные поля name, ministryName, totalBudget.`);
      return;
    }

    let stages: BulkProjectImportRow["stages"];
    const stagesJson = get(cells, "stagesJson");
    if (stagesJson) {
      try {
        stages = JSON.parse(stagesJson);
      } catch {
        errors.push(`Строка ${rowNum}: не удалось разобрать stagesJson как JSON.`);
        return;
      }
    }

    rows.push({
      name,
      description: get(cells, "description"),
      ministryName,
      locationCity: get(cells, "locationCity"),
      locationRegion: get(cells, "locationRegion"),
      totalBudget,
      spentAmount: get(cells, "spentAmount"),
      status: get(cells, "status"),
      ownerEmail: get(cells, "ownerEmail"),
      stages,
    });
  });

  return { rows, errors };
}

export function parseJsonProjectRows(text: string): BulkImportParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { rows: [], errors: ["Файл содержит некорректный JSON."] };
  }

  const list: unknown[] | null = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { projects?: unknown[] })?.projects)
      ? (parsed as { projects: unknown[] }).projects
      : null;

  if (!list) {
    return { rows: [], errors: ['Ожидался массив проектов (или объект с полем "projects").'] };
  }

  const errors: string[] = [];
  const rows: BulkProjectImportRow[] = [];

  list.forEach((item, i) => {
    if (!item || typeof item !== "object") {
      errors.push(`Проект ${i + 1}: некорректная запись.`);
      return;
    }
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : undefined;
    const ministryName = typeof record.ministryName === "string" ? record.ministryName : undefined;
    const totalBudget =
      typeof record.totalBudget === "string" || typeof record.totalBudget === "number"
        ? record.totalBudget
        : undefined;
    if (!name || !ministryName || totalBudget === undefined) {
      errors.push(`Проект ${i + 1}: заполните обязательные поля name, ministryName, totalBudget.`);
      return;
    }

    rows.push({
      name,
      description: typeof record.description === "string" ? record.description : undefined,
      ministryName,
      locationCity: typeof record.locationCity === "string" ? record.locationCity : undefined,
      locationRegion: typeof record.locationRegion === "string" ? record.locationRegion : undefined,
      totalBudget,
      spentAmount:
        typeof record.spentAmount === "string" || typeof record.spentAmount === "number"
          ? record.spentAmount
          : undefined,
      status: typeof record.status === "string" ? record.status : undefined,
      ownerEmail: typeof record.ownerEmail === "string" ? record.ownerEmail : undefined,
      stages: Array.isArray(record.stages) ? (record.stages as BulkProjectImportRow["stages"]) : undefined,
    });
  });

  return { rows, errors };
}

const SAMPLE_ROW: BulkProjectImportRow = {
  name: "Модернизация системы водоснабжения",
  description: "Обновление инфраструктуры водоснабжения в регионе",
  ministryName: "Ministry of Economics",
  locationCity: "Astana",
  totalBudget: "500000",
  spentAmount: "0",
  status: "PLANNED",
  ownerEmail: "owner@example.com",
  stages: [
    {
      label: "Проектирование",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      status: "PLANNED",
      plannedBudget: "150000",
    },
    {
      label: "Строительство",
      startDate: "2026-04-01",
      endDate: "2026-10-31",
      status: "PLANNED",
      plannedBudget: "350000",
    },
  ],
};

export type BulkImportFileFormat = "csv" | "json";

export function buildSampleFile(format: BulkImportFileFormat): {
  content: string;
  filename: string;
  mime: string;
} {
  if (format === "json") {
    return {
      content: JSON.stringify([SAMPLE_ROW], null, 2),
      filename: "projects-sample.json",
      mime: "application/json;charset=utf-8;",
    };
  }

  const row = [
    SAMPLE_ROW.name,
    SAMPLE_ROW.description ?? "",
    SAMPLE_ROW.ministryName,
    SAMPLE_ROW.locationCity ?? "",
    SAMPLE_ROW.locationRegion ?? "",
    String(SAMPLE_ROW.totalBudget),
    String(SAMPLE_ROW.spentAmount ?? ""),
    SAMPLE_ROW.status ?? "",
    SAMPLE_ROW.ownerEmail ?? "",
    JSON.stringify(SAMPLE_ROW.stages ?? []),
  ];

  return {
    content: stringifyCSV([...CSV_HEADERS], [row]),
    filename: "projects-sample.csv",
    mime: "text/csv;charset=utf-8;",
  };
}
