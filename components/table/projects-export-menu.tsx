"use client";

import { Braces, ChevronDown, Download, FileSpreadsheet } from "lucide-react";
import { FC } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectWithRelations } from "@/types/project";
import { PROJECT_STATUS_LABELS } from "@/lib/project-status";

type ProjectsExportMenuProps = {
    projects: ProjectWithRelations[];
};

const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

const toExportRows = (projects: ProjectWithRelations[]) =>
    projects.map((project) => ({
        name: project.name,
        ministry: project.ministry.name,
        region: project.location.city ?? project.location.region ?? "",
        totalBudget: project.totalBudget,
        spentAmount: project.spentAmount,
        status: PROJECT_STATUS_LABELS[project.status],
    }));

const exportAsCsv = (projects: ProjectWithRelations[]) => {
    const rows = toExportRows(projects);
    const header = ["Название проекта", "Государственный орган", "Регион", "Бюджет", "Освоено", "Статус"];
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = [
        header.join(","),
        ...rows.map((r) =>
            [r.name, r.ministry, r.region, r.totalBudget, r.spentAmount, r.status].map((v) => escape(String(v))).join(",")
        ),
    ];
    downloadBlob(lines.join("\n"), "projects.csv", "text/csv;charset=utf-8;");
};

const exportAsJson = (projects: ProjectWithRelations[]) => {
    downloadBlob(JSON.stringify(toExportRows(projects), null, 2), "projects.json", "application/json;charset=utf-8;");
};

export const ProjectsExportMenu: FC<ProjectsExportMenuProps> = ({ projects }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Экспорт
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-4">
                <p className="font-semibold">Экспорт данных</p>
                <p className="mb-3 text-sm text-muted-foreground">Выберите формат для выгрузки данных</p>
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => exportAsCsv(projects)}
                        className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-100 text-green-600">
                            <FileSpreadsheet className="h-5 w-5" />
                        </span>
                        <span>
                            <span className="block text-sm font-medium">CSV</span>
                            <span className="block text-xs text-muted-foreground">
                                Для работы в Excel и других табличных редакторах
                            </span>
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => exportAsJson(projects)}
                        className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-purple-100 text-purple-600">
                            <Braces className="h-5 w-5" />
                        </span>
                        <span>
                            <span className="block text-sm font-medium">JSON</span>
                            <span className="block text-xs text-muted-foreground">
                                Для интеграции с информационными системами
                            </span>
                        </span>
                    </button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
