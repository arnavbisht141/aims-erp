"use client";

import { BookOpen, CalendarCheck, ListChecks, Megaphone, Users, Vote } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, PageHeader, Panel, PanelLink, ProgressBar, StatCard } from "@/components/ui/Display";
import { PageLoading } from "@/components/ui/States";
import { ProgressBadge, TaskStatusBadge } from "@/components/ui/StatusBadge";
import { firstName, formatDate, formatShortDate, pluralise, RESOURCE_TYPE_LABELS, ROLE_LABELS } from "@/lib/formatters";
import { canManagePolls, isLead } from "@/lib/permissions";
import {
  assignedResourcesForMember,
  attendanceSummaryForMember,
  countAttendance,
  getVote,
  latestSession,
  membershipSummary,
  memberName,
  openTasksForMember,
  progressForMember,
  progressOverview,
  sortPolls,
  visibleResources,
} from "@/lib/selectors";
import { useDemo } from "@/state/store";

const DESCRIPTIONS = {
  member: "Your AIMS workspace. See what is new and what is waiting for you.",
  junior: "Your AIMS workspace. Pick up where you left off.",
  senior: "Your AIMS workspace. Here is what needs a lead's attention.",
  admin: "Your AIMS workspace. A look at the whole society.",
} as const;

export function HomePage() {
  const { data, role, currentMember, ready } = useDemo();
  if (!ready) return <PageLoading />;

  const me = currentMember.id;
  const myTasks = openTasksForMember(data, me);
  const polls = sortPolls(data.polls);
  const openPolls = polls.filter((p) => p.status === "open");
  const myOpenPolls = openPolls.filter((p) => !getVote(data, p.id, me));
  const recent = visibleResources(data, role, me).filter((r) => r.reviewStatus === "published").slice(0, 4);
  const assigned = assignedResourcesForMember(data, me);
  const progress = progressForMember(data, me);
  const attendance = attendanceSummaryForMember(data, me);
  const showLearning = role === "junior" || role === "member";
  const lead = isLead(role);

  const session = latestSession(data);
  const att = countAttendance(data.attendanceRecords.filter((r) => r.sessionId === session?.id));
  const { totals, rows } = progressOverview(data);
  const membership = membershipSummary(data);
  const managedTasks = data.tasks.filter((t) => t.createdBy === me && t.status !== "done");
  const managedPolls = openPolls.filter((p) => p.createdBy === me);

  return (
    <>
      <PageHeader title={`Hello, ${firstName(currentMember.name)}`} description={DESCRIPTIONS[role]} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {lead ? (
          <>
            <StatCard label="Latest session" value={`${att.present}/${att.total}`} detail="marked present" href="/admin/attendance" icon={CalendarCheck} />
            <StatCard label="Junior progress" value={`${totals.percent}%`} detail={`${rows.length} juniors`} href="/admin/progress" icon={Users} />
            <StatCard label={role === "admin" ? "Active members" : "Tasks you manage"} value={role === "admin" ? membership.active : managedTasks.length} detail={role === "admin" ? `${membership.pendingInvites} invites pending` : "not done yet"} href={role === "admin" ? "/admin" : "/tasks"} icon={ListChecks} />
            <StatCard label={role === "admin" ? "Open polls" : "Polls you manage"} value={role === "admin" ? openPolls.length : managedPolls.length} detail="open for votes" href="/admin/polls" icon={Vote} />
          </>
        ) : (
          <>
            <StatCard label="Assigned resources" value={assigned.length} detail={`${progress.completed} completed`} href="/resources?assigned=me" icon={BookOpen} />
            <StatCard label="Your progress" value={`${progress.percent}%`} detail={`${progress.total} items`} href="/profile" icon={ListChecks} />
            <StatCard label="Open tasks" value={myTasks.length} detail="assigned to you" href="/tasks" icon={ListChecks} />
            <StatCard label="Polls to vote on" value={myOpenPolls.length} detail="waiting for you" href="/polls" icon={Vote} />
          </>
        )}
      </div>

      {lead && (
        <div className="mb-6 flex flex-wrap gap-2">
          <ButtonLink href="/admin/attendance" variant="primary">Mark attendance</ButtonLink>
          <ButtonLink href="/admin/progress">Review progress</ButtonLink>
          {canManagePolls(role) && <ButtonLink href="/admin/polls">Create a poll</ButtonLink>}
          <ButtonLink href="/tasks">Assign a task</ButtonLink>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {showLearning && (
          <Panel title={role === "junior" ? "Assigned to you" : "Your learning"} id="h-assigned" action={<PanelLink href="/resources?assigned=me">All</PanelLink>}>
            {assigned.length === 0 ? (
              <EmptyState compact icon={BookOpen} title="Nothing assigned yet">Browse the library to find something to learn next.</EmptyState>
            ) : (
              <>
                <ProgressBar percent={progress.percent} label="Your completion" className="mb-3" />
                <ul className="divide-y divide-line">
                  {assigned.slice(0, 4).map(({ assignment, resource }) => (
                    <li key={assignment.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <Link href={`/resources/${resource.id}`} className="min-w-0 text-sm font-medium hover:underline">{resource.title}</Link>
                      <ProgressBadge status={assignment.status} />
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-3 text-xs text-subtle">
              Attendance: {attendance.attended} of {attendance.marked} marked sessions (only you can see this).
            </p>
          </Panel>
        )}

        <Panel title={lead ? "Tasks" : "Your tasks"} id="h-tasks" action={<PanelLink href="/tasks">All tasks</PanelLink>}>
          {(lead ? [...myTasks, ...managedTasks.filter((t) => t.assigneeId !== me)] : myTasks).length === 0 ? (
            <EmptyState compact icon={ListChecks} title="No open tasks">You are all caught up.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {(lead ? [...myTasks, ...managedTasks.filter((t) => t.assigneeId !== me)] : myTasks).slice(0, 5).map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <Link href={`/tasks?task=${t.id}`} className="min-w-0 text-sm">
                    <span className="font-medium hover:underline">{t.title}</span>
                    <span className="block text-xs text-subtle">
                      {t.assigneeId === me ? "You" : memberName(data, t.assigneeId)}
                      {t.dueDate ? ` · due ${formatShortDate(t.dueDate)}` : ""}
                    </span>
                  </Link>
                  <TaskStatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Polls" id="h-polls" action={<PanelLink href="/polls">All polls</PanelLink>}>
          {openPolls.length === 0 ? (
            <EmptyState compact icon={Vote} title="No open polls">New polls will show up here.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {openPolls.slice(0, 3).map((p) => (
                <li key={p.id} className="py-2.5">
                  <Link href={`/polls/${p.id}`} className="text-sm font-medium hover:underline">{p.question}</Link>
                  <span className="block text-xs text-subtle">
                    {getVote(data, p.id, me) ? "You voted" : "Not voted yet"}
                    {p.closesAt ? ` · closes ${formatShortDate(p.closesAt)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={role === "member" ? "Recommended for you" : "Recently shared"} id="h-recent" action={<PanelLink href="/resources">Library</PanelLink>}>
          <ul className="divide-y divide-line">
            {recent.map((r) => (
              <li key={r.id} className="py-2.5">
                <Link href={`/resources/${r.id}`} className="text-sm font-medium hover:underline">{r.title}</Link>
                <span className="block text-xs text-subtle">
                  {RESOURCE_TYPE_LABELS[r.type]} · {memberName(data, r.submittedBy)} · {formatDate(r.createdAt)}
                </span>
              </li>
            ))}
          </ul>
          {role === "member" && (
            <p className="mt-3 text-sm text-muted">
              Looking for collaborators? <Link href="/people" className="font-medium text-accent-text hover:underline">Browse the member directory</Link>.
            </p>
          )}
        </Panel>

        <Panel title="Announcements" id="h-news" className="lg:col-span-2">
          <ul className="grid gap-4 md:grid-cols-3">
            {data.announcements.map((a) => (
              <li key={a.id}>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Megaphone aria-hidden className="size-4 shrink-0 text-accent-text" />
                  {a.title}
                </p>
                <p className="mt-1 text-sm text-muted">{a.body}</p>
                <p className="mt-1 text-xs text-subtle">{memberName(data, a.authorId)} · {formatDate(a.createdAt)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <p className="mt-6 text-xs text-subtle">
        Viewing as {ROLE_LABELS[role]}. {pluralise(data.members.length, "sample person", "sample people")} in this demo.
      </p>
    </>
  );
}
