"use client";

import { Plus, Vote } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BackLink, EmptyState, PageHeader } from "@/components/ui/Display";
import { NotFoundState, PageLoading } from "@/components/ui/States";
import { CommentThread } from "@/features/comments/CommentThread";
import { canManagePolls } from "@/lib/permissions";
import { getPoll, sortPolls } from "@/lib/selectors";
import { useDemo } from "@/state/store";
import type { Poll } from "@/types";
import { ClosePollDialog, CreatePollDialog, PollCard } from "./PollParts";

export function PollsList({ manage }: { manage?: boolean }) {
  const { data, role, ready } = useDemo();
  const [createOpen, setCreateOpen] = useState(false);
  const [closing, setClosing] = useState<Poll | null>(null);
  if (!ready) return <PageLoading />;
  const isManager = canManagePolls(role);
  const polls = sortPolls(data.polls);

  return (
    <>
      {manage && <BackLink href="/admin">Administration</BackLink>}
      <PageHeader
        title={manage ? "Polls and decisions" : "Polls"}
        description="Quick single-choice polls for small decisions. They gather input and are not formal votes."
        actions={
          isManager && (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden />
              Create poll
            </Button>
          )
        }
      />
      {polls.length === 0 ? (
        <EmptyState icon={Vote} title="No polls yet">
          {isManager ? "Create a poll to gather input from members." : "Polls from leads will appear here."}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {polls.map((poll) => (
            <li key={poll.id}>
              <PollCard poll={poll} onClose={isManager ? () => setClosing(poll) : undefined} />
            </li>
          ))}
        </ul>
      )}
      {isManager && <CreatePollDialog open={createOpen} onClose={() => setCreateOpen(false)} />}
      <ClosePollDialog poll={closing} onClose={() => setClosing(null)} />
    </>
  );
}

export function PollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, role, ready } = useDemo();
  const [closing, setClosing] = useState<Poll | null>(null);
  if (!ready) return <PageLoading />;
  const poll = getPoll(data, id);
  if (!poll) return <NotFoundState thing="Poll" backHref="/polls" backLabel="Back to Polls" />;
  return (
    <>
      <BackLink href="/polls">Polls</BackLink>
      <div className="max-w-2xl space-y-6">
        <PollCard poll={poll} linkTitle={false} onClose={canManagePolls(role) ? () => setClosing(poll) : undefined} />
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <CommentThread parentType="poll" parentId={poll.id} />
        </div>
      </div>
      <ClosePollDialog poll={closing} onClose={() => setClosing(null)} />
    </>
  );
}
