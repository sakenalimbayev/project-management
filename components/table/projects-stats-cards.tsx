import { CalendarClock, CheckCircle2, ClipboardList, ThumbsUp } from "lucide-react";
import { FC } from "react";
import { ProjectWithRelations } from "@/types/project";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProjectsStatsCardsProps = {
    projects: ProjectWithRelations[];
};

export const ProjectsStatsCards: FC<ProjectsStatsCardsProps> = ({ projects }) => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "IN_PROGRESS").length;
    const planned = projects.filter((p) => p.status === "PLANNED").length;
    const finished = projects.filter((p) => p.status === "FINISHED").length;

    const stats = [
        { label: "Всего проектов", value: total, icon: ClipboardList, iconClass: "bg-blue-50 text-blue-600" },
        { label: "Активные проекты", value: active, icon: ThumbsUp, iconClass: "bg-green-50 text-green-600" },
        { label: "Планируется", value: planned, icon: CalendarClock, iconClass: "bg-indigo-50 text-indigo-600" },
        { label: "Завершенные", value: finished, icon: CheckCircle2, iconClass: "bg-gray-100 text-gray-600" },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 @xl/main:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, iconClass }) => (
                <Card key={label} className="flex-row items-center gap-3 p-4">
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconClass)}>
                        <Icon className="h-5 w-5" />
                    </span>
                    <span>
                        <span className="block text-sm text-muted-foreground">{label}</span>
                        <span className="block text-xl font-semibold">{value}</span>
                    </span>
                </Card>
            ))}
        </div>
    );
};
