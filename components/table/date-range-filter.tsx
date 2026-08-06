"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";

export type DateRange = {
    from: string;
    to: string;
};

type DateRangeFilterProps = {
    value: DateRange;
    onChange: (range: DateRange) => void;
    className?: string;
};

const formatDate = (isoDate: string) =>
    new Date(`${isoDate}T00:00:00`).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

const formatLabel = (value: DateRange) => {
    if (value.from && value.to) return `${formatDate(value.from)} – ${formatDate(value.to)}`;
    if (value.from) return `С ${formatDate(value.from)}`;
    if (value.to) return `По ${formatDate(value.to)}`;
    return "Все даты";
};

export const DateRangeFilter: FC<DateRangeFilterProps> = ({ value, onChange, className }) => {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<DateRange>(value);

    useEffect(() => {
        if (open) setDraft(value);
    }, [open, value]);

    const invalid = Boolean(draft.from && draft.to && draft.from > draft.to);

    const handleApply = () => {
        if (invalid) return;
        onChange(draft);
        setOpen(false);
    };

    const handleReset = () => {
        const cleared = { from: "", to: "" };
        setDraft(cleared);
        onChange(cleared);
        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={`h-9 justify-start gap-2 font-normal text-muted-foreground ${className ?? ""}`}
                >
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{formatLabel(value)}</span>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 p-4">
                <p className="mb-3 text-sm font-semibold">Период создания проекта</p>
                <div className="flex flex-col gap-3">
                    <Field>
                        <FieldLabel htmlFor="date-range-from">С даты</FieldLabel>
                        <input
                            id="date-range-from"
                            type="date"
                            value={draft.from}
                            max={draft.to || undefined}
                            onChange={(e) => setDraft((prev) => ({ ...prev, from: e.target.value }))}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="date-range-to">По дату</FieldLabel>
                        <input
                            id="date-range-to"
                            type="date"
                            value={draft.to}
                            min={draft.from || undefined}
                            onChange={(e) => setDraft((prev) => ({ ...prev, to: e.target.value }))}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        />
                    </Field>
                    {invalid && (
                        <p className="text-xs text-destructive">
                            Дата «по» не может быть раньше даты «с».
                        </p>
                    )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                        Сбросить
                    </Button>
                    <Button type="button" size="sm" onClick={handleApply} disabled={invalid}>
                        Применить
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
