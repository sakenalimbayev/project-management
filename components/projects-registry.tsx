"use client";

import Link from "next/link";
import { Calendar, ChevronDown, Filter, Plus, Search } from "lucide-react";
import { FC, useMemo, useState } from "react";
import { ProjectWithRelations } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PROJECT_STATUS_LABELS } from "@/lib/project-status";
import { FilterSelect } from "@/components/table/filter-select";
import { PaginationBar } from "@/components/table/pagination-bar";
import { ProjectsExportMenu } from "@/components/table/projects-export-menu";
import { ProjectsStatsCards } from "@/components/table/projects-stats-cards";
import TableRow from "@/components/table/table-row";

type ProjectsRegistryProps = {
    data: ProjectWithRelations[];
};

const ALL_REGIONS = "all";
const ALL_STATUSES = "all";

const formatDate = (date: Date) =>
    date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

export const ProjectsRegistry: FC<ProjectsRegistryProps> = ({ data }) => {
    const [search, setSearch] = useState("");
    const [region, setRegion] = useState(ALL_REGIONS);
    const [status, setStatus] = useState(ALL_STATUSES);
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const codeByProjectId = useMemo(() => {
        const map = new Map<string, string>();
        data.forEach((project, index) => {
            const year = new Date(project.createdAt).getFullYear();
            map.set(project.id, `PRJ-${year}-${String(index + 1).padStart(3, "0")}`);
        });
        return map;
    }, [data]);

    const regionOptions = useMemo(() => {
        const unique = new Set<string>();
        data.forEach((p) => {
            const label = p.location.city ?? p.location.region;
            if (label) unique.add(label);
        });
        return [
            { value: ALL_REGIONS, label: "Все регионы" },
            ...[...unique].sort().map((r) => ({ value: r, label: r })),
        ];
    }, [data]);

    const statusOptions = useMemo(
        () => [
            { value: ALL_STATUSES, label: "Все статусы" },
            ...Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
        ],
        []
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return data.filter((project) => {
            const matchesSearch = !term || project.name.toLowerCase().includes(term);
            const projectRegion = project.location.city ?? project.location.region;
            const matchesRegion = region === ALL_REGIONS || projectRegion === region;
            const matchesStatus = status === ALL_STATUSES || project.status === status;
            return matchesSearch && matchesRegion && matchesStatus;
        });
    }, [data, search, region, status]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const resetToFirstPage = () => setPage(1);

    const dateRangeLabel = useMemo(() => {
        const year = new Date().getFullYear();
        return `${formatDate(new Date(year, 0, 1))} - ${formatDate(new Date(year, 11, 31))}`;
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Реестр проектов</h1>
                    <p className="text-sm text-muted-foreground">
                        Единый реестр государственных проектов Республики Казахстан
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button asChild>
                        <Link href="/admin">
                            <Plus className="h-4 w-4" />
                            Добавить проект
                        </Link>
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => setFiltersOpen((v) => !v)}>
                        <Filter className="h-4 w-4" />
                        Фильтры
                        <ChevronDown className={filtersOpen ? "h-4 w-4 rotate-180 transition-transform" : "h-4 w-4 transition-transform"} />
                    </Button>
                    <ProjectsExportMenu projects={filtered} />
                </div>
            </div>

            {filtersOpen && (
                <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:items-center">
                    <FilterSelect
                        className="sm:w-48"
                        value={region}
                        onChange={(v) => { setRegion(v); resetToFirstPage(); }}
                        options={regionOptions}
                        aria-label="Регион"
                    />
                    <FilterSelect
                        className="sm:w-44"
                        value={status}
                        onChange={(v) => { setStatus(v); resetToFirstPage(); }}
                        options={statusOptions}
                        aria-label="Статус"
                    />
                    <div className="flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap">{dateRangeLabel}</span>
                    </div>
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); resetToFirstPage(); }}
                            placeholder="Поиск..."
                            className="pl-9"
                        />
                    </div>
                </div>
            )}

            <Card className="border-gray-200 py-0 gap-0 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                                        Название проекта
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                                        Код
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                                        Государственный орган
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                                        Регион
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                                        Бюджет
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                                        Статус
                                    </th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paged.map((project) => (
                                    <TableRow project={project} code={codeByProjectId.get(project.id) ?? ""} key={project.id} />
                                ))}
                                {paged.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                                            Проекты не найдены
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                <div className="border-t">
                    <PaginationBar
                        page={currentPage}
                        pageSize={pageSize}
                        totalItems={filtered.length}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => { setPageSize(size); resetToFirstPage(); }}
                    />
                </div>
            </Card>

            <ProjectsStatsCards projects={data} />
        </div>
    );
};

export default ProjectsRegistry;
