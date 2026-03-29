'use client';

import { ProjectWithRelations } from "@/types/project";
import { useRouter } from "next/navigation";

import {
    Palette,
    TrendingUp,
    Bug,
    Smartphone,
    Tag,
    ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { FC } from "react";

const getMemberInitials = (member: ProjectWithRelations["members"][number]) => {
    const first = member.user.firstName?.charAt(0);
    const last = member.user.lastName?.charAt(0);
    const fromEmail = member.user.email?.charAt(0);
    return [first, last].filter(Boolean).join("") || fromEmail || "?";
};

const getProjectIcon = (iconName: string) => {
    const iconProps = { className: "w-4 h-4" };

    switch (iconName) {
        case 'palette':
            return <Palette {...iconProps} />;
        case 'chart-line':
            return <TrendingUp {...iconProps} />;
        case 'bug':
            return <Bug {...iconProps} />;
        case 'smartphone':
            return <Smartphone {...iconProps} />;
        case 'tag':
            return <Tag {...iconProps} />;
        case 'shopping-bag':
            return <ShoppingBag {...iconProps} />;
        default:
            return <Palette {...iconProps} />;
    }
};

type TableRowProps = {
    project: ProjectWithRelations;
}

const TableRow: FC<TableRowProps> = ({ project }) => {
    const router = useRouter();

    return (
        <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/project/${project.id}`)}>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center mr-3 red")}>
                        {getProjectIcon('tag')}
                    </div>
                    <span className="font-normal text-gray-900">{project.name}</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex -space-x-2">
                    {project.members?.map((member) => (
                        <Avatar key={member.id} className="w-8 h-8 border-2 border-white">
                            {/* <AvatarImage src={member.avatar} alt={member.name} /> */}
                            <AvatarFallback className={cn("text-white text-xs black")}>
                                {getMemberInitials(member)}
                            </AvatarFallback>
                        </Avatar>
                    ))}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {project.totalBudget}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {project.location.city ?? project.location.region}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">{project.status}</span>
                </div>
            </td>
        </tr>
    )
}

export default TableRow;