import { EditProjectDialog } from "@/components/dialog/edit-project-dialog";
import { ProjectGanttSection } from "@/components/project-gantt-section";
import type { SerializedProjectStage } from "@/lib/map-project-stages";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectQuestions } from "@/components/questions/project-questions";
import { getProjectById } from "@/services/api/projects/projects";
import { ProjectDescriptionSection } from "@/components/project-description-section";
import { ProjectLocationSection } from "@/components/project-location-section";
import { StatusBadge } from "@/components/table/status-badge";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ProjectBudgetSection } from "@/components/project-budget-section";
import { ProjectTeamSection } from "@/components/project-team-section";
import { ArrowLeft, FileText, MoreVertical } from "lucide-react";
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
                    <ProjectDescriptionSection
                        projectId={project.id}
                        description={project.description}
                        canEdit={canEditProject}
                    />
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
                            <CardTitle>Вопросы и ответы</CardTitle>
                            <CardDescription>
                                Обсуждение деталей проекта с командой
                            </CardDescription>
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
                    <ProjectLocationSection
                        projectId={project.id}
                        location={project.location}
                        canEdit={canEditProject}
                    />
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
