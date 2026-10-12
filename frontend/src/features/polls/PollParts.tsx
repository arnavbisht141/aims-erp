"use client";

import { CircleCheck, EyeOff, Lock, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField, Input, Segmented, Select, Textarea } from "@/components/ui/Form";
import { Badge, PollStatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { formatDate, pluralise, VISIBILITY_LABELS } from "@/lib/formatters";
import { canManagePolls, canSeePollResults, canVote } from "@/lib/permissions";
import { commentsFor, getVote, memberName, pollResults } from "@/lib/selectors";
import { hasErrors, validatePoll, type FieldErrors } from "@/lib/validation";
import { useDemo } from "@/state/store";
import type { Poll, PollResultsVisibility, PollStatus } from "@/types";

function PollResults({ poll, votedOptionId }: { poll: Poll; votedOptionId?: string }) {
  const { data } = useDemo();
  const results = pollResults(data, poll.id);
  const closed = poll.status === "closed";
  return (
    <ul className="space-y-3" aria-label="Results">
      {results.options.map(({ option, count, percent }) => {
        const leading = closed && results.leadingIds.includes(option.id);
        const mine = votedOptionId === option.id;
        return (
          <li key={option.id}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className={cn("min-w-0 break-words", leading ? "font-semibold" : "text-fg")}>
                {option.label}
                {mine && <span className="ml-2 text-xs font-medium text-accent-text">Your vote</span>}
                {leading && <span className="ml-2 text-xs font-medium text-success">Most votes</span>}
              </span>
              <span className="tabular shrink-0 text-muted">
                {count} · {percent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden>
              <div
                className={cn("h-full rounded-full transition-[width] duration-500 ease-out", leading || mine ? "bg-accent" : "bg-line-strong")}
                style={{ width: `${percent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function VoteForm({ poll }: { poll: Poll }) {
  const { actions } = useDemo();
  const toast = useToast();
  const [choice, setChoice] = useState("");
  const [error, setError] = useState<string>();
  const name = useId();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!choice) {
      setError("Choose an option before submitting.");
      return;
    }
    actions.castVote(poll.id, choice);
    toast("Vote recorded. Thanks for weighing in.");
  };

  return (
    <form onSubmit={submit} noValidate>
      <fieldset aria-describedby={error ? `${name}-error` : undefined}>
        <legend className="sr-only">{poll.question}</legend>
        <div className="grid gap-2">
          {poll.options.map((option) => (
            <label
              key={option.id}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border px-3 py-2 text-[15px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                choice === option.id ? "border-accent/70 bg-accent-soft" : "border-line-strong hover:bg-surface-2",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={choice === option.id}
                onChange={() => {
                  setChoice(option.id);
                  setError(undefined);
                }}
                className="size-4 accent-[var(--accent)]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p id={`${name}-error`} className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="sm">
          Submit vote
        </Button>
        <span className="text-xs text-subtle">One vote per person. You can’t change it afterwards.</span>
      </div>
    </form>
  );
}

export function PollCard({ poll, linkTitle = true, onClose }: { poll: Poll; linkTitle?: boolean; onClose?: () => void }) {
  const { data, role, currentMember } = useDemo();
  const vote = getVote(data, poll.id, currentMember.id);
  const isManager = canManagePolls(role);
  const showResults = canSeePollResults(poll, { hasVoted: Boolean(vote), isManager });
  const results = pollResults(data, poll.id);
  const votedLabel = poll.options.find((o) => o.id === vote?.optionId)?.label;
  const comments = commentsFor(data, "poll", poll.id).length;

  const visibilityNote =
    poll.resultsVisibility === "after_vote"
      ? "Results appear once you vote."
      : "Results stay hidden until the poll closes.";

  return (
    <article className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
        <PollStatusBadge status={poll.status} />
        {vote ? (
          <Badge tone="success" icon={<CircleCheck aria-hidden />}>
            You voted
          </Badge>
        ) : poll.status === "open" ? (
          <Badge>Not voted yet</Badge>
        ) : null}
        <span>
          {poll.status === "open"
            ? poll.closesAt
              ? `Closes ${formatDate(poll.closesAt)}`
              : "No closing date"
            : poll.closesAt
              ? `Closed ${formatDate(poll.closesAt)}`
              : "Closed"}
        </span>
        {showResults && <span className="tabular">· {pluralise(results.total, "vote")}</span>}
      </div>

      <h3 className="mt-3 text-lg leading-snug font-semibold break-words">
        {linkTitle ? (
          <Link href={`/polls/${poll.id}`} className="hover:underline">
            {poll.question}
          </Link>
        ) : (
          poll.question
        )}
      </h3>
      {poll.description && <p className="mt-1 max-w-[65ch] text-sm text-muted">{poll.description}</p>}
      <p className="mt-1 text-xs text-subtle">Asked by {memberName(data, poll.createdBy)}</p>

      <div className="mt-4">
        {canVote(poll, Boolean(vote)) ? (
          <>
            <VoteForm poll={poll} />
            {isManager && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="mb-3 text-xs font-medium text-subtle">Live results (visible to you as a poll manager)</p>
                <PollResults poll={poll} />
              </div>
            )}
          </>
        ) : (
          <>
            {vote && poll.status === "open" && (
              <p className="mb-3 text-sm">
                You voted for <strong className="font-semibold">{votedLabel}</strong>.
              </p>
            )}
            {showResults ? (
              <PollResults poll={poll} votedOptionId={vote?.optionId} />
            ) : (
              <p className="flex items-center gap-2 rounded-[var(--radius-control)] bg-surface-2 px-3 py-2.5 text-sm text-muted">
                <EyeOff aria-hidden className="size-4 shrink-0" />
                {visibilityNote}
              </p>
            )}
          </>
        )}
      </div>

      {poll.status === "closed" && (
        <div className="mt-5 rounded-[var(--radius-control)] border border-line bg-bg px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Lock aria-hidden className="size-4 text-subtle" />
            Decision record
          </p>
          <p className="mt-1 text-sm text-fg">{poll.outcome ?? "No outcome summary was added when this poll closed."}</p>
          <p className="mt-2 text-xs text-subtle">
            Polls record member input to guide decisions. They are not formal or binding votes.
          </p>
        </div>
      )}

      {(linkTitle || (onClose && poll.status === "open")) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {linkTitle ? (
            <Link href={`/polls/${poll.id}`} className="text-sm font-medium text-accent-text hover:underline">
              {comments > 0 ? `Discussion (${comments})` : "Open discussion"}
            </Link>
          ) : (
            <span />
          )}
          {onClose && poll.status === "open" && (
            <Button size="sm" onClick={onClose}>
              <Lock aria-hidden />
              Close poll
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

export function ClosePollDialog({ poll, onClose }: { poll: Poll | null; onClose: () => void }) {
  return (
    <Dialog
      open={Boolean(poll)}
      onClose={onClose}
      title="Close this poll?"
      description={poll ? <span className="line-clamp-2">{poll.question}</span> : undefined}
    >
      {poll && <ClosePollForm poll={poll} onDone={onClose} />}
    </Dialog>
  );
}

function ClosePollForm({ poll, onDone }: { poll: Poll; onDone: () => void }) {
  const { data, actions } = useDemo();
  const toast = useToast();
  const [outcome, setOutcome] = useState("");
  const total = pollResults(data, poll.id).total;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        actions.closePoll(poll.id, outcome);
        toast("Poll closed. Results are now visible to everyone.");
        onDone();
      }}
      className="grid gap-4"
    >
      <p className="text-sm text-muted">
        No more votes will be accepted. Final results ({pluralise(total, "vote")}) become visible to everyone.
      </p>
      <FormField label="Outcome summary" hint="What was decided, in a sentence or two.">
        <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} />
      </FormField>
      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary">
          Close poll
        </Button>
      </div>
    </form>
  );
}

const MAX_OPTIONS = 6;

export function CreatePollDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Create a poll" description="Single-choice poll. Each person can vote once.">
      <CreatePollForm onDone={onClose} />
    </Dialog>
  );
}

function CreatePollForm({ onDone }: { onDone: () => void }) {
  const { actions } = useDemo();
  const toast = useToast();
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [closesAt, setClosesAt] = useState("");
  const [visibility, setVisibility] = useState<PollResultsVisibility>("after_vote");
  const [status, setStatus] = useState<PollStatus>("open");
  const [errors, setErrors] = useState<FieldErrors<"question" | "options">>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validatePoll({ question, description, options });
    setErrors(found);
    if (hasErrors(found)) return;
    actions.createPoll({ question, description, options, closesAt, resultsVisibility: visibility, status });
    toast(status === "open" ? "Poll created and open for votes." : "Poll created as closed.");
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <FormField label="Question" required error={errors.question}>
        <Input
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            setErrors((c) => ({ ...c, question: undefined }));
          }}
          autoComplete="off"
        />
      </FormField>
      <FormField label="Context">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </FormField>

      <fieldset aria-describedby={errors.options ? "poll-options-error" : undefined}>
        <legend className="text-sm font-medium">
          Options <span className="text-accent-text" aria-hidden>*</span>
          <span className="font-normal text-subtle"> (at least two)</span>
        </legend>
        <ol className="mt-2 grid gap-2">
          {options.map((option, index) => (
            <li key={index} className="flex gap-2">
              <label htmlFor={`poll-option-${index}`} className="sr-only">
                Option {index + 1}
              </label>
              <Input
                id={`poll-option-${index}`}
                value={option}
                placeholder={`Option ${index + 1}`}
                aria-invalid={Boolean(errors.options) && !option.trim()}
                onChange={(e) => {
                  setOptions((current) => current.map((o, i) => (i === index ? e.target.value : o)));
                  setErrors((c) => ({ ...c, options: undefined }));
                }}
              />
              {options.length > 2 && (
                <Button
                  variant="ghost"
                  className="px-3"
                  aria-label={`Remove option ${index + 1}`}
                  onClick={() => setOptions((current) => current.filter((_, i) => i !== index))}
                >
                  <Trash2 aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ol>
        {errors.options && (
          <p id="poll-options-error" className="mt-1.5 text-sm text-danger">
            {errors.options}
          </p>
        )}
        {options.length < MAX_OPTIONS && (
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setOptions((c) => [...c, ""])}>
            <Plus aria-hidden />
            Add option
          </Button>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Closing date">
          <Input type="date" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
        </FormField>
        <FormField label="Show results" required>
          <Select value={visibility} onChange={(e) => setVisibility(e.target.value as PollResultsVisibility)}>
            {(Object.keys(VISIBILITY_LABELS) as PollResultsVisibility[]).map((value) => (
              <option key={value} value={value}>
                {VISIBILITY_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <Segmented<PollStatus>
        label="Status"
        hideLabel={false}
        value={status}
        onChange={setStatus}
        options={[
          { value: "open", label: "Open for votes" },
          { value: "closed", label: "Closed" },
        ]}
      />

      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary">
          Create poll
        </Button>
      </div>
    </form>
  );
}
