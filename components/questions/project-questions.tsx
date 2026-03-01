"use client";

import { useState } from "react";
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
};

export const ProjectQuestions = ({ projectId, questions: initialQuestions }: ProjectQuestionsProps) => {
  const [questionText, setQuestionText] = useState("");
  const [questions, setQuestions] = useState(initialQuestions);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = questionText.trim();
    if (!trimmed) return;

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

      if (!response.ok) {
        console.error("Failed to submit question");
        return;
      }

      const data = await response.json();
      setQuestions((prev) => [data.data, ...prev]);
      setQuestionText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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
        <Button onClick={handleSubmit} disabled={isSubmitting || !questionText.trim()}>
          Send
        </Button>
      </div>

      <div className="space-y-4">
        {questions?.map((question) => (
          <div key={question.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0">
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
                  <DialogDescription>
                    {question.text}
                  </DialogDescription>
                </DialogHeader>
                <Typography variant="p">
                  {question.answer ?? "No answer has been provided yet."}
                </Typography>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
};

