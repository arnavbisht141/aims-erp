"use client";

import { BookMarked, CircleCheck, CircleDashed, CircleDot, Users } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Avatar } from "@/components/ui/Display";
import { FormField, Input, Segmented, Select, Textarea } from "@/components/ui/Form";
import { Badge, ProgressBadge, ReviewBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { RESOURCE_CATEGORIES } from "@/data/seed";
import { cn } from "@/lib/cn";
import { formatDate, pluralise, PROGRESS_LABELS, RESOURCE_TYPE_LABELS, ROLE_LABELS } from "@/lib/formatters";
import { activeJuniors, assignableMembers, getAssignment, memberName } from "@/lib/selectors";
import { hasErrors, validateResource, type FieldErrors, type ResourceInput } from "@/lib/validation";
import { useDemo } from "@/state/store";
import type { Resource, ResourceAssignment, ResourceProgress, ResourceType } from "@/types";

export const RESOURCE_TYPE_OPTIONS = (Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[]).map((value) => ({
  value,
  label: RESOURCE_TYPE_LABELS[value],
}));

export function categoryOptions(resources: Resource[]) {
  const all = new Set([...RESOURCE_CATEGORIES, ...resources.map((r) => r.category)]);
  return Array.from(all).map((value) => ({ value, label: value }));
}

/** Lets the assignee set their own learning progress. */
export function ProgressControl({
  assignment,
  size = "md",
  label = "Your progress",
}: {
  assignment: ResourceAssignment;
  size?: "sm" | "md";
  label?: string;
}) {
  const { actions } = useDemo();
  const toast = useToast();
  return (
    <Segmented<ResourceProgress>
      label={label}
      size={size}
      value={assignment.status}
      onChange={(status) => {
        actions.updateAssignmentStatus(assignment.id, status);
        toast(`Progress updated: ${PROGRESS_LABELS[status]}.`);
      }}
      options={[
        { value: "not_started", label: "Not started", icon: <CircleDashed aria-hidden /> },
        { value: "in_progress", label: "In progress", icon: <CircleDot aria-hidden /> },
        { value: "completed", label: "Completed", icon: <CircleCheck aria-hidden /> },
      ]}
    />
  );
}

export function ResourceCard({ resource }: { resource: Resource }) {
  const { data, currentMember } = useDemo();
  const assignment = getAssignment(data, resource.id, currentMember.id);
  const submitter = memberName(data, resource.submittedBy);

  return (
    <article className="group relative flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-colors hover:border-line-strong hover:bg-surface-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
        <span className="font-medium text-accent-text">{RESOURCE_TYPE_LABELS[resource.type]}</span>
        <span aria-hidden className="text-line-strong">/</span>
        <span>{resource.category}</span>
      </div>
      <h3 className="mt-2 text-[17px] leading-snug font-semibold break-words">
        <Link href={`/resources/${resource.id}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none group-has-[:focus-visible]:underline">
          {resource.title}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{resource.description || "No description provided."}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <ReviewBadge status={resource.reviewStatus} />
        {assignment && (
          <>
            <Badge tone="info" icon={<BookMarked aria-hidden />}>
              Assigned to you
            </Badge>
            <ProgressBadge status={assignment.status} />
          </>
        )}
        <span className="ml-auto text-xs text-subtle">
          {submitter} · <time dateTime={resource.createdAt}>{formatDate(resource.createdAt)}</time>
        </span>
      </div>
    </article>
  );
}

const EMPTY_RESOURCE: ResourceInput = { title: "", url: "", type: "", category: "", description: "", note: "" };

export function SuggestResourceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Suggest a resource"
      description="Share a link others in AIMS would find useful."
    >
      <SuggestResourceForm onDone={onClose} />
    </Dialog>
  );
}

function SuggestResourceForm({ onDone }: { onDone: () => void }) {
  const { data, actions, role } = useDemo();
  const toast = useToast();
  const [values, setValues] = useState<ResourceInput>(EMPTY_RESOURCE);
  const [errors, setErrors] = useState<FieldErrors<keyof ResourceInput>>({});
  const autoPublish = role === "senior" || role === "admin";

  const set = <K extends keyof ResourceInput>(key: K, value: ResourceInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateResource(values);
    setErrors(found);
    if (hasErrors(found)) return;
    const { published } = actions.submitResource({ ...values, type: values.type as ResourceType });
    toast(published ? "Resource added to the library." : "Thanks! Your suggestion is in the library, pending review by a lead.");
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <FormField label="Title" required error={errors.title}>
        <Input value={values.title} onChange={(e) => set("title", e.target.value)} autoComplete="off" />
      </FormField>
      <FormField label="Link" required error={errors.url} hint="The full web address, starting with https://">
        <Input type="url" inputMode="url" value={values.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Type" required error={errors.type}>
          <Select value={values.type} onChange={(e) => set("type", e.target.value as ResourceType | "")}>
            <option value="">Choose a type</option>
            {RESOURCE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Topic" required error={errors.category}>
          <Select value={values.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Choose a topic</option>
            {categoryOptions(data.resources).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <FormField label="Description">
        <Textarea value={values.description} onChange={(e) => set("description", e.target.value)} />
      </FormField>
      <FormField label="Why it is useful" hint="A sentence for whoever reviews it.">
        <Textarea value={values.note} onChange={(e) => set("note", e.target.value)} rows={2} />
      </FormField>
      <p className="rounded-[var(--radius-control)] bg-surface-2 px-3 py-2 text-sm text-muted">
        {autoPublish
          ? `As a ${ROLE_LABELS[role]}, your suggestion is published straight away.`
          : "Suggestions appear as “Pending review” until a lead publishes them. Only you and leads can see it until then."}
      </p>
      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary">
          {autoPublish ? "Add resource" : "Submit suggestion"}
        </Button>
      </div>
    </form>
  );
}

export function AssignResourceDialog({
  resource,
  open,
  onClose,
}: {
  resource: Resource;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Assign resource"
      description={<span className="line-clamp-1">{resource.title}</span>}
    >
      <AssignForm resource={resource} onDone={onClose} />
    </Dialog>
  );
}

function AssignForm({ resource, onDone }: { resource: Resource; onDone: () => void }) {
  const { data, actions } = useDemo();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const people = assignableMembers(data).filter((m) => m.role === "junior" || m.role === "member");
  const alreadyAssigned = new Set(data.assignments.filter((a) => a.resourceId === resource.id).map((a) => a.memberId));
  const juniorIds = activeJuniors(data).map((m) => m.id).filter((id) => !alreadyAssigned.has(id));

  const toggle = (id: string) => {
    setError(undefined);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (selected.size === 0) {
      setError("Choose at least one person.");
      return;
    }
    actions.assignResource(resource.id, Array.from(selected));
    toast(`Assigned to ${pluralise(selected.size, "person", "people")}. It now appears on their dashboard.`);
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">Choose people or a group.</p>
        <Button
          size="sm"
          onClick={() => {
            setError(undefined);
            setSelected(new Set([...selected, ...juniorIds]));
          }}
          disabled={juniorIds.length === 0}
        >
          <Users aria-hidden />
          Select all juniors
        </Button>
      </div>
      <fieldset aria-describedby={error ? "assign-error" : undefined}>
        <legend className="sr-only">People to assign</legend>
        <ul className="divide-y divide-line rounded-[var(--radius-control)] border border-line">
          {people.map((member) => {
            const assigned = alreadyAssigned.has(member.id);
            return (
              <li key={member.id}>
                <label
                  className={cn(
                    "flex min-h-12 items-center gap-3 px-3 py-2",
                    assigned ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-surface-2",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={assigned || selected.has(member.id)}
                    disabled={assigned}
                    onChange={() => toggle(member.id)}
                    className="size-4 accent-[var(--accent)]"
                  />
                  <Avatar name={member.name} id={member.id} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{member.name}</span>
                    <span className="block text-xs text-muted">
                      {ROLE_LABELS[member.role]} · {member.yearLabel}
                    </span>
                  </span>
                  {assigned && <span className="text-xs text-subtle">Already assigned</span>}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>
      {error && (
        <p id="assign-error" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary">
          Assign{selected.size > 0 ? ` to ${pluralise(selected.size, "person", "people")}` : ""}
        </Button>
      </div>
    </form>
  );
}
