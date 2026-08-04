import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

type PatchBody = {
    read?: boolean;
    archived?: boolean;
};

export async function PATCH(
    request: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await ctx.params;
        const body: PatchBody = await request.json();

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification || notification.recipientId !== userId) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        const data: { readAt?: Date | null; archivedAt?: Date | null } = {};
        if (typeof body.read === "boolean") {
            data.readAt = body.read ? new Date() : null;
        }
        if (typeof body.archived === "boolean") {
            data.archivedAt = body.archived ? new Date() : null;
        }

        const updated = await prisma.notification.update({ where: { id }, data });

        return NextResponse.json({
            data: {
                id: updated.id,
                read: updated.readAt !== null,
                archived: updated.archivedAt !== null,
            },
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
