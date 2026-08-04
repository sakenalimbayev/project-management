'use client';

import { ProjectWithRelations } from "@/types/project";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { formatTenge } from "@/lib/format-currency";
import { FC, MouseEvent } from "react";
import { StatusBadge } from "./status-badge";

type TableRowProps = {
    project: ProjectWithRelations;
    code: string;
}

const TableRow: FC<TableRowProps> = ({ project, code }) => {
    const router = useRouter();
    const goToProject = () => router.push(`/project/${project.id}`);

    const stop = (e: MouseEvent) => e.stopPropagation();

    return (
        <tr className="hover:bg-gray-50 cursor-pointer" onClick={goToProject}>
            <td className="px-6 py-4">
                <span className="font-medium text-gray-900">{project.name}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {code}
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
                {project.ministry.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {project.location.city ?? project.location.region ?? "—"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatTenge(project.totalBudget)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={project.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                    <button
                        type="button"
                        onClick={(e) => { stop(e); goToProject(); }}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Просмотр"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { stop(e); goToProject(); }}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Редактировать"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={stop}
                        disabled
                        title="Удаление пока недоступно"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-red-300 cursor-not-allowed opacity-50"
                        aria-label="Удалить"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    )
}

export default TableRow;
