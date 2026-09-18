import { FundingSource } from "@/app/generated/prisma";

export const FUNDING_SOURCE_ORDER: FundingSource[] = [
  "REPUBLICAN_BUDGET",
  "LOCAL_BUDGET",
  "ORGANIZATION_FUNDS",
  "PPP",
  "GRANT",
  "OTHER",
];

export const FUNDING_SOURCE_LABELS: Record<FundingSource, string> = {
  REPUBLICAN_BUDGET: "Республиканский бюджет",
  LOCAL_BUDGET: "Местный бюджет",
  ORGANIZATION_FUNDS: "Средства организации",
  PPP: "ГЧП",
  GRANT: "Грант",
  OTHER: "Другое",
};
