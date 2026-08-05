import { ProjectDescriptionDialog } from "@/components/dialog/project-description-dialog";
import { ProjectGanttSection } from "@/components/project-gantt-section";
import type { SerializedProjectStage } from "@/lib/map-project-stages";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProjectQuestions } from "@/components/questions/project-questions";
import { getProjectById } from "@/services/api/projects/projects";
import { LocationMapWidget } from "@/components/location-map-widget";
import { StatusBadge } from "@/components/table/status-badge";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ProjectBudgetSection } from "@/components/project-budget-section";
import { formatProjectMemberRole } from "@/lib/format-project-member-role";
import { getInitials } from "@/lib/get-initials";
import { getAvatarColor } from "@/lib/avatar-color";
import { cn } from "@/lib/utils";
import { ArrowLeft, FileText, MoreVertical, Pencil, Users } from "lucide-react";
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

    const ownerFullName =
        project.owner.name ??
        [project.owner.firstName, project.owner.lastName].filter(Boolean).join(" ") ??
        project.owner.email;
    const ownerMemberRow = project.members?.find((m) => m.userId === project.owner.id);
    const ownerIsProjectAdmin = ownerMemberRow?.role === "PROJECT_ADMINISTRATOR";
    const otherMembers = project.members?.filter((m) => m.userId !== project.owner.id) ?? [];

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
                        <Button variant="outline">
                            <Pencil className="h-4 w-4" />
                            Редактировать проект
                        </Button>
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
                    <Card className="mx-auto w-full">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle>Команда проекта</CardTitle>
                                {canEditProject && (
                                    <Button variant="outline" size="sm">
                                        <Pencil className="h-4 w-4" />
                                        Редактировать
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Link
                                    href={`/users/${project.owner.id}`}
                                    className="flex items-center gap-3 rounded-lg -mx-2 px-2 py-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <Avatar>
                                        <AvatarFallback
                                            className={cn("font-semibold text-white", getAvatarColor(project.owner.id))}
                                        >
                                            {getInitials(ownerFullName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                                        <span className="font-medium truncate">{ownerFullName}</span>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm text-muted-foreground">
                                                Руководитель проекта
                                            </span>
                                            {ownerIsProjectAdmin && (
                                                <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                                                    Администратор проекта
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                {otherMembers.map((member) => {
                                    const fullName =
                                        member.user.name ??
                                        [member.user.firstName, member.user.lastName].filter(Boolean).join(" ") ??
                                        member.user.email;

                                    return (
                                        <Link
                                            key={member.id}
                                            href={`/users/${member.userId}`}
                                            className="flex items-center gap-3 rounded-lg -mx-2 px-2 py-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <Avatar>
                                                <AvatarFallback
                                                    className={cn("font-semibold text-white", getAvatarColor(member.userId))}
                                                >
                                                    {getInitials(fullName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <span className="font-medium truncate">
                                                    {fullName}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatProjectMemberRole(member.role)}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                            {canEditProject && (
                                <Button
                                    variant="outline"
                                    className="mt-4 w-full"
                                    disabled
                                    title="Управление командой скоро будет доступно"
                                >
                                    <Users className="h-4 w-4" />
                                    Управление командой
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
