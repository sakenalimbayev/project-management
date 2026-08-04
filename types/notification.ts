import { NotificationType } from "@/app/generated/prisma";

export type NotificationDTO = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  category: string;
  actorLabel: string;
  important: boolean;
  read: boolean;
  archived: boolean;
  createdAt: string;
  projectId: string | null;
  questionId: string | null;
};

export type NotificationListMeta = {
  page: number;
  pageSize: number;
  total: number;
  allCount: number;
  unreadCount: number;
  importantCount: number;
  archivedCount: number;
};

export type NotificationTab = "all" | "unread" | "important" | "archive";

export type NotificationPreferenceDTO = {
  email: boolean;
  push: boolean;
  sms: boolean;
  slack: boolean;
};
