import { fetcher } from "@/services/fetcher";
import {
  NotificationDTO,
  NotificationListMeta,
  NotificationPreferenceDTO,
  NotificationTab,
} from "@/types/notification";

export type NotificationsQuery = {
  tab?: NotificationTab;
  category?: string;
  page?: number;
  pageSize?: number;
};

export const getNotifications = async (query: NotificationsQuery = {}) => {
  const params = new URLSearchParams();
  if (query.tab) params.set("tab", query.tab);
  if (query.category) params.set("category", query.category);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));

  return fetcher<{ data: NotificationDTO[]; meta: NotificationListMeta }>(
    `/api/notifications?${params.toString()}`
  );
};

export const setNotificationRead = (id: string, read: boolean) =>
  fetcher<{ data: { id: string; read: boolean; archived: boolean } }>(
    `/api/notifications/${id}`,
    { method: "PATCH", body: JSON.stringify({ read }) }
  );

export const setNotificationArchived = (id: string, archived: boolean) =>
  fetcher<{ data: { id: string; read: boolean; archived: boolean } }>(
    `/api/notifications/${id}`,
    { method: "PATCH", body: JSON.stringify({ archived }) }
  );

export const markAllNotificationsRead = () =>
  fetcher<{ data: { success: boolean } }>("/api/notifications/mark-all-read", {
    method: "POST",
  });

export const getNotificationPreferences = () =>
  fetcher<{ data: NotificationPreferenceDTO }>("/api/notifications/preferences");

export const updateNotificationPreferences = (patch: Partial<NotificationPreferenceDTO>) =>
  fetcher<{ data: NotificationPreferenceDTO }>("/api/notifications/preferences", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
