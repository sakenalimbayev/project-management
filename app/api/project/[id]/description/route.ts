import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageProjectStages } from "@/lib/project-stage-auth";
import { isPrismaError } from "@/utils/is-prisma-error";
import { notifyProjectMembers, resolveActorLabel } from "@/lib/notifications";
import { recordAuditLog } from "@/lib/audit-log";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
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
        { error: "Only project administrators can update the description." },
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
    const descriptionRaw = body.description;
    if (descriptionRaw !== null && typeof descriptionRaw !== "string") {
      return NextResponse.json(
        { error: "description must be a string or null." },
        { status: 400 }
      );
    }
    const description = typeof descriptionRaw === "string" ? descriptionRaw.trim() || null : null;

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { description },
    });

    const actorLabel = resolveActorLabel(
      session?.user as { name?: string | null; email?: string | null; role?: string | null }
    );

    await notifyProjectMembers(projectId, {
      type: "PROJECT_UPDATED",
      title: "Изменено описание проекта",
      message: `Обновлено описание проекта "${project.name}"`,
      category: "Проекты",
      actorLabel,
    });

    if ((project.description ?? "") !== (updated.description ?? "")) {
      await recordAuditLog({
        action: "PROJECT_ATTRIBUTE_CHANGED",
        attribute: "description",
        projectId,
        summary: `Описание проекта "${project.name}" изменено`,
        actorLabel,
        actorId: userId,
      });
    }

    return NextResponse.json({ data: { description: updated.description } });
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
