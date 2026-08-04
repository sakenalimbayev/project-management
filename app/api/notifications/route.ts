import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { Prisma } from "@/app/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { NotificationDTO, NotificationListMeta, NotificationTab } from "@/types/notification";

const toDTO = (n: {
    id: string;
    type: string;
    title: string;
    message: string;
    category: string;
    actorLabel: string;
    important: boolean;
    readAt: Date | null;
    archivedAt: Date | null;
    createdAt: Date;
    projectId: string | null;
    questionId: string | null;
}): NotificationDTO => ({
    id: n.id,
    type: n.type as NotificationDTO["type"],
    title: n.title,
    message: n.message,
    category: n.category,
    actorLabel: n.actorLabel,
    important: n.important,
    read: n.readAt !== null,
    archived: n.archivedAt !== null,
    createdAt: n.createdAt.toISOString(),
    projectId: n.projectId,
    questionId: n.questionId,
});

const tabWhere = (tab: NotificationTab): Prisma.NotificationWhereInput => {
    switch (tab) {
        case "unread":
            return { archivedAt: null, readAt: null };
        case "important":
            return { archivedAt: null, important: true };
        case "archive":
            return { archivedAt: { not: null } };
        case "all":
        default:
            return { archivedAt: null };
    }
};

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = request.nextUrl.searchParams;
        const tab = (params.get("tab") as NotificationTab | null) ?? "all";
        const category = params.get("category") || undefined;
        const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
        const pageSize = Math.min(50, Math.max(1, Number(params.get("pageSize") ?? 7) || 7));

        const baseWhere: Prisma.NotificationWhereInput = { recipientId: userId };
        const where: Prisma.NotificationWhereInput = {
            ...baseWhere,
            ...tabWhere(tab),
            ...(category ? { category } : {}),
        };

        const [items, total, allCount, unreadCount, importantCount, archivedCount] =
            await prisma.$transaction([
                prisma.notification.findMany({
                    where,
                    orderBy: { createdAt: "desc" },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                }),
                prisma.notification.count({ where }),
                prisma.notification.count({ where: { ...baseWhere, ...tabWhere("all") } }),
                prisma.notification.count({ where: { ...baseWhere, ...tabWhere("unread") } }),
                prisma.notification.count({ where: { ...baseWhere, ...tabWhere("important") } }),
                prisma.notification.count({ where: { ...baseWhere, ...tabWhere("archive") } }),
            ]);

        const meta: NotificationListMeta = {
            page,
            pageSize,
            total,
            allCount,
            unreadCount,
            importantCount,
            archivedCount,
        };

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
