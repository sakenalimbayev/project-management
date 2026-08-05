"use client";

import { FC } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Typography } from "../ui/typography";
import { Button } from "../ui/button";

type ProjectDescriptionDialogProps = {
    projectDescription: string;
}

export const ProjectDescriptionDialog: FC<ProjectDescriptionDialogProps> = ({ projectDescription }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Показать больше</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>О проекте</DialogTitle>
                    <DialogDescription>
                        Полное описание проекта
                    </DialogDescription>
                </DialogHeader>
                <Typography variant="p">{projectDescription}</Typography>
            </DialogContent>
        </Dialog>
    );
};
