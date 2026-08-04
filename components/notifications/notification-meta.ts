import { Briefcase, MessageSquare, Reply, RefreshCw, XCircle, type LucideIcon } from "lucide-react";
import { NotificationType } from "@/app/generated/prisma";

export const NOTIFICATION_TYPE_META: Record<NotificationType, { icon: LucideIcon; iconClass: string }> = {
  PROJECT_CREATED: { icon: Briefcase, iconClass: "bg-green-50 text-green-600" },
  PROJECT_UPDATED: { icon: RefreshCw, iconClass: "bg-amber-50 text-amber-600" },
  QUESTION_SUBMITTED: { icon: MessageSquare, iconClass: "bg-blue-50 text-blue-600" },
  QUESTION_ANSWERED: { icon: Reply, iconClass: "bg-green-50 text-green-600" },
  QUESTION_REJECTED: { icon: XCircle, iconClass: "bg-red-50 text-red-600" },
};

export const NOTIFICATION_CATEGORIES = ["Проекты", "KPI и показатели", "Обращения", "Система"] as const;
