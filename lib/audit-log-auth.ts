import { prisma } from "@/lib/prisma";

/**
 * The audit log is visible to global ADMINs and to any user holding at
 * least one ProjectMember role (PROJECT_MEMBER or PROJECT_ADMINISTRATOR)
 * on any project. Plain USERs with no project role at all are excluded.
 */
export async function canViewAuditLog(
  userId: string | undefined,
  globalRole: string | undefined
): Promise<boolean> {
  if (!userId) return false;
  if (globalRole === "ADMIN") return true;
  const membership = await prisma.projectMember.findFirst({
    where: { userId },
  });
  return Boolean(membership);
}

/**
 * Which projects a user's audit log query should be scoped to.
 * `null` means unrestricted (global ADMINs see every project's activity).
 * A non-admin only sees activity for projects they're a member of.
 */
export async function getAuditLogProjectScope(
  userId: string | undefined,
  globalRole: string | undefined
): Promise<string[] | null> {
  if (globalRole === "ADMIN") return null;
  if (!userId) return [];
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  return memberships.map((m) => m.projectId);
}
