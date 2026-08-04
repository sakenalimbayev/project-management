import { ProjectStatus } from "@/app/generated/prisma";
import { PROJECT_STATUS_BADGE_CLASSES, PROJECT_STATUS_LABELS } from "@/lib/project-status";
import { cn } from "@/lib/utils";
import { FC } from "react";

type StatusBadgeProps = {
    status: ProjectStatus;
    className?: string;
};

export const StatusBadge: FC<StatusBadgeProps> = ({ status, className }) => {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                PROJECT_STATUS_BADGE_CLASSES[status],
                className
            )}
        >
            {PROJECT_STATUS_LABELS[status]}
        </span>
    );
};
