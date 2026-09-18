import { ProjectScale } from "@/app/generated/prisma";

export const PROJECT_SCALE_ORDER: ProjectScale[] = [
  "NATIONWIDE",
  "MULTIPLE_REGIONS",
  "SINGLE_REGION",
  "SINGLE_LOCALITY",
];

export const PROJECT_SCALE_LABELS: Record<ProjectScale, string> = {
  NATIONWIDE: "Весь Казахстан",
  MULTIPLE_REGIONS: "Несколько регионов",
  SINGLE_REGION: "Один регион",
  SINGLE_LOCALITY: "Один населённый пункт",
};

/** Scales at which a specific Location must be selected. */
export const SCALES_REQUIRING_LOCATION: ProjectScale[] = [
  "MULTIPLE_REGIONS",
  "SINGLE_REGION",
  "SINGLE_LOCALITY",
];
