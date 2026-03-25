"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Typography } from "@/components/ui/typography";
import { ProjectWithRelations } from "@/types/project";

type ProjectQuestionsProps = {
  projectId: string;
  questions: ProjectWithRelations["questions"];
  isAuthenticated: boolean;
};

export const ProjectQuestions = ({
  projectId,
  questions: initialQuestions,
  isAuthenticated,
}: ProjectQuestionsProps) => {
  const [questionText, setQuestionText] = useState("");
  const [questions, setQuestions] = useState(initialQuestions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async () => {
    const trimmed = questionText.trim();
    if (!trimmed) return;

    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/project/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          text: trimmed,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setSubmitError(data?.error ?? "Please sign in to ask a question.");
        return;
      }

      if (!response.ok) {
        setSubmitError(data?.error ?? "Failed to submit question.");
        return;
      }

      setQuestionText("");
      setSubmitSuccess(true);
      // Do not add to public list — question is pending moderation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {isAuthenticated ? (
        <>
          <div className="flex gap-2">
            <Input
              placeholder="Ask a question about this project..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !questionText.trim()}
            >
              Send
            </Button>
          </div>
          {submitError && (
            <p className="text-sm text-red-600" role="alert">
              {submitError}
            </p>
          )}
          {submitSuccess && (
            <p className="text-sm text-muted-foreground">
              Your question was submitted for review. You can track it under{" "}
              <Link href="/profile" className="underline underline-offset-4">
                Profile → My Questions
              </Link>
              .
            </p>
          )}
        </>
      ) : (
        <Typography variant="muted" className="text-sm">
          Sign in to ask a question. Your question will be reviewed by a project
          administrator before it appears here.
        </Typography>
      )}

      <div className="space-y-4">
        {questions?.length === 0 ? (
          <Typography variant="muted" className="text-sm">
            No published questions yet.
          </Typography>
        ) : (
          questions?.map((question) => (
            <div
              key={question.id}
              className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0"
            >
              <Typography variant="p" className="text-sm">
                {question.text}
              </Typography>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Show Answer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Question</DialogTitle>
                    <DialogDescription>{question.text}</DialogDescription>
                  </DialogHeader>
                  <Typography variant="p">
                    {question.answer ?? "No answer has been provided yet."}
                  </Typography>
                </DialogContent>
              </Dialog>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
