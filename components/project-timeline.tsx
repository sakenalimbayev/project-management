'use client'

import { motion } from "framer-motion"
import { Timeline, TimelineItem } from "./ui/timeline"
import { TimelineColor, TimelineElement, TimelineSize } from "@/types/timeline"
import { FC } from "react"
import { Check, GitPullRequest, GitBranch } from "lucide-react"

export const defaultItems: TimelineElement[] = [
    {
        id: 1,
        date: '2024-01-01',
        title: 'First event',
        description: '',
        icon: <Check />,
        status: 'in-progress',
        color: 'primary',
    },
    {
        id: 2,
        date: '2024-02-01',
        title: 'Second event',
        description: '',
        icon: <GitPullRequest />,
        status: 'pending',
        color: 'secondary',
    },
    {
        id: 3,
        date: '2024-03-01',
        title: 'Third event',
        description: '',
        icon: <GitBranch />,
        status: 'pending',
        color: 'muted',
    },
];

type ProjectTimelineProps = {
    size?: TimelineSize;
    items: TimelineElement[];
    animate?: boolean;
    iconColor?: TimelineColor;
    connectorColor?: TimelineColor;
}

export const ProjectTimeline: FC<ProjectTimelineProps> = ({ size, items, animate, iconColor, connectorColor }) => {
    return (
        <Timeline size={size}>
            {[...items].reverse().map((item, index) => (
                <motion.div
                    key={index}
                    initial={animate ? { opacity: 0, y: 20 } : false}
                    animate={animate ? { opacity: 1, y: 0 } : false}
                    transition={{
                        duration: 0.5,
                        delay: index * 0.1,
                        ease: 'easeOut',
                    }}
                >
                    <TimelineItem
                        date={item.date}
                        title={item.title}
                        description={item.description}
                        icon={typeof item.icon === 'function' ? item.icon() : item.icon}
                        iconColor={item.color || iconColor}
                        connectorColor={item.color || connectorColor}
                        showConnector={index !== items.length - 1}
                    />
                </motion.div>
            ))}
        </Timeline>
    )
}