"use client";

import { FC } from "react";
import { FileText } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
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
            <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(90vw,42rem)]">
                <DialogHeader className="shrink-0 border-b px-6 py-5 pr-14 text-left">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </span>
                        <div>
                            <DialogTitle className="text-lg">О проекте</DialogTitle>
                            <DialogDescription>Полное описание проекта</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="overflow-y-auto px-6 py-5">
                    <p className="whitespace-pre-line text-[15px] leading-8 text-gray-700">
                        {projectDescription}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
