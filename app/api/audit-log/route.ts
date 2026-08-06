import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewAuditLog, getAuditLogProjectScope } from "@/lib/audit-log-auth";
import { isAuditLogAttribute } from "@/lib/audit-log-labels";
import { isPrismaError } from "@/utils/is-prisma-error";
import { Prisma } from "@/app/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { AuditLogEntryDTO } from "@/types/audit-log";

type EntryWithProject = Prisma.AuditLogEntryGetPayload<{
  include: { project: { select: { name: true } } };
}>;

const toDTO = (entry: EntryWithProject): AuditLogEntryDTO => ({
  id: entry.id,
  action: entry.action,
  attribute: entry.attribute,
  summary: entry.summary,
  actorLabel: entry.actorLabel,
  createdAt: entry.createdAt.toISOString(),
  projectId: entry.projectId,
  projectName: entry.project.name,
  questionId: entry.questionId,
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    const globalRole = (session?.user as { role?: string })?.role;

    if (!(await canViewAuditLog(userId, globalRole))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const projectScope = await getAuditLogProjectScope(userId, globalRole);

    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim() || undefined;
    const attributeParam = params.get("attribute")?.trim() || undefined;
    const attribute =
      attributeParam && isAuditLogAttribute(attributeParam) ? attributeParam : undefined;
    const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? 10) || 10));

    const where: Prisma.AuditLogEntryWhereInput = {
      ...(projectScope ? { projectId: { in: projectScope } } : {}),
      ...(attribute ? { attribute } : {}),
      ...(search ? { project: { name: { contains: search, mode: "insensitive" } } } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.auditLogEntry.findMany({
        where,
        include: { project: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLogEntry.count({ where }),
    ]);

    const meta = { page, pageSize, total };

    return NextResponse.json({ data: items.map(toDTO), meta });
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
