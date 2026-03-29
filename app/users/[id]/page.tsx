import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ProjectMemberRole } from "@/app/generated/prisma";
import { formatProjectMemberRole } from "@/lib/format-project-member-role";

function displayName(user: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  return (
    user.name ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    user.email
  );
}

type ParticipationRow = {
  projectId: string;
  projectName: string;
  status: string;
  roles: string[];
};

function buildParticipation(
  memberships: {
    role: ProjectMemberRole;
    project: { id: string; name: string; status: string };
  }[],
  owned: { id: string; name: string; status: string }[]
): ParticipationRow[] {
  const map = new Map<string, ParticipationRow>();

  for (const m of memberships) {
    const id = m.project.id;
    const existing = map.get(id);
    const roleLabel = formatProjectMemberRole(m.role);
    if (existing) {
      if (!existing.roles.includes(roleLabel)) {
        existing.roles.push(roleLabel);
      }
    } else {
      map.set(id, {
        projectId: id,
        projectName: m.project.name,
        status: m.project.status,
        roles: [roleLabel],
      });
    }
  }

  for (const p of owned) {
    const existing = map.get(p.id);
    if (existing) {
      if (!existing.roles.includes("Owner")) {
        existing.roles.unshift("Owner");
      }
    } else {
      map.set(p.id, {
        projectId: p.id,
        projectName: p.name,
        status: p.status,
        roles: ["Owner"],
      });
    }
  }

  return [...map.values()].sort((a, b) =>
    a.projectName.localeCompare(b.projectName)
  );
}

export default async function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, ownedProjects] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        title: true,
        email: true,
        avatar: true,
        image: true,
        projectMembers: {
          select: {
            role: true,
            project: {
              select: { id: true, name: true, status: true },
            },
          },
        },
      },
    }),
    prisma.project.findMany({
      where: { ownerId: id },
      select: { id: true, name: true, status: true },
    }),
  ]);

  if (!user) {
    notFound();
  }

  const name = displayName(user);
  const participation = buildParticipation(
    user.projectMembers,
    ownedProjects
  );
  const avatarSrc =
    user.avatar ??
    user.image ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8 px-4">
      <div>
        <Typography variant="muted" className="mb-2 text-sm">
          <Link href="/" className="underline-offset-4 hover:underline">
            Home
          </Link>
        </Typography>
        <Typography variant="h1" className="text-2xl font-semibold">
          Profile
        </Typography>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarSrc} alt="" />
            <AvatarFallback className="text-lg">
              {(user.firstName?.charAt(0) ?? user.email.charAt(0)) ?? "?"}
              {user.lastName?.charAt(0) ?? ""}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-xl leading-tight">{name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {user.title?.trim() ? user.title : "No title set"}
            </p>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project participation</CardTitle>
        </CardHeader>
        <CardContent>
          {participation.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No projects to show yet.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {participation.map((row) => (
                <li key={row.projectId}>
                  <Link
                    href={`/project/${row.projectId}`}
                    className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-foreground">
                      {row.projectName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {row.roles.join(" · ")} · {row.status.replace(/_/g, " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
