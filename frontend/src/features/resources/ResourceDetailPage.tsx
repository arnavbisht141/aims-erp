"use client";

import { Check, ExternalLink, Hourglass, Lock, UserPlus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Avatar, BackLink, Panel } from "@/components/ui/Display";
import { NotFoundState, PageLoading } from "@/components/ui/States";
import { ProgressBadge, ReviewBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { CommentThread } from "@/features/comments/CommentThread";
import { formatDate, RESOURCE_TYPE_LABELS } from "@/lib/formatters";
import { canAssignResources, canReviewResources, canSeeResource } from "@/lib/permissions";
import { assignmentsForResource, countProgress, getAssignment, getMember, getResource, memberName } from "@/lib/selectors";
import { useDemo } from "@/state/store";
import { AssignResourceDialog, ProgressControl } from "./ResourceParts";

export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, role, currentMember, actions, ready } = useDemo();
  const toast = useToast();
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  const resource = getResource(data, id);
  if (!ready) return <PageLoading />;
  if (!resource || !canSeeResource(role, currentMember.id, resource)) {
    return <NotFoundState thing="Resource" backHref="/resources" backLabel="Back to Resources" />;
  }

  const submitter = getMember(data, resource.submittedBy);
  const ownAssignment = getAssignment(data, resource.id, currentMember.id);
  const canAssign = canAssignResources(role) && resource.reviewStatus === "published";
  const isReviewer = canReviewResources(role);
  const assignments = assignmentsForResource(data, resource.id);
  const counts = countProgress(assignments.map((a) => a.status));
  const showNote = resource.note && (isReviewer || resource.submittedBy === currentMember.id);

  return (
    <>
      <BackLink href="/resources">Resources</BackLink>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <article>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-accent-text">{RESOURCE_TYPE_LABELS[resource.type]}</span>
              <span aria-hidden className="text-line-strong">/</span>
              <span className="text-muted">{resource.category}</span>
              <ReviewBadge status={resource.reviewStatus} />
            </div>
            <h1 className="mt-2 text-[28px] leading-tight font-semibold break-words sm:text-[34px]">{resource.title}</h1>
            <p className="mt-3 max-w-[65ch] text-[16px] leading-relaxed text-muted">
              {resource.description || "No description provided."}
            </p>

            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-subtle">Shared by</dt>
                <dd className="mt-0.5 font-medium">
                  {submitter ? (
                    <Link href={`/people/${submitter.id}`} className="hover:underline">
                      {submitter.name}
                    </Link>
                  ) : (
                    "Former member"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-subtle">Added</dt>
                <dd className="mt-0.5 font-medium">
                  <time dateTime={resource.createdAt}>{formatDate(resource.createdAt)}</time>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-subtle">Link</dt>
                <dd className="mt-0.5 max-w-full truncate font-medium text-muted">{resource.url.replace(/^https?:\/\//, "")}</dd>
              </div>
            </dl>

            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("primary", "md", "mt-6")}
            >
              Open resource
              <ExternalLink aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>

            {showNote && (
              <p className="mt-6 max-w-[65ch] rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted">
                <span className="font-medium text-fg">Why it was suggested: </span>
                {resource.note}
              </p>
            )}
          </article>

          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
            <CommentThread parentType="resource" parentId={resource.id} />
          </div>
        </div>

        <aside className="space-y-4">
          {isReviewer && resource.reviewStatus === "pending_review" && (
            <Panel title="Review suggestion" id="review-heading">
              <p className="flex items-start gap-2 text-sm text-muted">
                <Hourglass aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
                Only the person who suggested it and leads can see this until it is published.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    actions.reviewResource(resource.id, "publish");
                    toast("Published. Everyone in AIMS can now see this resource.");
                  }}
                >
                  <Check aria-hidden />
                  Publish
                </Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmReject(true)}>
                  Decline
                </Button>
              </div>
            </Panel>
          )}

          {ownAssignment && (
            <Panel title="Your progress" id="own-progress-heading">
              <p className="mb-3 text-sm text-muted">
                Assigned by {memberName(data, ownAssignment.assignedBy)} on {formatDate(ownAssignment.assignedAt)}.
              </p>
              <ProgressControl assignment={ownAssignment} />
              <p className="mt-3 flex items-center gap-1.5 text-xs text-subtle">
                <Lock aria-hidden className="size-3.5" />
                Visible only to you and leads.
              </p>
            </Panel>
          )}

          {isReviewer && (
            <Panel
              title="Assigned to"
              id="assignees-heading"
              action={
                canAssign && (
                  <Button size="sm" onClick={() => setAssignOpen(true)}>
                    <UserPlus aria-hidden />
                    Assign
                  </Button>
                )
              }
            >
              {assignments.length === 0 ? (
                <p className="text-sm text-muted">
                  {canAssign ? "Not assigned to anyone yet." : "Publish this resource before assigning it."}
                </p>
              ) : (
                <>
                  <p className="tabular mb-3 text-sm text-muted">
                    {counts.completed} of {counts.total} completed
                  </p>
                  <ul className="space-y-2.5">
                    {assignments.map((assignment) => {
                      const member = getMember(data, assignment.memberId);
                      return (
                        <li key={assignment.id} className="flex items-center gap-2.5">
                          <Avatar name={member?.name ?? "?"} id={assignment.memberId} size="sm" />
                          <span className="min-w-0 flex-1 truncate text-sm">{member?.name ?? "Former member"}</span>
                          <ProgressBadge status={assignment.status} />
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              <p className="mt-4 flex items-center gap-1.5 text-xs text-subtle">
                <Lock aria-hidden className="size-3.5" />
                Individual progress is shown to leads only.
              </p>
            </Panel>
          )}
        </aside>
      </div>

      {canAssign && <AssignResourceDialog resource={resource} open={assignOpen} onClose={() => setAssignOpen(false)} />}
      <ConfirmDialog
        open={confirmReject}
        title="Decline this suggestion?"
        description="It will be removed from the library for everyone, including the person who suggested it."
        confirmLabel="Decline suggestion"
        tone="danger"
        onCancel={() => setConfirmReject(false)}
        onConfirm={() => {
          setConfirmReject(false);
          router.push("/resources");
          actions.reviewResource(resource.id, "reject");
          toast("Suggestion declined and removed.");
        }}
      />
    </>
  );
}
