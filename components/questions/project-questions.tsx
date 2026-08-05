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
        setSubmitError(data?.error ?? "Войдите, чтобы задать вопрос.");
        return;
      }

      if (!response.ok) {
        setSubmitError(data?.error ?? "Не удалось отправить вопрос.");
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
              placeholder="Задайте вопрос по проекту..."
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
              Отправить
            </Button>
          </div>
          {submitError && (
            <p className="text-sm text-red-600" role="alert">
              {submitError}
            </p>
          )}
          {submitSuccess && (
            <p className="text-sm text-muted-foreground">
              Ваш вопрос отправлен на модерацию. Отследить его можно в{" "}
              <Link href="/profile" className="underline underline-offset-4">
                Профиль → Мои вопросы
              </Link>
              .
            </p>
          )}
        </>
      ) : (
        <Typography variant="muted" className="text-sm">
          Войдите, чтобы задать вопрос. Он появится здесь после проверки
          администратором проекта.
        </Typography>
      )}

      <div className="space-y-4">
        {questions?.length === 0 ? (
          <Typography variant="muted" className="text-sm">
            Пока нет опубликованных вопросов.
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
                    Показать ответ
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Вопрос</DialogTitle>
                    <DialogDescription>{question.text}</DialogDescription>
                  </DialogHeader>
                  <Typography variant="p">
                    {question.answer ?? "Ответ пока не предоставлен."}
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
