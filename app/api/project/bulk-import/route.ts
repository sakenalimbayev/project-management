import { auth } from "@/auth";
import { importProjectsBulk } from "@/lib/bulk-import-projects";
import { resolveActorLabel } from "@/lib/notifications";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";
import type { BulkProjectImportRow } from "@/types/bulk-import";

const MAX_ROWS = 200;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = (await request.json()) as { rows?: unknown };
    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json({ error: "rows must be a non-empty array." }, { status: 400 });
    }
    if (body.rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Максимум ${MAX_ROWS} проектов за один импорт.` },
        { status: 400 }
      );
    }

    const actorLabel = resolveActorLabel(
      session.user as { name?: string | null; email?: string | null; role?: string | null }
    );
    const results = await importProjectsBulk(
      body.rows as BulkProjectImportRow[],
      userId,
      actorLabel
    );

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.length - succeeded;

    return NextResponse.json({
      data: results,
      meta: { total: results.length, succeeded, failed },
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
