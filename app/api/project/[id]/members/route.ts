import { ProjectMemberRole } from "@/app/generated/prisma";
import { auth } from "@/auth";
import { formatProjectMemberRole } from "@/lib/format-project-member-role";
import { formatUserDisplayName, notifyProjectMembers, resolveActorLabel } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { canManageProjectStages } from "@/lib/project-stage-auth";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

const VALID_ROLES: ProjectMemberRole[] = ["PROJECT_MEMBER", "PROJECT_ADMINISTRATOR"];

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    const globalRole = (session?.user as { role?: string })?.role;
    const { id: projectId } = await ctx.params;

    if (!(await canManageProjectStages(projectId, userId, globalRole))) {
      return NextResponse.json(
        { error: "Only project administrators can manage the team." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as { userId?: string; role?: string };
    const targetUserId = body.userId;
    if (!targetUserId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }
    const role: ProjectMemberRole = VALID_ROLES.includes(body.role as ProjectMemberRole)
      ? (body.role as ProjectMemberRole)
      : "PROJECT_MEMBER";

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (targetUserId === project.ownerId) {
      return NextResponse.json(
        { error: "The project owner cannot be added as a team member." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const member = await prisma.projectMember.create({
      data: { projectId, userId: targetUserId, role },
      include: { user: true },
    });

    await notifyProjectMembers(projectId, {
      type: "PROJECT_UPDATED",
      title: "Изменен состав проекта",
      message: `${formatUserDisplayName(user)} добавлен(а) в проект "${project.name}" в роли «${formatProjectMemberRole(role)}»`,
      category: "Проекты",
      actorLabel: resolveActorLabel(session?.user as { name?: string | null; email?: string | null; role?: string | null }),
    });

    return NextResponse.json(
      {
        data: {
          id: member.id,
          projectId: member.projectId,
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            image: user.image,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (isPrismaError(error)) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "User is already a member of this project" },
          { status: 409 }
        );
      }
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
