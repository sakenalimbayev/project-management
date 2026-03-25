import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageProjectStages } from "@/lib/project-stage-auth";
import { isPrismaError } from "@/utils/is-prisma-error";
import type { StageStatus } from "@/app/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED: StageStatus[] = ["PLANNED", "IN_PROGRESS", "COMPLETED"];

type StageInput = {
  label: string;
  startDate: string;
  endDate: string;
  status: StageStatus;
};

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    const globalRole = (session?.user as { role?: string })?.role;
    const { id: projectId } = await ctx.params;

    if (
      !(await canManageProjectStages(projectId, userId, globalRole))
    ) {
      return NextResponse.json(
        { error: "Only project administrators can edit stages." },
        { status: 403 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const stages = body?.stages as StageInput[] | undefined;
    if (!Array.isArray(stages)) {
      return NextResponse.json(
        { error: "Body must include stages array." },
        { status: 400 }
      );
    }

    for (let i = 0; i < stages.length; i++) {
      const s = stages[i];
      if (!s?.label?.trim()) {
        return NextResponse.json(
          { error: `Stage ${i + 1}: label is required.` },
          { status: 400 }
        );
      }
      if (!s.startDate || !s.endDate) {
        return NextResponse.json(
          { error: `Stage ${i + 1}: start and end dates are required.` },
          { status: 400 }
        );
      }
      if (!ALLOWED.includes(s.status)) {
        return NextResponse.json(
          { error: `Stage ${i + 1}: invalid status.` },
          { status: 400 }
        );
      }
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return NextResponse.json(
          { error: `Stage ${i + 1}: invalid dates.` },
          { status: 400 }
        );
      }
      if (end < start) {
        return NextResponse.json(
          { error: `Stage ${i + 1}: end date must be on or after start date.` },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectStage.deleteMany({ where: { projectId } });
      if (stages.length > 0) {
        await tx.projectStage.createMany({
          data: stages.map((s, sortOrder) => ({
            projectId,
            label: s.label.trim(),
            startDate: new Date(s.startDate),
            endDate: new Date(s.endDate),
            status: s.status,
            sortOrder,
          })),
        });
      }
    });

    const updated = await prisma.projectStage.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ data: updated });
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
