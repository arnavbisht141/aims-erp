"use client";

import { MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Display";
import { Textarea } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/formatters";
import { commentsFor, getMember } from "@/lib/selectors";
import { validateComment } from "@/lib/validation";
import { useDemo } from "@/state/store";
import type { CommentParentType } from "@/types";

export function CommentThread({ parentType, parentId }: { parentType: CommentParentType; parentId: string }) {
  const { data, actions, currentMember } = useDemo();
  const toast = useToast();
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const fieldId = useId();
  const comments = commentsFor(data, parentType, parentId);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const problem = validateComment(text);
    setError(problem);
    if (problem) return;
    actions.addComment(parentType, parentId, text);
    setText("");
    toast("Comment posted.");
  };

  return (
    <section aria-labelledby={`${fieldId}-heading`}>
      <h2 id={`${fieldId}-heading`} className="flex items-center gap-2 text-base font-semibold">
        Discussion
        <span className="tabular text-sm font-normal text-subtle">{comments.length}</span>
      </h2>

      {comments.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <MessageSquare aria-hidden className="size-4 text-subtle" />
          No comments yet. Start the discussion below.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {comments.map((comment) => {
            const author = getMember(data, comment.authorId);
            return (
              <li key={comment.id} className="flex gap-3">
                <Avatar name={author?.name ?? "?"} id={comment.authorId} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {author ? (
                      <Link href={`/people/${author.id}`} className="font-semibold hover:underline">
                        {author.name}
                      </Link>
                    ) : (
                      <span className="font-semibold">Former member</span>
                    )}
                    <span className="text-subtle">
                      {" "}
                      · <time dateTime={comment.createdAt}>{formatDateTime(comment.createdAt)}</time>
                    </span>
                  </p>
                  <p className="mt-0.5 text-[15px] break-words whitespace-pre-line text-fg">{comment.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <form onSubmit={submit} noValidate className="mt-5 flex gap-3">
        <Avatar name={currentMember.name} id={currentMember.id} size="sm" />
        <div className="min-w-0 flex-1">
          <label htmlFor={fieldId} className="sr-only">
            Add a comment
          </label>
          <Textarea
            id={fieldId}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError(undefined);
            }}
            placeholder="Add a comment"
            rows={2}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${fieldId}-error` : undefined}
          />
          {error && (
            <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="mt-2 flex justify-end">
            <Button type="submit" variant="secondary" size="sm">
              <Send aria-hidden />
              Post comment
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
