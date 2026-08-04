"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { FC } from "react";
import { cn } from "@/lib/utils";
import { FilterSelect } from "./filter-select";

type PaginationBarProps = {
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
    itemLabel?: string;
};

const getPageList = (current: number, total: number): (number | "ellipsis")[] => {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const keep = new Set<number>([1, total, current, current - 1, current + 1]);
    const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

    const result: (number | "ellipsis")[] = [];
    let prev = 0;
    for (const p of sorted) {
        if (prev && p - prev > 1) result.push("ellipsis");
        result.push(p);
        prev = p;
    }
    return result;
};

export const PaginationBar: FC<PaginationBarProps> = ({
    page,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50],
    itemLabel = "записей",
}) => {
    const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(totalItems, page * pageSize);
    const pages = getPageList(page, pageCount);

    return (
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Показано {start}–{end} из {totalItems} {itemLabel}
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                    aria-label="Предыдущая страница"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                {pages.map((p, idx) =>
                    p === "ellipsis" ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-sm text-muted-foreground">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p)}
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium",
                                p === page
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input text-foreground hover:bg-accent"
                            )}
                        >
                            {p}
                        </button>
                    )
                )}
                <button
                    type="button"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= pageCount}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                    aria-label="Следующая страница"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
                <FilterSelect
                    className="w-28"
                    value={String(pageSize)}
                    onChange={(v) => onPageSizeChange(Number(v))}
                    options={pageSizeOptions.map((n) => ({ value: String(n), label: `${n} / стр.` }))}
                    aria-label="Записей на странице"
                />
            </div>
        </div>
    );
};
