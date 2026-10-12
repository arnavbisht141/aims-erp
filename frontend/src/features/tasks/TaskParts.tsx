"use client";

import { BookOpen, CalendarDays, CircleCheck, CircleDashed, CircleDot, PencilLine, Vote } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Avatar } from "@/components/ui/Display";
import { FormField, Input, Segmented, Select, Textarea } from "@/components/ui/Form";
import { TaskStatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { CommentThread } from "@/features/comments/CommentThread";
import { cn } from "@/lib/cn";
import { firstName, formatDate, formatShortDate, ROLE_LABELS, TASK_STATUS_LABELS } from "@/lib/formatters";
import { canEditTask, canUpdateTaskStatus } from "@/lib/permissions";
import { assignableMembers, getMember, getPoll, getResource, memberName } from "@/lib/selectors";
import { hasErrors, validateTask, type FieldErrors } from "@/lib/validation";
import { useDemo } from "@/state/store";
import type { Task, TaskStatus } from "@/types";

export function TaskCard({ task, onOpen, selected }: { task: Task; onOpen: (id: string) => void; selected?: boolean }) {
  const { data, currentMember } = useDemo();
  const assignee = getMember(data, task.assigneeId);
  const resource = task.relatedResourceId ? getResource(data, task.relatedResourceId) : undefined;
  const isMine = task.assigneeId === currentMember.id;

  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      aria-haspopup="dialog"
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-[var(--radius-card)] border bg-surface p-4 text-left transition-colors hover:border-line-strong hover:bg-surface-2 sm:flex-row sm:items-center sm:gap-4",
        selected ? "border-accent/60" : "border-line",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className={cn("block font-semibold break-words", task.status === "done" && "text-muted line-through decoration-subtle")}>
          {task.title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays aria-hidden className="size-3.5" />
              Due {formatShortDate(task.dueDate)}
            </span>
          )}
          {resource && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <BookOpen aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate">{resource.title}</span>
            </span>
          )}
        </span>
      </span>
      <span className="flex items-center gap-3">
        <span className="flex items-center gap-2 text-sm text-muted">
          <Avatar name={assignee?.name ?? "?"} id={task.assigneeId} size="sm" />
          <span className="sm:hidden lg:inline">{isMine ? "You" : firstName(assignee?.name ?? "Former member")}</span>
        </span>
        <TaskStatusBadge status={task.status} />
      </span>
    </button>
  );
}

const STATUS_OPTIONS = [
  { value: "todo" as const, label: "To do", icon: <CircleDashed aria-hidden /> },
  { value: "in_progress" as const, label: "In progress", icon: <CircleDot aria-hidden /> },
  { value: "done" as const, label: "Done", icon: <CircleCheck aria-hidden /> },
];

export function TaskDetailSheet({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const { data } = useDemo();
  const task = taskId ? data.tasks.find((t) => t.id === taskId) : undefined;
  return (
    <Dialog open={Boolean(task)} onClose={onClose} title={task?.title ?? "Task"} variant="sheet">
      {task && <TaskDetail task={task} />}
    </Dialog>
  );
}

function TaskDetail({ task }: { task: Task }) {
  const { data, role, currentMember, actions } = useDemo();
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const canStatus = canUpdateTaskStatus(role, currentMember.id, task);
  const canEdit = canEditTask(role, currentMember.id, task);
  const resource = task.relatedResourceId ? getResource(data, task.relatedResourceId) : undefined;
  const poll = task.relatedPollId ? getPoll(data, task.relatedPollId) : undefined;

  const setStatus = (status: TaskStatus) => {
    actions.updateTaskStatus(task.id, status);
    toast(`Task marked as ${TASK_STATUS_LABELS[status].toLowerCase()}.`);
  };

  return (
    <div className="space-y-6">
      <div>
        {canStatus ? (
          <Segmented<TaskStatus> label="Task status" value={task.status} onChange={setStatus} options={STATUS_OPTIONS} />
        ) : (
          <TaskStatusBadge status={task.status} />
        )}
      </div>

      <p className="text-[15px] leading-relaxed whitespace-pre-line">{task.description || "No description."}</p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-subtle">Assignee</dt>
          <dd className="mt-0.5 font-medium">
            <Link href={`/people/${task.assigneeId}`} className="hover:underline">
              {memberName(data, task.assigneeId)}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-subtle">Created by</dt>
          <dd className="mt-0.5 font-medium">{memberName(data, task.createdBy)}</dd>
        </div>
        <div>
          <dt className="text-subtle">Due</dt>
          <dd className="mt-0.5 font-medium">{task.dueDate ? formatDate(task.dueDate) : "No due date"}</dd>
        </div>
        <div>
          <dt className="text-subtle">Created</dt>
          <dd className="mt-0.5 font-medium">{formatDate(task.createdAt)}</dd>
        </div>
        {(resource || poll) && (
          <div className="col-span-2">
            <dt className="text-subtle">Related</dt>
            <dd className="mt-1 space-y-1">
              {resource && (
                <Link href={`/resources/${resource.id}`} className="flex items-center gap-2 font-medium text-accent-text hover:underline">
                  <BookOpen aria-hidden className="size-4 shrink-0" />
                  {resource.title}
                </Link>
              )}
              {poll && (
                <Link href={`/polls/${poll.id}`} className="flex items-center gap-2 font-medium text-accent-text hover:underline">
                  <Vote aria-hidden className="size-4 shrink-0" />
                  {poll.question}
                </Link>
              )}
            </dd>
          </div>
        )}
      </dl>

      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <PencilLine aria-hidden />
            Edit task
          </Button>
          {task.status !== "done" && (
            <Button size="sm" variant="ghost" onClick={() => setStatus("done")}>
              <CircleCheck aria-hidden />
              Close task
            </Button>
          )}
        </div>
      )}

      <div className="border-t border-line pt-5">
        <CommentThread parentType="task" parentId={task.id} />
      </div>

      {canEdit && <TaskFormDialog open={editOpen} onClose={() => setEditOpen(false)} task={task} />}
    </div>
  );
}

interface TaskFormValues {
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  relatedResourceId: string;
}

export function TaskFormDialog({
  open,
  onClose,
  task,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  task?: Task;
  onCreated?: (id: string) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={task ? "Edit task" : "New task"}
      description={task ? undefined : "The assignee sees it on their Home dashboard and in Tasks."}
    >
      <TaskForm task={task} onDone={onClose} onCreated={onCreated} />
    </Dialog>
  );
}

function TaskForm({ task, onDone, onCreated }: { task?: Task; onDone: () => void; onCreated?: (id: string) => void }) {
  const { data, actions } = useDemo();
  const toast = useToast();
  const [values, setValues] = useState<TaskFormValues>({
    title: task?.title ?? "",
    description: task?.description ?? "",
    assigneeId: task?.assigneeId ?? "",
    dueDate: task?.dueDate ?? "",
    relatedResourceId: task?.relatedResourceId ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors<"title" | "assigneeId">>({});
  const people = assignableMembers(data).sort((a, b) => a.name.localeCompare(b.name));
  const resources = data.resources.filter((r) => r.reviewStatus === "published");

  const set = (key: keyof TaskFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === "title" || key === "assigneeId") setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateTask(values);
    setErrors(found);
    if (hasErrors(found)) return;
    const assignee = memberName(data, values.assigneeId);
    if (task) {
      actions.updateTask(task.id, {
        title: values.title.trim(),
        description: values.description.trim(),
        assigneeId: values.assigneeId,
        dueDate: values.dueDate || undefined,
        relatedResourceId: values.relatedResourceId || undefined,
      });
      toast("Task updated.");
    } else {
      const id = actions.createTask(values);
      toast(`Task created and assigned to ${assignee}.`);
      onCreated?.(id);
    }
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <FormField label="Title" required error={errors.title}>
        <Input value={values.title} onChange={(e) => set("title", e.target.value)} autoComplete="off" />
      </FormField>
      <FormField label="Description">
        <Textarea value={values.description} onChange={(e) => set("description", e.target.value)} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Assignee" required error={errors.assigneeId}>
          <Select value={values.assigneeId} onChange={(e) => set("assigneeId", e.target.value)}>
            <option value="">Choose a person</option>
            {people.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({ROLE_LABELS[member.role]})
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Due date">
          <Input type="date" value={values.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </FormField>
      </div>
      <FormField label="Related resource">
        <Select value={values.relatedResourceId} onChange={(e) => set("relatedResourceId", e.target.value)}>
          <option value="">None</option>
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.title}
            </option>
          ))}
        </Select>
      </FormField>
      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary">
          {task ? "Save changes" : "Create task"}
        </Button>
      </div>
    </form>
  );
}
