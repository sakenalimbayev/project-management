import { ProjectDescriptionDialog } from "@/components/dialog/project-description-dialog";
import { defaultItems, ProjectTimeline } from "@/components/project-timeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectQuestions } from "@/components/questions/project-questions";
import { getProjectById } from "@/services/api/projects/projects";
import { MapPin } from "lucide-react";

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const project = await getProjectById(id);
    console.log(project);

    if (!project) {
        return null;
    }


    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <Typography variant="h1">{project.name}</Typography>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description section */}
                    <Card className="mx-auto w-full">
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {project.description}
                            <ProjectDescriptionDialog projectDescription={project.description || ''} />
                        </CardContent>
                    </Card>
                    {/* Timeline */}
                    <Card className="mx-auto w-full">
                        <CardHeader>
                            <CardTitle>Project Timeline</CardTitle>
                            <CardDescription>Estimated completion by Oct 24, 2025</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProjectTimeline items={defaultItems} animate />
                        </CardContent>
                    </Card>
                    {/* Q&A */}
                    <Card className="mx-auto w-full">
                        <CardHeader>
                            <CardTitle>Questions and Answers</CardTitle>
                            <CardDescription>Discuss project details with the team</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProjectQuestions projectId={project.id} questions={project.questions ?? []} />
                        </CardContent>
                    </Card>
                </div>
                {/* Right column */}
                <div className="space-y-8">
                    {/* Budget */}
                    <Card className="mx-auto w-full">
                        <CardHeader>
                            <CardTitle>Budget</CardTitle>
                        </CardHeader>
                        <CardContent>
                            ${project.budget}
                        </CardContent>
                    </Card>
                    {/* Location */}
                    <Card className="mx-auto w-full">
                        <CardHeader>
                            <CardTitle>Location</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span>
                                    {project.location.city ?? project.location.region ?? "Location not specified"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Team Members */}
                    <Card className="mx-auto w-full">
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {project.members?.map((member) => {
                                    const fullName = `${member.user.firstName} ${member.user.lastName}`;
                                    const placeholderAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

                                    return (
                                        <div key={member.id} className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage
                                                    src={member.user.avatar ?? placeholderAvatar}
                                                    alt={fullName}
                                                />
                                                <AvatarFallback>
                                                    {member.user.firstName.charAt(0)}
                                                    {member.user.lastName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {member.user.firstName} {member.user.lastName}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {member.user.role}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}