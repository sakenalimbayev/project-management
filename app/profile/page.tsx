"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type MyQuestion = {
  id: string;
  projectId: string;
  text: string;
  answer: string | null;
  status: string;
  createdAt: string;
  project: { id: string; name: string };
};

type ProjectQuestion = MyQuestion & {
  author: {
    id: string;
    name: string | null;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  project: { id: string; name: string };
};

function authorLabel(author: ProjectQuestion["author"]) {
  if (!author) return "Unknown";
  return (
    author.name ??
    [author.firstName, author.lastName].filter(Boolean).join(" ") ??
    author.email
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-900",
    APPROVED: "bg-green-100 text-green-900",
    REJECTED: "bg-red-100 text-red-900",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        map[status] ?? "bg-muted"
      )}
    >
      {status}
    </span>
  );
}

export default function ProfilePage() {
  const [tab, setTab] = useState<"mine" | "project">("mine");
  const [myQuestions, setMyQuestions] = useState<MyQuestion[]>([]);
  const [projectQuestions, setProjectQuestions] = useState<ProjectQuestion[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mineRes, modRes] = await Promise.all([
        fetch("/api/me/questions"),
        fetch("/api/me/project-questions"),
      ]);
      if (mineRes.status === 401 || modRes.status === 401) {
        setError("Please sign in to view your profile.");
        setMyQuestions([]);
        setProjectQuestions([]);
        return;
      }
      const mineJson = await mineRes.json();
      const modJson = await modRes.json();
      if (!mineRes.ok) {
        setError(mineJson?.error ?? "Failed to load your questions.");
        return;
      }
      if (!modRes.ok) {
        setError(modJson?.error ?? "Failed to load project questions.");
        return;
      }
      setMyQuestions(mineJson.data ?? []);
      setProjectQuestions(modJson.data ?? []);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (
    questionId: string,
    action: "approve" | "reject"
  ) => {
    setBusyId(questionId);
    setError(null);
    try {
      const res = await fetch(
        `/api/project/questions/${questionId}/moderate`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            answer: answers[questionId] ?? "",
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Update failed.");
        return;
      }
      await load();
    } catch {
      setError("Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Typography variant="h2" className="mb-2">
        Profile
      </Typography>
      <Typography variant="muted" className="mb-6">
        Your questions and project moderation.
      </Typography>

      <div className="mb-6 flex gap-2 border-b">
        <button
          type="button"
          className={cn(
            "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            tab === "mine"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setTab("mine")}
        >
          My Questions
        </button>
        <button
          type="button"
          className={cn(
            "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            tab === "project"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setTab("project")}
        >
          Project Questions
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <Typography variant="muted">Loading…</Typography>
      ) : tab === "mine" ? (
        <div className="space-y-4">
          {myQuestions.length === 0 ? (
            <Typography variant="muted">
              You have not submitted any questions yet.
            </Typography>
          ) : (
            myQuestions.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/project/${q.projectId}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {q.project.name}
                  </Link>
                  {statusBadge(q.status)}
                </div>
                <p className="text-sm">{q.text}</p>
                {q.status === "APPROVED" && q.answer && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Answer: </span>
                    {q.answer}
                  </p>
                )}
                {q.status === "PENDING" && (
                  <p className="text-xs text-muted-foreground">
                    Waiting for a project administrator to review.
                  </p>
                )}
                {q.status === "REJECTED" && (
                  <p className="text-xs text-muted-foreground">
                    This question was not published.
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {projectQuestions.length === 0 ? (
            <Typography variant="muted">
              You are not a project administrator for any project, or there
              are no questions yet.
            </Typography>
          ) : (
            projectQuestions.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/project/${q.projectId}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {q.project.name}
                    </Link>
                    {statusBadge(q.status)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    From: {authorLabel(q.author)}
                  </span>
                </div>
                <p className="text-sm font-medium">{q.text}</p>
                {q.status === "APPROVED" && q.answer && (
                  <p className="text-sm text-muted-foreground">{q.answer}</p>
                )}
                {q.status === "PENDING" && (
                  <>
                    <label className="text-xs font-medium text-muted-foreground">
                      Answer (shown after you publish)
                    </label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      value={answers[q.id] ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      placeholder="Write an answer for the project page…"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={busyId === q.id}
                        onClick={() => moderate(q.id, "approve")}
                      >
                        {busyId === q.id ? "Saving…" : "Publish answer"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === q.id}
                        onClick={() => moderate(q.id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  </>
                )}
                {q.status === "REJECTED" && (
                  <p className="text-xs text-muted-foreground">Rejected.</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
