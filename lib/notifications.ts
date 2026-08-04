import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/app/generated/prisma";

type ActorLike =
    | { id?: string | null; name?: string | null; email?: string | null; role?: string | null }
    | null
    | undefined;

export function resolveActorLabel(actor: ActorLike, context?: "moderation"): string {
    if (!actor) return "system";
    if (actor.role === "ADMIN") return "admin";
    if (context === "moderation") return "expert";
    return actor.name || actor.email?.split("@")[0] || "user";
}

export function formatUserDisplayName(user: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
}): string {
    return (
        user.name ||
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.email ||
        "пользователь"
    );
}

type NotifyFields = {
    type: NotificationType;
    title: string;
    message: string;
    category: string;
    actorLabel: string;
    important?: boolean;
    projectId?: string;
    questionId?: string;
};

async function createForRecipients(fields: NotifyFields, recipientIds: Iterable<string>) {
    const ids = [...new Set(recipientIds)];
    if (ids.length === 0) return;

    await prisma.notification.createMany({
        data: ids.map((recipientId) => ({
            recipientId,
            type: fields.type,
            title: fields.title,
            message: fields.message,
            category: fields.category,
            actorLabel: fields.actorLabel,
            important: fields.important ?? false,
            projectId: fields.projectId,
            questionId: fields.questionId,
        })),
    });
}

async function getAdminIds(): Promise<string[]> {
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
    });
    return admins.map((a) => a.id);
}

/**
 * Notifies every member of a project (including its owner) plus every global
 * ADMIN, regardless of membership — per the "admins receive all notifications"
 * rule. Use for events that represent a change to project data.
 */
export async function notifyProjectMembers(projectId: string, fields: NotifyFields) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true, members: { select: { userId: true } } },
    });
    if (!project) return;

    const adminIds = await getAdminIds();
    const recipientIds = [
        project.ownerId,
        ...project.members.map((m) => m.userId),
        ...adminIds,
    ];

    await createForRecipients({ ...fields, projectId }, recipientIds);
}

/** Notifies a single, specific user (e.g. the author of a question). */
export async function notifyUser(userId: string, fields: NotifyFields) {
    await createForRecipients(fields, [userId]);
}

/** Notifies every global ADMIN — used to fan out an admin-facing copy of an event. */
export async function notifyAdmins(fields: NotifyFields) {
    const adminIds = await getAdminIds();
    await createForRecipients(fields, adminIds);
}
