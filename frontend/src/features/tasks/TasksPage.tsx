"use client";

import { ListChecks, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Display";
import { FilterSelect, Segmented } from "@/components/ui/Form";
import { PageLoading } from "@/components/ui/States";
import { pluralise, TASK_STATUS_LABELS } from "@/lib/formatters";
import { canCreateTasks, canViewAllTasks } from "@/lib/permissions";
import { tasksForScope, type TaskScope } from "@/lib/selectors";
import { useDemo } from "@/state/store";
import type { TaskStatus } from "@/types";
import { TaskCard, TaskDetailSheet, TaskFormDialog } from "./TaskParts";

const STATUS_FILTER = (Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((value) => ({
  value,
  label: TASK_STATUS_LABELS[value],
}));

export function TasksPage() {
  const { data, role, currentMember, ready } = useDemo();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [scope, setScope] = useState<TaskScope>("assigned");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get("task"));
  const [createOpen, setCreateOpen] = useState(false);

  if (!ready) return <PageLoading />;

  const canCreate = canCreateTasks(role);
  const createdAny = data.tasks.some((t) => t.createdBy === currentMember.id);
  const scopes: { value: TaskScope; label: string }[] = [
    { value: "assigned", label: "Assigned to me" },
    ...(canCreate || createdAny ? [{ value: "created" as const, label: "Created by me" }] : []),
    ...(canViewAllTasks(role) ? [{ value: "all" as const, label: "All tasks" }] : []),
  ];
  // Switching to a role without the selected scope falls back to "Assigned to me".
  const activeScope = scopes.some((s) => s.value === scope) ? scope : "assigned";
  const tasks = tasksForScope(data, role, currentMember.id, activeScope, status);
  const selectedVisible = selectedId && tasksForScope(data, role, currentMember.id, "all", "").some((t) => t.id === selectedId);

  const closeDetail = () => {
    setSelectedId(null);
    if (searchParams.get("task")) router.replace("/tasks", { scroll: false });
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        description={
          canCreate
            ? "Assign small pieces of work, follow their status, and discuss them in one place."
            : "Work assigned to you. Update the status as you go so your lead knows where things stand."
        }
        actions={
          canCreate && (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden />
              New task
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {scopes.length > 1 ? (
          <Segmented<TaskScope> label="Show tasks" value={activeScope} onChange={setScope} options={scopes} />
        ) : (
          <span />
        )}
        <FilterSelect
          label="Filter by status"
          allLabel="Any status"
          value={status}
          onChange={(value) => setStatus(value as TaskStatus | "")}
          options={STATUS_FILTER}
          className="sm:w-48"
        />
      </div>

      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {pluralise(tasks.length, "task")}
      </p>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={status ? `No tasks marked “${TASK_STATUS_LABELS[status]}”` : "No tasks here"}
          action={status ? <Button onClick={() => setStatus("")}>Show any status</Button> : undefined}
        >
          {activeScope === "assigned"
            ? "When a lead assigns you a task, it appears here and on your Home dashboard."
            : "Tasks you create appear here."}
        </EmptyState>
      ) : (
        <ul className="grid gap-2.5">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} onOpen={setSelectedId} selected={task.id === selectedId} />
            </li>
          ))}
        </ul>
      )}

      <TaskDetailSheet taskId={selectedVisible ? selectedId : null} onClose={closeDetail} />
      {canCreate && (
        <TaskFormDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => setScope("created")} />
      )}
    </>
  );
}
