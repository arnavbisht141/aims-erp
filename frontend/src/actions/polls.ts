"use server";

import { db, ensureDbReady } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentMember, requireAuth, requireLead } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { PollResultsVisibility } from "@/types";

export interface PollOptionResult {
  id: string;
  label: string;
  count: number;
  percent: number;
}

export interface PollSummary {
  id: string;
  question: string;
  description: string | null;
  status: "open" | "closed";
  closesAt: string | null;
  resultsVisibility: PollResultsVisibility;
  outcome: string | null;
  creatorName: string;
  hasVoted: boolean;
  userVotedOptionId: string | null;
  totalVotes: number;
  options: PollOptionResult[];
  canSeeResults: boolean;
}

export async function getPolls(): Promise<PollSummary[]> {
  await ensureDbReady();
  const currentMember = await getCurrentMember();

  const allPolls = await db
    .select({
      poll: schema.polls,
      creatorName: schema.members.name,
    })
    .from(schema.polls)
    .leftJoin(schema.members, eq(schema.polls.createdBy, schema.members.id))
    .orderBy(desc(schema.polls.createdAt));

  const allOptions = await db.select().from(schema.pollOptions);
  const allVotes = await db.select().from(schema.pollVotes);

  const isManager = Boolean(
    currentMember && (currentMember.role === "admin" || currentMember.role === "senior")
  );

  return allPolls.map(({ poll, creatorName }: any) => {
    const pollOptions = allOptions
      .filter((o: any) => o.pollId === poll.id)
      .sort((a: any, b: any) => a.displayOrder - b.displayOrder);

    const pollVotes = allVotes.filter((v: any) => v.pollId === poll.id);
    const userVote = currentMember
      ? pollVotes.find((v: any) => v.memberId === currentMember.id)
      : null;

    const hasVoted = Boolean(userVote);
    const totalVotes = pollVotes.length;

    // Visibility rules:
    // Manager or closed => always true
    // always => true
    // after_vote => hasVoted
    let canSeeResults = isManager || poll.status === "closed";
    if (!canSeeResults) {
      if (poll.resultsVisibility === "always") canSeeResults = true;
      else if (poll.resultsVisibility === "after_vote") canSeeResults = hasVoted;
    }

    const optionsResults: PollOptionResult[] = pollOptions.map((opt: any) => {
      const count = pollVotes.filter((v: any) => v.optionId === opt.id).length;
      const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
      return {
        id: opt.id,
        label: opt.label,
        count,
        percent,
      };
    });

    return {
      id: poll.id,
      question: poll.question,
      description: poll.description,
      status: poll.status as any,
      closesAt: poll.closesAt,
      resultsVisibility: poll.resultsVisibility as any,
      outcome: poll.outcome,
      creatorName: creatorName || "AIMS Council",
      hasVoted,
      userVotedOptionId: userVote ? userVote.optionId : null,
      totalVotes,
      options: optionsResults,
      canSeeResults,
    };
  });
}

export async function getPollById(id: string): Promise<PollSummary | null> {
  const polls = await getPolls();
  return polls.find((p) => p.id === id) || null;
}

export async function castVote(pollId: string, optionId: string) {
  const actor = await requireAuth();
  await ensureDbReady();

  // Check if poll is open
  const poll = await db
    .select()
    .from(schema.polls)
    .where(eq(schema.polls.id, pollId))
    .limit(1);

  if (poll.length === 0 || poll[0].status !== "open") {
    throw new Error("This poll is closed or does not exist.");
  }

  // Prevent duplicate vote
  const existingVote = await db
    .select()
    .from(schema.pollVotes)
    .where(eq(schema.pollVotes.pollId, pollId))
    .where(eq(schema.pollVotes.memberId, actor.id));

  if (existingVote.length > 0) {
    throw new Error("You have already cast your vote in this poll.");
  }

  const voteId = `vote-${Date.now()}-${actor.id}`;
  await db.insert(schema.pollVotes).values({
    id: voteId,
    pollId,
    optionId,
    memberId: actor.id,
  });

  revalidatePath("/polls");
  revalidatePath(`/polls/${pollId}`);
  return { success: true };
}

export async function createPoll(input: {
  question: string;
  description?: string;
  options: string[];
  resultsVisibility: PollResultsVisibility;
  closesAt?: string;
}) {
  const actor = await requireLead();
  await ensureDbReady();

  const filledOptions = input.options.map((o) => o.trim()).filter(Boolean);
  if (filledOptions.length < 2) {
    throw new Error("A poll requires at least 2 distinct options.");
  }

  const pollId = `pl-${Date.now()}`;
  await db.insert(schema.polls).values({
    id: pollId,
    question: input.question.trim(),
    description: input.description?.trim() || null,
    createdBy: actor.id,
    status: "open",
    resultsVisibility: input.resultsVisibility,
    closesAt: input.closesAt?.trim() || null,
  });

  for (let i = 0; i < filledOptions.length; i++) {
    await db.insert(schema.pollOptions).values({
      id: `${pollId}-o${i + 1}`,
      pollId,
      label: filledOptions[i],
      displayOrder: i,
    });
  }

  revalidatePath("/polls");
  revalidatePath("/admin/polls");
  return { success: true, pollId };
}

export async function closePoll(pollId: string, outcome?: string) {
  await requireLead();
  await ensureDbReady();

  await db
    .update(schema.polls)
    .set({
      status: "closed",
      outcome: outcome?.trim() || null,
    })
    .where(eq(schema.polls.id, pollId));

  revalidatePath("/polls");
  revalidatePath(`/polls/${pollId}`);
  revalidatePath("/admin/polls");
  return { success: true };
}
