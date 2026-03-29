import { ProjectStatus } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: {
            user: true
          }
        },
        ministry: true,
        location: true
      }
    });

    const serializedProjects = projects.map((project) => ({
      ...project,
      totalBudget: project.totalBudget.toString(),
      spentAmount: project.spentAmount.toString(),
    }));

    return NextResponse.json({ data: serializedProjects })
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const raw = await request.json();
    const {
      name,
      description,
      ministryId,
      locationId,
      totalBudget,
      budget: legacyBudget,
      spentAmount,
      status,
    } = raw as Record<string, unknown>;

    const resolvedTotal =
      (typeof totalBudget === "string" || typeof totalBudget === "number"
        ? String(totalBudget)
        : null) ??
      (typeof legacyBudget === "string" || typeof legacyBudget === "number"
        ? String(legacyBudget)
        : null);

    if (
      typeof name !== "string" ||
      typeof ministryId !== "string" ||
      typeof locationId !== "string" ||
      !resolvedTotal
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure ownerId comes from the authenticated admin user
    const ownerId = (session.user as any).id as string | undefined;
    if (!ownerId) {
      return NextResponse.json(
        { error: "Owner information missing" },
        { status: 400 }
      );
    }

    const spent =
      typeof spentAmount === "string" || typeof spentAmount === "number"
        ? String(spentAmount)
        : "0";

    const project = await prisma.project.create({
      data: {
        name,
        description:
          typeof description === "string" ? description : undefined,
        ministryId,
        locationId,
        totalBudget: resolvedTotal,
        spentAmount: spent,
        ownerId,
        status:
          (status as ProjectStatus | undefined) ?? ProjectStatus.PLANNED,
      },
    });

    return NextResponse.json({ project });
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
