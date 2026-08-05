"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Trash2, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ProjectMemberRole } from "@/app/generated/prisma";
import type { ProjectWithRelations } from "@/types/project";
import { formatProjectMemberRole } from "@/lib/format-project-member-role";
import { getAvatarColor } from "@/lib/avatar-color";
import { getInitials } from "@/lib/get-initials";
import { cn } from "@/lib/utils";

type Member = ProjectWithRelations["members"][number];

type SearchUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string;
  avatar: string | null;
  image?: string | null;
};

const ROLE_OPTIONS: { value: ProjectMemberRole; label: string }[] = [
  { value: "PROJECT_MEMBER", label: formatProjectMemberRole("PROJECT_MEMBER") },
  { value: "PROJECT_ADMINISTRATOR", label: formatProjectMemberRole("PROJECT_ADMINISTRATOR") },
];

function displayName(user: { name?: string | null; firstName?: string | null; lastName?: string | null; email: string }) {
  return (
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email
  );
}

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

type ProjectTeamSectionProps = {
  projectId: string;
  members: Member[];
  ownerId: string;
  canEdit: boolean;
};

export function ProjectTeamSection({
  projectId,
  members,
  ownerId,
  canEdit,
}: ProjectTeamSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [addRole, setAddRole] = useState<ProjectMemberRole>("PROJECT_MEMBER");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const otherMembers = members.filter((m) => m.userId !== ownerId);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof json?.error === "string" ? json.error : "Не удалось выполнить поиск.");
          setResults([]);
          return;
        }
        setResults(json?.data ?? []);
      } catch {
        setError("Ошибка сети. Попробуйте снова.");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setError(null);
      setQuery("");
      setResults([]);
      setAddRole("PROJECT_MEMBER");
    }
  };

  const handleAdd = async (user: SearchUser) => {
    setError(null);
    setAddingUserId(user.id);
    try {
      const res = await fetch(`/api/project/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: addRole }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json?.error === "string" ? json.error : "Не удалось добавить участника.");
        return;
      }
      setQuery("");
      setResults([]);
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте снова.");
    } finally {
      setAddingUserId(null);
    }
  };

  const handleRoleChange = async (memberId: string, role: ProjectMemberRole) => {
    setError(null);
    setUpdatingMemberId(memberId);
    try {
      const res = await fetch(`/api/project/${projectId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json?.error === "string" ? json.error : "Не удалось изменить роль.");
        return;
      }
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте снова.");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    setError(null);
    setRemovingMemberId(memberId);
    try {
      const res = await fetch(`/api/project/${projectId}/members/${memberId}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json?.error === "string" ? json.error : "Не удалось удалить участника.");
        return;
      }
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте снова.");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const memberUserIds = new Set(otherMembers.map((m) => m.userId));
  const addableResults = results.filter((u) => u.id !== ownerId && !memberUserIds.has(u.id));

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Команда проекта</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {otherMembers.map((member) => {
            const fullName = displayName(member.user);

            return (
              <Link
                key={member.id}
                href={`/users/${member.userId}`}
                className="flex items-center gap-3 rounded-lg -mx-2 px-2 py-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar>
                  <AvatarFallback
                    className={cn("font-semibold text-white", getAvatarColor(member.userId))}
                  >
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium truncate">
                    {fullName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatProjectMemberRole(member.role)}
                  </span>
                </div>
              </Link>
            );
          })}
          {otherMembers.length === 0 && (
            <p className="text-sm text-muted-foreground">Участники пока не добавлены.</p>
          )}
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-4 w-full">
                <Users className="h-4 w-4" />
                Управление командой
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Команда проекта</DialogTitle>
                <DialogDescription>
                  Добавляйте участников по имени, фамилии или email и назначайте им роль в
                  проекте.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <p className="text-sm font-medium">Текущие участники</p>
                {otherMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Участники пока не добавлены.</p>
                ) : (
                  <div className="space-y-2">
                    {otherMembers.map((member) => {
                      const fullName = displayName(member.user);
                      const busy = updatingMemberId === member.id || removingMemberId === member.id;
                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 rounded-md border border-border p-2"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback
                              className={cn("text-xs font-semibold text-white", getAvatarColor(member.userId))}
                            >
                              {getInitials(fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">{fullName}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {member.user.email}
                            </span>
                          </div>
                          <select
                            className={cn(selectClassName, "w-auto shrink-0")}
                            value={member.role}
                            disabled={busy}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.value as ProjectMemberRole)
                            }
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-destructive"
                            disabled={busy}
                            onClick={() => handleRemove(member.id)}
                            title="Удалить из команды"
                          >
                            {removingMemberId === member.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-medium">Добавить участника</p>
                <Input
                  placeholder="Поиск по имени, фамилии или email"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Роль:</span>
                  <select
                    className={cn(selectClassName, "w-auto")}
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as ProjectMemberRole)}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {searching && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Поиск…
                  </p>
                )}

                {!searching && query.trim() && addableResults.length === 0 && (
                  <p className="text-sm text-muted-foreground">Ничего не найдено.</p>
                )}

                {addableResults.length > 0 && (
                  <div className="space-y-2">
                    {addableResults.map((user) => {
                      const fullName = displayName(user);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 rounded-md border border-border p-2"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback
                              className={cn("text-xs font-semibold text-white", getAvatarColor(user.id))}
                            >
                              {getInitials(fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">{fullName}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            disabled={addingUserId === user.id}
                            onClick={() => handleAdd(user)}
                          >
                            {addingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                            Добавить
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Готово
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
