import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { MoreVertical } from "lucide-react";
import TableRow from "./table-row";
import { FC } from "react";
import { ProjectWithRelations } from "@/types/project";

type ProjectsTableProps = {
    data: ProjectWithRelations[];
}

const ProjectsTable: FC<ProjectsTableProps> = ({ data }) => {
    return (
        <Card className="border-gray-200">
            <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">Projects</CardTitle>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                            30 done this month
                        </div>
                    </div>
                    <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                                    NAME
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                                    MEMBERS
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                                    BUDGET
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                                    LOCATION
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                                    STATUS
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((project) => (
                                <TableRow project={project} key={project.id} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

export default ProjectsTable;
