"use client";

import Link from "next/link";
import {
    Bell,
    Briefcase,
    ChevronRight,
    Mail,
    MessageSquare,
    ShieldCheck,
    Slack,
    Smartphone,
    TrendingUp,
    type LucideIcon,
} from "lucide-react";
import { FC, useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { NotificationRow } from "@/components/notifications/notification-row";
import {
    getNotificationPreferences,
    getNotifications,
    markAllNotificationsRead,
    updateNotificationPreferences,
} from "@/services/api/notifications/notifications";
import { NotificationDTO, NotificationPreferenceDTO } from "@/types/notification";

type NotificationBellProps = {
    userEmail?: string | null;
};

const CHANNELS: {
    key: keyof NotificationPreferenceDTO;
    label: string;
    icon: LucideIcon;
    subtitle: (email?: string | null) => string;
}[] = [
        { key: "email", label: "Электронная почта", icon: Mail, subtitle: (email) => email || "—" },
        { key: "push", label: "Push-уведомления", icon: Bell, subtitle: () => "Браузер" },
        { key: "sms", label: "SMS-уведомления", icon: Smartphone, subtitle: () => "Не указан" },
        { key: "slack", label: "Slack интеграция", icon: Slack, subtitle: () => "open-projects" },
    ];

const TYPE_LINKS: { category: string; label: string; subtitle: string; icon: LucideIcon }[] = [
    { category: "Проекты", label: "Проекты", subtitle: "Создание, изменение, статусы", icon: Briefcase },
    { category: "KPI и показатели", label: "KPI и показатели", subtitle: "Изменение показателей эффективности", icon: TrendingUp },
    { category: "Обращения", label: "Обращения", subtitle: "Новые обращения и ответы", icon: MessageSquare },
    { category: "Система", label: "Система", subtitle: "Административные уведомления", icon: ShieldCheck },
];

export const NotificationBell: FC<NotificationBellProps> = ({ userEmail }) => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<NotificationDTO[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [preferences, setPreferences] = useState<NotificationPreferenceDTO | null>(null);

    const loadSummary = async () => {
        const res = await getNotifications({ tab: "all", pageSize: 5 });
        setItems(res.data);
        setUnreadCount(res.meta.unreadCount);
    };

    useEffect(() => {
        loadSummary();
        const interval = setInterval(loadSummary, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (open) {
            loadSummary();
        }
    }, [open]);

    useEffect(() => {
        if (open && !preferences) {
            getNotificationPreferences().then((res) => setPreferences(res.data));
        }
    }, [open, preferences]);

    const handleMarkAllRead = async () => {
        await markAllNotificationsRead();
        await loadSummary();
    };

    const handleTogglePreference = async (key: keyof NotificationPreferenceDTO) => {
        if (!preferences) return;
        const next = { ...preferences, [key]: !preferences[key] };
        setPreferences(next);
        await updateNotificationPreferences({ [key]: next[key] });
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="relative flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent"
                    aria-label="Уведомления"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 max-h-[85vh] overflow-y-auto p-0">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">Уведомления</p>
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-sm text-primary hover:underline"
                        >
                            Отметить все как прочитанные
                        </button>
                    </div>
                    <div className="mt-2">
                        {items.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">Нет уведомлений</p>
                        ) : (
                            items.map((n) => <NotificationRow key={n.id} notification={n} compact />)
                        )}
                    </div>
                    <Link
                        href="/notifications"
                        className="mt-2 block text-center text-sm text-primary hover:underline"
                        onClick={() => setOpen(false)}
                    >
                        Показать все уведомления
                    </Link>
                </div>

                <div className="border-t p-4">
                    <p className="font-semibold">Настройки уведомлений</p>
                    <p className="mb-3 text-xs text-muted-foreground">Каналы доставки</p>
                    <div className="flex flex-col gap-3">
                        {CHANNELS.map(({ key, label, icon: Icon, subtitle }) => (
                            <div key={key} className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                                    <Icon className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">{label}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {subtitle(userEmail)}
                                    </p>
                                </div>
                                <Switch
                                    checked={preferences?.[key] ?? false}
                                    onCheckedChange={() => handleTogglePreference(key)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t p-4">
                    <p className="mb-2 font-semibold">Типы уведомлений</p>
                    <div className="flex flex-col">
                        {TYPE_LINKS.map(({ category, label, subtitle, icon: Icon }) => (
                            <Link
                                key={category}
                                href={`/notifications?category=${encodeURIComponent(category)}`}
                                className="flex items-center gap-3 rounded-md py-2 hover:bg-gray-50"
                                onClick={() => setOpen(false)}
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                                    <Icon className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">{label}</p>
                                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
