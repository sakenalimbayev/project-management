import { prisma } from "@/lib/prisma";

export async function canManageProjectStages(
  projectId: string,
  userId: string | undefined,
  globalRole: string | undefined
): Promise<boolean> {
  if (!userId) return false;
  if (globalRole === "ADMIN") return true;
  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
      role: "PROJECT_ADMINISTRATOR",
    },
  });
  return Boolean(membership);
}
