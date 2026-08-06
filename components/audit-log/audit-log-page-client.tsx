"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/table/filter-select";
import { PaginationBar } from "@/components/table/pagination-bar";
import { getAuditLog } from "@/services/api/audit-log/audit-log";
import { AuditLogEntryDTO, AuditLogListMeta } from "@/types/audit-log";
import {
  AUDIT_LOG_ACTION_LABELS,
  AUDIT_LOG_ATTRIBUTES,
  AUDIT_LOG_ATTRIBUTE_LABELS,
  isAuditLogAttribute,
} from "@/lib/audit-log-labels";

const ALL_ATTRIBUTES = "all";
const PAGE_SIZE = 10;

const attributeOptions = [
  { value: ALL_ATTRIBUTES, label: "Все атрибуты" },
  ...AUDIT_LOG_ATTRIBUTES.map((attribute) => ({
    value: attribute,
    label: AUDIT_LOG_ATTRIBUTE_LABELS[attribute],
  })),
];

function activityLabel(entry: AuditLogEntryDTO): string {
  if (entry.action === "PROJECT_ATTRIBUTE_CHANGED" && entry.attribute && isAuditLogAttribute(entry.attribute)) {
    return `Изменён атрибут «${AUDIT_LOG_ATTRIBUTE_LABELS[entry.attribute]}»`;
  }
  return AUDIT_LOG_ACTION_LABELS[entry.action];
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditLogPageClient() {
  const [search, setSearch] = useState("");
  const [attribute, setAttribute] = useState(ALL_ATTRIBUTES);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [items, setItems] = useState<AuditLogEntryDTO[]>([]);
  const [meta, setMeta] = useState<AuditLogListMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(
    async (query: { search: string; attribute: string; page: number; pageSize: number }) => {
      setIsLoading(true);
      try {
        const res = await getAuditLog({
          search: query.search.trim() || undefined,
          attribute: query.attribute === ALL_ATTRIBUTES ? undefined : query.attribute,
          page: query.page,
          pageSize: query.pageSize,
        });
        setItems(res.data);
        setMeta(res.meta);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      load({ search, attribute, page, pageSize });
    }, 300);
    return () => clearTimeout(handle);
  }, [search, attribute, page, pageSize, load]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleAttributeChange = (value: string) => {
    setAttribute(value);
    setPage(1);
  };

  const pageCount = useMemo(
    () => (meta ? Math.max(1, Math.ceil(meta.total / meta.pageSize)) : 1),
    [meta]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Журнал аудита</h1>
        <p className="text-sm text-muted-foreground">
          Все изменения атрибутов проектов и активность по вопросам
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:items-center">
        <FilterSelect
          className="sm:w-56"
          value={attribute}
          onChange={handleAttributeChange}
          options={attributeOptions}
          aria-label="Атрибут проекта"
        />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Поиск по названию проекта..."
            className="pl-9"
          />
        </div>
      </div>

      <Card className="border-gray-200 py-0 gap-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                    Проект
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                    Активность
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                    Описание
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                    Инициатор
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Загрузка…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Активность не найдена
                    </td>
                  </tr>
                ) : (
                  items.map((entry) => (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/project/${entry.projectId}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {entry.projectName}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {activityLabel(entry)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{entry.summary}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                        {entry.actorLabel}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        {meta && (
          <div className="border-t">
            <PaginationBar
              page={Math.min(page, pageCount)}
              pageSize={meta.pageSize}
              totalItems={meta.total}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="записей"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
