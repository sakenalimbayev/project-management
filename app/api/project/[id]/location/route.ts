import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageProjectStages } from "@/lib/project-stage-auth";
import { isPrismaError } from "@/utils/is-prisma-error";
import { notifyProjectMembers, resolveActorLabel } from "@/lib/notifications";
import { recordAuditLog } from "@/lib/audit-log";
import { NextRequest, NextResponse } from "next/server";

function formatLocation(location: { city: string | null; region: string | null }): string {
  return location.city ?? location.region ?? "не указан";
}

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
        { error: "Only project administrators can update the location." },
        { status: 403 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { location: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const locationId = body.locationId;
    if (typeof locationId !== "string" || !locationId) {
      return NextResponse.json({ error: "locationId is required." }, { status: 400 });
    }

    const newLocation = await prisma.location.findUnique({ where: { id: locationId } });
    if (!newLocation) {
      return NextResponse.json({ error: "Location not found." }, { status: 404 });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { locationId },
      include: { location: true },
    });

    const actorLabel = resolveActorLabel(
      session?.user as { name?: string | null; email?: string | null; role?: string | null }
    );

    await notifyProjectMembers(projectId, {
      type: "PROJECT_UPDATED",
      title: "Изменен регион реализации проекта",
      message: `Обновлён регион проекта "${project.name}"`,
      category: "Проекты",
      actorLabel,
    });

    if (project.locationId !== updated.locationId) {
      await recordAuditLog({
        action: "PROJECT_ATTRIBUTE_CHANGED",
        attribute: "location",
        projectId,
        summary: `Регион реализации проекта "${project.name}" изменён с "${formatLocation(project.location)}" на "${formatLocation(updated.location)}"`,
        actorLabel,
        actorId: userId,
      });
    }

    return NextResponse.json({ data: updated.location });
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
