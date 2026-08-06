"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Braces, CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  buildSampleFile,
  parseCsvProjectRows,
  parseJsonProjectRows,
  type BulkImportFileFormat,
} from "@/lib/bulk-import-parse";
import { bulkImportProjects } from "@/services/api/projects/bulk-import";
import type { BulkImportRowResult, BulkProjectImportRow } from "@/types/bulk-import";

const downloadBlob = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

type SubmitResult = {
  data: BulkImportRowResult[];
  meta: { total: number; succeeded: number; failed: number };
};

export function BulkImportProjectsDialog() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [sampleFormat, setSampleFormat] = useState<BulkImportFileFormat>("csv");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<BulkProjectImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const resetState = () => {
    setFileName(null);
    setRows([]);
    setParseErrors([]);
    setSubmitError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) resetState();
  };

  const handleDownloadSample = () => {
    const sample = buildSampleFile(sampleFormat);
    downloadBlob(sample.content, sample.filename, sample.mime);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSubmitError(null);
    setResult(null);
    if (!file) {
      setFileName(null);
      setRows([]);
      setParseErrors([]);
      return;
    }

    setFileName(file.name);
    const text = await file.text();
    const isJson = file.name.toLowerCase().endsWith(".json");
    const isCsv = file.name.toLowerCase().endsWith(".csv");

    if (!isJson && !isCsv) {
      setRows([]);
      setParseErrors(["Поддерживаются только файлы .csv и .json."]);
      return;
    }

    const parsed = isJson ? parseJsonProjectRows(text) : parseCsvProjectRows(text);
    setRows(parsed.rows);
    setParseErrors(parsed.errors);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await bulkImportProjects(rows);
      setResult(res);
      if (res.meta.succeeded > 0) {
        router.refresh();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Не удалось выполнить импорт.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4" />
          Импорт из файла
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Массовый импорт проектов</DialogTitle>
          <DialogDescription>
            Загрузите файл в формате CSV или JSON, чтобы создать несколько проектов сразу.
            Государственный орган и регион будут созданы автоматически, если ещё не существуют.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">1. Скачайте пример файла</p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-md border border-input p-0.5">
                  <button
                    type="button"
                    onClick={() => setSampleFormat("csv")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                      sampleFormat === "csv"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setSampleFormat("json")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                      sampleFormat === "json"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Braces className="h-4 w-4" />
                    JSON
                  </button>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadSample}>
                  <Download className="h-4 w-4" />
                  Скачать пример файла
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">2. Загрузите заполненный файл</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent text-sm shadow-xs outline-none file:mr-3 file:h-full file:border-0 file:border-r file:border-input file:bg-muted file:px-3 file:text-sm file:font-medium focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
              {fileName && rows.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Файл «{fileName}»: найдено проектов для импорта — {rows.length}
                </p>
              )}
              {parseErrors.length > 0 && (
                <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-destructive">
                    Строки с ошибками (не будут импортированы):
                  </p>
                  <ul className="list-disc space-y-0.5 pl-4 text-xs text-destructive">
                    {parseErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded-md border p-3 text-sm">
              <span className="flex items-center gap-1.5 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Успешно: {result.meta.succeeded}
              </span>
              <span className="flex items-center gap-1.5 text-destructive">
                <XCircle className="h-4 w-4" />
                Ошибки: {result.meta.failed}
              </span>
              <span className="text-muted-foreground">Всего строк: {result.meta.total}</span>
            </div>
            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {result.data.map((row) => (
                <div
                  key={row.index}
                  className={cn(
                    "flex items-start gap-2 rounded-md border p-2 text-sm",
                    row.success ? "border-green-200 bg-green-50" : "border-destructive/30 bg-destructive/5"
                  )}
                >
                  {row.success ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {row.success ? row.name : row.name ?? `Строка ${row.index + 1}`}
                    </p>
                    {!row.success && <p className="text-xs text-destructive">{row.error}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <>
              <Button type="button" variant="outline" onClick={resetState}>
                Импортировать ещё
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                Готово
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Отмена
              </Button>
              <Button type="button" onClick={handleImport} disabled={rows.length === 0 || isSubmitting}>
                {isSubmitting ? "Импортирование…" : `Импортировать (${rows.length})`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
