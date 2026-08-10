import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageProjectStages } from "@/lib/project-stage-auth";
import { notifyProjectMembers, resolveActorLabel } from "@/lib/notifications";
import { recordAuditLog } from "@/lib/audit-log";
import {
  uploadProjectDocumentFile,
  validateProjectDocumentFile,
} from "@/lib/project-document-storage";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

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
        { error: "Only project administrators can upload documents." },
        { status: 403 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files were provided." },
        { status: 400 }
      );
    }

    for (const file of files) {
      const validationError = validateProjectDocumentFile(file);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    const documents = await Promise.all(
      files.map(async (file) => {
        const fileUrl = await uploadProjectDocumentFile(projectId, file);
        return prisma.projectDocument.create({
          data: {
            projectId,
            fileName: file.name,
            fileUrl,
            fileSize: file.size,
            mimeType: file.type,
            uploadedById: userId,
          },
        });
      })
    );

    const actorLabel = resolveActorLabel(
      session?.user as { name?: string | null; email?: string | null; role?: string | null }
    );

    await notifyProjectMembers(projectId, {
      type: "PROJECT_UPDATED",
      title: "Добавлены документы проекта",
      message: `К проекту "${project.name}" добавлены подтверждающие документы (${documents.length})`,
      category: "Проекты",
      actorLabel,
    });

    await recordAuditLog({
      action: "PROJECT_ATTRIBUTE_CHANGED",
      attribute: "documents",
      projectId,
      summary: `К проекту "${project.name}" добавлено документов: ${documents.length}`,
      actorLabel,
      actorId: userId,
    });

    return NextResponse.json({ data: documents });
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
