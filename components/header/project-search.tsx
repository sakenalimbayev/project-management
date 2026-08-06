"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/table/status-badge";
import { searchProjects } from "@/services/api/projects/projects";
import type { ProjectWithRelations } from "@/types/project";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;

export function ProjectSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = query.trim();
  const isEligible = trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!isEligible) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const handle = setTimeout(async () => {
      try {
        const data = await searchProjects(trimmed);
        setResults(data);
      } catch {
        setError("Не удалось выполнить поиск.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [trimmed, isEligible]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (project: ProjectWithRelations) => {
    setOpen(false);
    setQuery("");
    router.push(`/project/${project.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      e.currentTarget.blur();
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      handleSelect(results[0]);
    }
  };

  const showDropdown = open && isEligible;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id="search"
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Поиск по названию проекта..."
        className="h-10 rounded-full pl-9"
        autoComplete="off"
      />
      {showDropdown && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-lg border bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Поиск…
            </div>
          ) : error ? (
            <p className="px-4 py-3 text-sm text-destructive">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              Проекты не найдены
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((project) => {
                const region = project.location?.city ?? project.location?.region;
                return (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(project)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {project.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[project.ministry?.name, region].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <StatusBadge status={project.status} className="shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
