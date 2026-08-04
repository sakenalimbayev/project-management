"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { FC } from "react";
import { cn } from "@/lib/utils";
import { formatRelativeRu } from "@/lib/format-relative-time";
import { NotificationDTO } from "@/types/notification";
import { NOTIFICATION_TYPE_META } from "./notification-meta";

type NotificationRowProps = {
    notification: NotificationDTO;
    compact?: boolean;
    onSelect?: (notification: NotificationDTO) => void;
    onToggleArchive?: (notification: NotificationDTO) => void;
};

export const NotificationRow: FC<NotificationRowProps> = ({
    notification,
    compact,
    onSelect,
    onToggleArchive,
}) => {
    const meta = NOTIFICATION_TYPE_META[notification.type];
    const Icon = meta.icon;
    const unread = !notification.read;

    return (
        <div
            className={cn(
                "group -mx-2 flex items-start gap-3 rounded-lg px-2 cursor-pointer hover:bg-gray-50",
                compact ? "py-2" : "border-b py-4 last:border-b-0",
                !unread && "opacity-70"
            )}
            onClick={() => onSelect?.(notification)}
        >
            <span
                className={cn(
                    "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
                    unread ? "bg-red-500" : "bg-gray-300"
                )}
            />
            <span
                className={cn(
                    "flex shrink-0 items-center justify-center rounded-full",
                    compact ? "h-9 w-9" : "h-11 w-11",
                    meta.iconClass
                )}
            >
                <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeRu(notification.createdAt)}
                    </span>
                </div>
                <p className={cn("text-sm text-muted-foreground", compact && "truncate")}>
                    {notification.message}
                </p>
                {!compact && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {notification.category}
                        <span className="mx-1.5">•</span>
                        {notification.actorLabel}
                    </p>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start pt-1.5">
                {!compact && onToggleArchive && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleArchive(notification);
                        }}
                        className="hidden h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 group-hover:flex"
                        aria-label={notification.archived ? "Восстановить" : "Архивировать"}
                        title={notification.archived ? "Восстановить" : "Архивировать"}
                    >
                        {notification.archived ? (
                            <ArchiveRestore className="h-4 w-4" />
                        ) : (
                            <Archive className="h-4 w-4" />
                        )}
                    </button>
                )}
                <span className={cn("h-2 w-2 rounded-full", unread ? "bg-blue-500" : "bg-gray-300")} />
            </div>
        </div>
    );
};
