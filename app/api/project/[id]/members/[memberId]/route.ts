import { ProjectMemberRole } from "@/app/generated/prisma";
import { auth } from "@/auth";
import { formatProjectMemberRole } from "@/lib/format-project-member-role";
import { formatUserDisplayName, notifyProjectMembers, notifyUser, resolveActorLabel } from "@/lib/notifications";
import { recordAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { canManageProjectStages } from "@/lib/project-stage-auth";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

const VALID_ROLES: ProjectMemberRole[] = ["PROJECT_MEMBER", "PROJECT_ADMINISTRATOR"];

async function loadMember(projectId: string, memberId: string) {
  return prisma.projectMember.findFirst({
    where: { id: memberId, projectId },
    include: { user: true },
  });
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    const globalRole = (session?.user as { role?: string })?.role;
    const { id: projectId, memberId } = await ctx.params;

    if (!(await canManageProjectStages(projectId, userId, globalRole))) {
      return NextResponse.json(
        { error: "Only project administrators can manage the team." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as { role?: string };
    if (!VALID_ROLES.includes(body.role as ProjectMemberRole)) {
      return NextResponse.json({ error: "A valid role is required." }, { status: 400 });
    }
    const role = body.role as ProjectMemberRole;

    const [existing, project] = await Promise.all([
      loadMember(projectId, memberId),
      prisma.project.findUnique({ where: { id: projectId } }),
    ]);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    const updated = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: true },
    });

    const actorLabel = resolveActorLabel(
      session?.user as { name?: string | null; email?: string | null; role?: string | null }
    );
    const roleChangeSummary = `Роль ${formatUserDisplayName(updated.user)} в проекте "${project.name}" изменена на «${formatProjectMemberRole(role)}»`;

    await notifyProjectMembers(projectId, {
      type: "PROJECT_UPDATED",
      title: "Изменен состав проекта",
      message: roleChangeSummary,
      category: "Проекты",
      actorLabel,
    });

    await recordAuditLog({
      action: "PROJECT_ATTRIBUTE_CHANGED",
      attribute: "members",
      projectId,
      summary: roleChangeSummary,
      actorLabel,
      actorId: userId,
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        projectId: updated.projectId,
        userId: updated.userId,
        role: updated.role,
        joinedAt: updated.joinedAt,
      },
    });
  } catch (error) {
    if (isPrismaError(error)) {
      return NextResponse.json(
        { error: "Database error", code: error.code, message: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    const globalRole = (session?.user as { role?: string })?.role;
    const { id: projectId, memberId } = await ctx.params;

    if (!(await canManageProjectStages(projectId, userId, globalRole))) {
      return NextResponse.json(
        { error: "Only project administrators can manage the team." },
        { status: 403 }
      );
    }

    const [existing, project] = await Promise.all([
      loadMember(projectId, memberId),
      prisma.project.findUnique({ where: { id: projectId } }),
    ]);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    await prisma.projectMember.delete({ where: { id: memberId } });

    const actorLabel = resolveActorLabel(session?.user as { name?: string | null; email?: string | null; role?: string | null });
    const removalSummary = `${formatUserDisplayName(existing.user)} удален(а) из проекта "${project.name}"`;

    await Promise.all([
      notifyProjectMembers(projectId, {
        type: "PROJECT_UPDATED",
        title: "Изменен состав проекта",
        message: removalSummary,
        category: "Проекты",
        actorLabel,
      }),
      notifyUser(existing.userId, {
        type: "PROJECT_UPDATED",
        title: "Вы удалены из проекта",
        message: `Вы больше не являетесь участником проекта "${project.name}"`,
        category: "Проекты",
        actorLabel,
      }),
      recordAuditLog({
        action: "PROJECT_ATTRIBUTE_CHANGED",
        attribute: "members",
        projectId,
        summary: removalSummary,
        actorLabel,
        actorId: userId,
      }),
    ]);

    return NextResponse.json({ data: { id: memberId } });
  } catch (error) {
    if (isPrismaError(error)) {
      return NextResponse.json(
        { error: "Database error", code: error.code, message: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
