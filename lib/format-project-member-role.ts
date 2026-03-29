import type { ProjectMemberRole } from "@/app/generated/prisma";

export function formatProjectMemberRole(role: ProjectMemberRole): string {
  switch (role) {
    case "PROJECT_ADMINISTRATOR":
      return "Project administrator";
    case "PROJECT_MEMBER":
      return "Team member";
    default:
      return role;
  }
}
