import { ProjectsRegistry } from "@/components/projects-registry";
import { getAllProjects } from "@/services/api/projects/projects";

export default async function Home() {
  const projects = await getAllProjects();
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-6">
          <ProjectsRegistry data={projects} />
        </div>
      </div>
    </div>
  );
}
