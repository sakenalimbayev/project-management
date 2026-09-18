import { ProjectVisibility } from "@/app/generated/prisma";

export const PROJECT_VISIBILITY_ORDER: ProjectVisibility[] = [
  "DRAFT",
  "IN_MODERATION",
  "PUBLISHED",
  "UNPUBLISHED",
];

export const PROJECT_VISIBILITY_LABELS: Record<ProjectVisibility, string> = {
  DRAFT: "Черновик",
  IN_MODERATION: "На модерации",
  PUBLISHED: "Опубликовано",
  UNPUBLISHED: "Снято с публикации",
};

export const PROJECT_VISIBILITY_BADGE_CLASSES: Record<ProjectVisibility, string> = {
  DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
  IN_MODERATION: "bg-amber-50 text-amber-700 border-amber-200",
  PUBLISHED: "bg-green-50 text-green-700 border-green-200",
  UNPUBLISHED: "bg-red-50 text-red-700 border-red-200",
};
