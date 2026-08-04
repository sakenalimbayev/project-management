"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Filter } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaginationBar } from "@/components/table/pagination-bar";
import { cn } from "@/lib/utils";
import {
    getNotifications,
    markAllNotificationsRead,
    setNotificationArchived,
    setNotificationRead,
} from "@/services/api/notifications/notifications";
import { NotificationDTO, NotificationListMeta, NotificationTab } from "@/types/notification";
import { NOTIFICATION_CATEGORIES } from "./notification-meta";
import { NotificationRow } from "./notification-row";

const TABS: { key: NotificationTab; label: string }[] = [
    { key: "all", label: "Все" },
    { key: "unread", label: "Непрочитанные" },
    { key: "important", label: "Важные" },
    { key: "archive", label: "Архив" },
];

const PAGE_SIZE = 7;

export const NotificationsPageClient = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tab, setTab] = useState<NotificationTab>("all");
    const [category, setCategory] = useState<string | undefined>(
        searchParams.get("category") ?? undefined
    );
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [items, setItems] = useState<NotificationDTO[]>([]);
    const [meta, setMeta] = useState<NotificationListMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getNotifications({ tab, category, page, pageSize });
            setItems(res.data);
            setMeta(res.meta);
        } finally {
            setIsLoading(false);
        }
    }, [tab, category, page, pageSize]);

    useEffect(() => {
        load();
    }, [load]);

    const tabCounts = useMemo(
        () => ({
            all: meta?.allCount ?? 0,
            unread: meta?.unreadCount ?? 0,
            important: meta?.importantCount ?? 0,
            archive: meta?.archivedCount ?? 0,
        }),
        [meta]
    );

    const handleSelectTab = (nextTab: NotificationTab) => {
        setTab(nextTab);
        setPage(1);
    };

    const handleSelectCategory = (next: string | undefined) => {
        setCategory(next);
        setPage(1);
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsRead();
        await load();
    };

    const handleSelectNotification = async (notification: NotificationDTO) => {
        if (!notification.read) {
            await setNotificationRead(notification.id, true);
            setItems((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
            );
            setMeta((prev) =>
                prev ? { ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) } : prev
            );
        }
        if (notification.projectId) {
            router.push(`/project/${notification.projectId}`);
        }
    };

    const handleToggleArchive = async (notification: NotificationDTO) => {
        await setNotificationArchived(notification.id, !notification.archived);
        await load();
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
                <p className="text-sm text-muted-foreground">
                    Централизованный центр уведомлений и событий системы
                </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-6 border-b">
                    {TABS.map((t) => {
                        const count = tabCounts[t.key];
                        const isActive = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => handleSelectTab(t.key)}
                                className={cn(
                                    "flex items-center gap-2 border-b-2 pb-3 text-sm font-medium",
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t.label}
                                {count > 0 && (
                                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleMarkAllRead}
                        disabled={tabCounts.unread === 0}
                    >
                        <Check className="h-4 w-4" />
                        Отметить все как прочитанные
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Filter className="h-4 w-4" />
                                Фильтр
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                                onClick={() => handleSelectCategory(undefined)}
                                className={cn(!category && "bg-accent")}
                            >
                                Все категории
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {NOTIFICATION_CATEGORIES.map((c) => (
                                <DropdownMenuItem
                                    key={c}
                                    onClick={() => handleSelectCategory(c)}
                                    className={cn(category === c && "bg-accent")}
                                >
                                    {c}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Card className="gap-0 overflow-hidden border-gray-200 py-0">
                <div className="px-6">
                    {isLoading ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">Загрузка…</p>
                    ) : items.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            Уведомлений не найдено
                        </p>
                    ) : (
                        items.map((notification) => (
                            <NotificationRow
                                key={notification.id}
                                notification={notification}
                                onSelect={handleSelectNotification}
                                onToggleArchive={handleToggleArchive}
                            />
                        ))
                    )}
                </div>
                {meta && (
                    <div className="border-t">
                        <PaginationBar
                            page={meta.page}
                            pageSize={meta.pageSize}
                            totalItems={meta.total}
                            onPageChange={setPage}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setPage(1);
                            }}
                            itemLabel="уведомлений"
                        />
                    </div>
                )}
            </Card>
        </div>
    );
};
