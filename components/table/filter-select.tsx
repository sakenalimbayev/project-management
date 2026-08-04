"use client";

import { ChevronDown } from "lucide-react";
import { FC } from "react";
import { cn } from "@/lib/utils";

type FilterSelectProps = {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    className?: string;
    "aria-label"?: string;
};

export const FilterSelect: FC<FilterSelectProps> = ({
    value,
    onChange,
    options,
    className,
    ...rest
}) => {
    return (
        <div className={cn("relative", className)}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                {...rest}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
    );
};
