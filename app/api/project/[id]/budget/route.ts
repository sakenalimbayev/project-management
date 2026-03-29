import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageProjectStages } from "@/lib/project-stage-auth";
import { isPrismaError } from "@/utils/is-prisma-error";
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
        { error: "Only project administrators can update the budget." },
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
    const totalRaw = body.totalBudget;
    const spentRaw = body.spentAmount;

    const totalStr =
      typeof totalRaw === "string" || typeof totalRaw === "number"
        ? String(totalRaw)
        : null;
    const spentStr =
      typeof spentRaw === "string" || typeof spentRaw === "number"
        ? String(spentRaw)
        : null;

    if (totalStr === null || spentStr === null) {
      return NextResponse.json(
        { error: "totalBudget and spentAmount are required." },
        { status: 400 }
      );
    }

    const totalNum = Number(totalStr);
    const spentNum = Number(spentStr);

    if (Number.isNaN(totalNum) || totalNum <= 0) {
      return NextResponse.json(
        { error: "Total budget must be a positive number." },
        { status: 400 }
      );
    }
    if (Number.isNaN(spentNum) || spentNum < 0) {
      return NextResponse.json(
        { error: "Spent amount must be zero or a positive number." },
        { status: 400 }
      );
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        totalBudget: totalStr,
        spentAmount: spentStr,
      },
    });

    return NextResponse.json({
      data: {
        totalBudget: updated.totalBudget.toString(),
        spentAmount: updated.spentAmount.toString(),
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
