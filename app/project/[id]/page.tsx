import { ProjectDescriptionDialog } from "@/components/dialog/project-description-dialog";
import { EditProjectDialog } from "@/components/dialog/edit-project-dialog";
import { ProjectGanttSection } from "@/components/project-gantt-section";
import type { SerializedProjectStage } from "@/lib/map-project-stages";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectQuestions } from "@/components/questions/project-questions";
import { getProjectById } from "@/services/api/projects/projects";
import { LocationMapWidget } from "@/components/location-map-widget";
import { StatusBadge } from "@/components/table/status-badge";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ProjectBudgetSection } from "@/components/project-budget-section";
import { ProjectTeamSection } from "@/components/project-team-section";
import { ArrowLeft, FileText, MoreVertical, Pencil } from "lucide-react";
import Link from "next/link";

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const session = await auth();
    const project = await getProjectById(id);

    if (!project) {
        return null;
    }

    const currentUserId = (session?.user as any)?.id as string | undefined;
    const currentUserRole = (session?.user as any)?.role as string | undefined;

    const isAdmin = currentUserRole === "ADMIN";
    const isProjectAdmin = project.members?.some(
        (member) =>
            member.userId === currentUserId &&
            member.role === "PROJECT_ADMINISTRATOR"
    );

    const canEditProject = Boolean(currentUserId && (isAdmin || isProjectAdmin));

    const serializedStages: SerializedProjectStage[] = (project.stages ?? []).map(
        (s) => ({
            id: s.id,
            projectId: project.id,
            label: s.label,
            startDate: new Date(s.startDate as unknown as string)
                .toISOString()
                .slice(0, 10),
            endDate: new Date(s.endDate as unknown as string)
                .toISOString()
                .slice(0, 10),
            status: s.status,
            plannedBudget: s.plannedBudget,
            sortOrder: s.sortOrder,
        })
    );


    return (
        <div className="px-6 py-8">
            <Button asChild variant="outline" size="sm" className="mb-6">
                <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    Назад к проектам
                </Link>
            </Button>

            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                        <div className="mt-1">
                            <StatusBadge status={project.status} />
                        </div>
                    </div>
                </div>
                {canEditProject && (
                    <div className="flex items-center gap-2">
                        <EditProjectDialog
                            projectId={project.id}
                            name={project.name}
                            status={project.status}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            disabled
                            title="Дополнительные действия скоро будут доступны"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description section */}
                    <Card className="mx-auto w-full">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle>Описание проекта</CardTitle>
                                {canEditProject && (
                                    <Button variant="outline" size="sm">
                                        <Pencil className="h-4 w-4" />
                                        Редактировать
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="line-clamp-6 whitespace-pre-line text-sm leading-7 text-gray-700">
                                {project.description || "Описание отсутствует."}
                            </p>
                            {project.description && (
                                <div className="mt-3">
                                    <ProjectDescriptionDialog projectDescription={project.description} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {/* Timeline */}
                    <ProjectGanttSection
                        projectId={project.id}
                        stages={serializedStages}
                        canEdit={canEditProject}
                        totalBudget={project.totalBudget}
                    />
                    {/* Q&A */}
                    <Card className="mx-auto w-full">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <CardTitle>Вопросы и ответы</CardTitle>
                                    <CardDescription>
                                        Обсуждение деталей проекта с командой
                                    </CardDescription>
                                </div>
                                {canEditProject && (
                                    <Button variant="outline" size="sm">
                                        <Pencil className="h-4 w-4" />
                                        Редактировать
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ProjectQuestions
                                projectId={project.id}
                                questions={project.questions ?? []}
                                isAuthenticated={Boolean(currentUserId)}
                            />
                        </CardContent>
                    </Card>
                </div>
                {/* Right column */}
                <div className="space-y-8">
                    {/* Budget */}
                    <ProjectBudgetSection
                        projectId={project.id}
                        totalBudget={project.totalBudget}
                        spentAmount={project.spentAmount}
                        canEdit={canEditProject}
                    />
                    {/* Location */}
                    <Card className="mx-auto w-full">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle>Регион реализации</CardTitle>
                                {canEditProject && (
                                    <Button variant="outline" size="sm">
                                        <Pencil className="h-4 w-4" />
                                        Редактировать
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <LocationMapWidget
                                city={project.location.city}
                                region={project.location.region}
                                latitude={project.location.latitude}
                                longitude={project.location.longitude}
                            />
                        </CardContent>
                    </Card>
                    {/* Team Members */}
                    <ProjectTeamSection
                        projectId={project.id}
                        members={project.members ?? []}
                        ownerId={project.owner.id}
                        canEdit={canEditProject}
                    />
                </div>
            </div>
        </div>
    )
}
