import { ProjectType } from "@/app/generated/prisma";

export const PROJECT_TYPE_ORDER: ProjectType[] = [
  "NEW_SYSTEM",
  "MODERNIZATION",
  "INTEGRATION",
  "SERVICE_DIGITALIZATION",
  "AI_SYSTEM",
  "INFRASTRUCTURE",
  "OTHER",
];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  NEW_SYSTEM: "Создание новой ИС",
  MODERNIZATION: "Модернизация существующей ИС",
  INTEGRATION: "Интеграция",
  SERVICE_DIGITALIZATION: "Цифровизация услуги",
  AI_SYSTEM: "AI-система",
  INFRASTRUCTURE: "Инфраструктурный проект",
  OTHER: "Другое",
};
