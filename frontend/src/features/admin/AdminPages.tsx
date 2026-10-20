"use client";

import { CalendarCheck, Check, ChevronRight, Lock, TrendingUp, UserPlus, Users, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { Avatar, BackLink, EmptyState, PageHeader, Panel, ProgressBar, StatCard } from "@/components/ui/Display";
import { FormField, Input, SearchInput, Segmented, Select } from "@/components/ui/Form";
import { RoleGate } from "@/components/ui/States";
import { AttendanceBadge, Badge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { PollsList } from "@/features/polls/PollsPages";
import { formatDate, formatShortDate, PROGRESS_LABELS, ROLE_LABELS } from "@/lib/formatters";
import { canAccessAdministration, canManageAttendance, canManageMembers, canManagePolls, canManageProgress } from "@/lib/permissions";
import {
  attendanceForSession,
  countAttendance,
  latestSession,
  learningEntriesForMember,
  membershipSummary,
  progressForMember,
  progressOverview,
} from "@/lib/selectors";
import { hasErrors, validateInvite, type FieldErrors } from "@/lib/validation";
import { useDemo } from "@/state/store";
import type { AttendanceStatus, ResourceProgress, UserRole } from "@/types";

const LEADS: UserRole[] = ["senior", "admin"];
const ADMIN_ROLES: UserRole[] = ["attendance_manager", "senior", "admin"];

export function AdminOverviewPage() {
  const { data, role } = useDemo();
  const session = latestSession(data);
  const att = countAttendance(data.attendanceRecords.filter((r) => r.sessionId === session?.id));
  const { totals, rows } = progressOverview(data);
  const open = data.polls.filter((p) => p.status === "open");
  return (
    <RoleGate allow={canAccessAdministration} area="Administration" allowed={ADMIN_ROLES}>
      <PageHeader title="Administration" description="Attendance, junior progress and polls. Visible to authorised leads and managers in this demo." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Attendance" id="adm-att">
          <p className="text-sm text-muted">Record who attended each session.</p>
          <p className="tabular mt-3 text-sm">
            Latest: <strong>{session?.title}</strong>
            <br />
            {att.present} present · {att.absent} absent · {att.not_marked} not marked
          </p>
          <ButtonLink href="/admin/attendance" variant="primary" className="mt-4">
            Mark attendance
          </ButtonLink>
        </Panel>
        {canManageProgress(role) && (
          <Panel title="Junior progress" id="adm-prog">
            <p className="text-sm text-muted">Review and update what each junior is working through.</p>
            <p className="tabular mt-3 text-sm">
              {rows.length} juniors · {totals.completed} of {totals.total} items completed ({totals.percent}%)
            </p>
            <ButtonLink href="/admin/progress" variant="primary" className="mt-4">
              Review progress
            </ButtonLink>
          </Panel>
        )}
        {canManagePolls(role) && (
          <Panel title="Polls and decisions" id="adm-polls">
            <p className="text-sm text-muted">Gather input and record outcomes.</p>
            <p className="tabular mt-3 text-sm">
              {open.length} open · {data.polls.length - open.length} closed
            </p>
            <ButtonLink href="/admin/polls" variant="primary" className="mt-4">
              Manage polls
            </ButtonLink>
          </Panel>
        )}
      </div>
      {canManageMembers(role) && <MembersPanel />}
    </RoleGate>
  );
}

function MembersPanel() {
  const { data, actions } = useDemo();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const s = membershipSummary(data);
  return (
    <section className="mt-8" aria-labelledby="members-h">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="members-h" className="text-xl font-semibold">
            Members and invitations
          </h2>
          <p className="text-sm text-muted">Demo only: invitations are simulated and no email is sent.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <UserPlus aria-hidden />
          Invite someone
        </Button>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active members" value={s.active} icon={Users} />
        <StatCard label="Alumni" value={s.alumni} />
        <StatCard label="Juniors" value={s.byRole.junior} />
        <StatCard label="Pending invites" value={s.pendingInvites} />
      </div>
      <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
        {data.invitations.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <span className="min-w-0 font-medium break-all">{i.email}</span>
            <span className="flex items-center gap-2">
              <span className="text-muted">{ROLE_LABELS[i.role]}</span>
              <Badge tone={i.status === "pending" ? "accent" : "success"}>{i.status === "pending" ? "Invited" : "Joined"}</Badge>
            </span>
          </li>
        ))}
      </ul>
      <Dialog open={open} onClose={() => setOpen(false)} title="Invite someone" description="Simulated. Adds a pending invitation to the demo list.">
        <InviteForm
          onDone={() => setOpen(false)}
          onSend={(email, role) => {
            actions.createInvitation(email, role);
            toast(`Invitation recorded for ${email} as ${ROLE_LABELS[role]}. No email was sent.`);
          }}
        />
      </Dialog>
    </section>
  );
}

function InviteForm({ onDone, onSend }: { onDone: () => void; onSend: (email: string, role: UserRole) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("junior");
  const [errors, setErrors] = useState<FieldErrors<"email" | "role">>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validateInvite({ email, role });
    setErrors(found);
    if (hasErrors(found)) return;
    onSend(email, role as UserRole);
    onDone();
  };
  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <FormField label="Email address" required error={errors.email}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
      </FormField>
      <FormField label="Role" required error={errors.role}>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </FormField>
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary">
          Record invitation
        </Button>
      </div>
    </form>
  );
}

export function AttendancePage() {
  const { data, actions } = useDemo();
  const toast = useToast();
  const [sessionId, setSessionId] = useState(() => latestSession(data)?.id ?? "");
  const [confirmAll, setConfirmAll] = useState(false);
  const session = data.attendanceSessions.find((s) => s.id === sessionId);
  const rows = attendanceForSession(data, sessionId);
  const counts = countAttendance(rows.map((r) => r.record));

  const set = (recordId: string, name: string, status: AttendanceStatus) => {
    actions.setAttendance(recordId, status);
    toast(`${name} marked ${status === "present" ? "present" : "absent"}.`);
  };
  const markAll = () => {
    const previous = rows.filter((r) => r.record.status !== "present").map((r) => ({ id: r.record.id, status: r.record.status }));
    rows.forEach((r) => actions.setAttendance(r.record.id, "present"));
    setConfirmAll(false);
    toast("Everyone marked present.", { action: { label: "Undo", onClick: () => actions.restoreAttendance(previous) } });
  };

  return (
    <RoleGate allow={canManageAttendance} area="Attendance" allowed={ADMIN_ROLES}>
      <BackLink href="/admin">Administration</BackLink>
      <PageHeader title="Attendance" description="Mark each person present or absent. Individual records stay in this area." />
      <div className="mb-5 max-w-md">
        <FormField label="Session" required>
          <Select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            {data.attendanceSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({formatShortDate(s.date)})
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      {session && (
        <p className="mb-4 text-sm text-muted">
          <strong className="text-fg">{session.title}</strong> · {formatDate(session.date)} · {session.groupLabel}
        </p>
      )}
      <div className="mb-5 grid grid-cols-3 gap-3" aria-live="polite">
        <StatCard label="Present" value={counts.present} />
        <StatCard label="Absent" value={counts.absent} />
        <StatCard label="Not marked" value={counts.not_marked} />
      </div>
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={() => setConfirmAll(true)} disabled={rows.length === 0 || counts.present === counts.total}>
          <Check aria-hidden />
          Mark all present
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No attendees listed for this session" />
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {rows.map(({ record, member }) => (
            <li key={record.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Avatar name={member.name} id={member.id} size="sm" />
              <span className="min-w-0 flex-1 basis-40">
                <span className="block font-medium">{member.name}</span>
                <span className="block text-xs text-muted">{member.yearLabel}</span>
              </span>
              <AttendanceBadge status={record.status} />
              <Segmented<"present" | "absent">
                label={`Attendance for ${member.name}`}
                size="sm"
                value={record.status === "absent" ? "absent" : record.status === "present" ? "present" : ("" as "present")}
                onChange={(s) => set(record.id, member.name, s)}
                options={[
                  { value: "present", label: "Present", icon: <Check aria-hidden /> },
                  { value: "absent", label: "Absent", icon: <X aria-hidden /> },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={confirmAll}
        title="Mark everyone present?"
        confirmLabel="Mark all present"
        description={`This sets all ${rows.length} people in this session to present. You can undo it right after.`}
        onCancel={() => setConfirmAll(false)}
        onConfirm={markAll}
      />
    </RoleGate>
  );
}

export function ProgressPage() {
  const { data } = useDemo();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const { rows, totals } = progressOverview(data);
  const shown = rows.filter((r) => r.member.name.toLowerCase().includes(query.trim().toLowerCase()));
  const sel = rows.find((r) => r.member.id === selected);

  return (
    <RoleGate allow={canManageProgress} area="Junior progress" allowed={LEADS}>
      <BackLink href="/admin">Administration</BackLink>
      <PageHeader title="Junior progress" description="Completion is calculated from each junior's assigned resources and learning items." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Juniors" value={rows.length} icon={Users} />
        <StatCard label="Items assigned" value={totals.total} />
        <StatCard label="Completed" value={totals.completed} />
        <StatCard label="Overall" value={`${totals.percent}%`} icon={TrendingUp} />
      </div>
      <SearchInput label="Search juniors" placeholder="Search juniors" value={query} onChange={setQuery} className="mb-4 max-w-md" />
      {shown.length === 0 ? (
        <EmptyState icon={Users} title="No juniors match" />
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {shown.map(({ member, progress }) => (
            <li key={member.id}>
              <button type="button" onClick={() => setSelected(member.id)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-surface-2">
                <Avatar name={member.name} id={member.id} size="sm" />
                <span className="min-w-0 flex-1 basis-40 font-medium">{member.name}</span>
                <span className="tabular text-sm text-muted">
                  {progress.completed}/{progress.total} completed
                </span>
                <ProgressBar percent={progress.percent} label={`${member.name} completion`} className="w-40" />
                <ChevronRight aria-hidden className="size-4 text-subtle" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={Boolean(sel)} onClose={() => setSelected(null)} title={sel?.member.name ?? ""} description="Visible to leads and this junior only" variant="sheet">
        {sel && (
          <JuniorDetail
            memberId={sel.member.id}
            onChange={(t, s) => toast(`"${t}" set to ${PROGRESS_LABELS[s].toLowerCase()}.`)}
          />
        )}
      </Dialog>
    </RoleGate>
  );
}

function JuniorDetail({ memberId, onChange }: { memberId: string; onChange: (title: string, s: ResourceProgress) => void }) {
  const { data, actions } = useDemo();
  const entries = learningEntriesForMember(data, memberId);
  const p = progressForMember(data, memberId);
  return (
    <div className="space-y-5">
      <div>
        <ProgressBar percent={p.percent} label="Completion" />
        <p className="tabular mt-1.5 text-sm text-muted">
          {p.completed} completed · {p.in_progress} in progress · {p.not_started} not started
        </p>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted">Nothing assigned yet.</p>
      ) : (
        <ul className="space-y-4">
          {entries.map((e) => (
            <li key={e.id} className="border-b border-line pb-4 last:border-0">
              <p className="font-medium break-words">{e.title}</p>
              <p className="mb-2 text-xs text-subtle">
                {e.kind === "resource" ? "Library resource" : "Learning item"}
                {e.dueDate ? ` · due ${formatShortDate(e.dueDate)}` : ""}
              </p>
              <Segmented<ResourceProgress>
                label={`Status of ${e.title}`}
                size="sm"
                value={e.status}
                onChange={(s) => {
                  if (e.kind === "resource") actions.updateAssignmentStatus(e.id, s);
                  else actions.updateProgressItem(e.id, s);
                  onChange(e.title, s);
                }}
                options={[
                  { value: "not_started", label: "Not started" },
                  { value: "in_progress", label: "In progress" },
                  { value: "completed", label: "Completed" },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
      <p className="flex items-center gap-1.5 text-xs text-subtle">
        <Lock aria-hidden className="size-3.5" />
        No notes or evaluations are stored.
      </p>
    </div>
  );
}

export function AdminPollsPage() {
  return (
    <RoleGate allow={canManagePolls} area="Poll management" allowed={LEADS}>
      <PollsList manage />
    </RoleGate>
  );
}
