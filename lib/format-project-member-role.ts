import type { ProjectMemberRole } from "@/app/generated/prisma";

export function formatProjectMemberRole(role: ProjectMemberRole): string {
  switch (role) {
    case "PROJECT_ADMINISTRATOR":
      return "Администратор проекта";
    case "PROJECT_MEMBER":
      return "Участник команды";
    default:
      return role;
  }
}
