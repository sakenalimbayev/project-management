import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageProjectStages } from "@/lib/project-stage-auth";
import { notifyProjectMembers, resolveActorLabel } from "@/lib/notifications";
import { ProjectStatus } from "@/app/generated/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

const PROJECT_STATUSES: ProjectStatus[] = ["PLANNED", "IN_PROGRESS", "FINISHED"];

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/project/[id]">
) {
  try {
    const { id } = await ctx.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: true,
        members: {
          include: {
            user: true
          }
        },
        ministry: true,
        location: true,
        stages: {
          orderBy: { sortOrder: "asc" },
        },
        questions: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
        },
      }
    });

    if (!project) {
      return NextResponse.json({
        error: 'Project not found',
        message: `Project with ID ${id} was not found`
      }, {
        status: 404
      })
    }

    const serializedProject = {
      ...project,
      totalBudget: project.totalBudget.toString(),
      spentAmount: project.spentAmount.toString(),
    };

    return NextResponse.json({ data: serializedProject });
  } catch (error) {
    if (isPrismaError(error)) {
      return NextResponse.json(
        {
          error: "Database error",
          code: error.code,
          message: error.message,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/project/[id]">
) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    const globalRole = (session?.user as { role?: string })?.role;
    const { id: projectId } = await ctx.params;

    if (!(await canManageProjectStages(projectId, userId, globalRole))) {
      return NextResponse.json(
        { error: "Only project administrators can update this project." },
        { status: 403 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const nameRaw = body.name;
    const statusRaw = body.status;

    const name = typeof nameRaw === "string" ? nameRaw.trim() : null;
    if (!name) {
      return NextResponse.json(
        { error: "Project name is required." },
        { status: 400 }
      );
    }

    const status =
      typeof statusRaw === "string" &&
      PROJECT_STATUSES.includes(statusRaw as ProjectStatus)
        ? (statusRaw as ProjectStatus)
        : null;
    if (!status) {
      return NextResponse.json(
        { error: "A valid project status is required." },
        { status: 400 }
      );
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { name, status },
    });

    await notifyProjectMembers(projectId, {
      type: "PROJECT_UPDATED",
      title: "Изменены данные проекта",
      message: `Обновлены название и статус проекта "${updated.name}"`,
      category: "Проекты",
      actorLabel: resolveActorLabel(session?.user as { name?: string | null; email?: string | null; role?: string | null }),
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
      },
    });
  } catch (error) {
    if (isPrismaError(error)) {
      return NextResponse.json(
        {
          error: "Database error",
          code: error.code,
          message: error.message,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
