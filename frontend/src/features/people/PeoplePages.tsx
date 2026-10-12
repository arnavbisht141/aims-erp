"use client";

import { CalendarCheck, Lock, UserX } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BackLink, EmptyState, PageHeader, Panel, ProgressBar } from "@/components/ui/Display";
import { FilterSelect, SearchInput } from "@/components/ui/Form";
import { NotFoundState, PageLoading } from "@/components/ui/States";
import { ProgressBadge, RestrictedBadge } from "@/components/ui/StatusBadge";
import { formatShortDate, pluralise } from "@/lib/formatters";
import {
  attendanceSummaryForMember,
  distinctValues,
  filterMembers,
  getMember,
  learningEntriesForMember,
  progressForMember,
  type MemberFilters,
} from "@/lib/selectors";
import { useDemo } from "@/state/store";
import { EditProfileDialog, MemberCard, ProfileView } from "./PeopleParts";

const NO_FILTERS: MemberFilters = { query: "", year: "", department: "" };

export function PeoplePage() {
  const { data } = useDemo();
  const [filters, setFilters] = useState<MemberFilters>(NO_FILTERS);
  const results = filterMembers(data.members, filters).sort((a, b) => a.name.localeCompare(b.name));
  const years = distinctValues(data.members.map((m) => m.yearLabel));
  const departments = distinctValues(data.members.map((m) => m.department));
  const active = Boolean(filters.query || filters.year || filters.department);

  return (
    <>
      <PageHeader
        title="People"
        description="Find collaborators by skill, interest or team. Profiles show what people work on, never attendance or progress records."
      />
      <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_240px]">
        <SearchInput
          label="Search people"
          placeholder="Search by name, skill or domain"
          value={filters.query}
          onChange={(query) => setFilters((f) => ({ ...f, query }))}
          className="sm:col-span-2 lg:col-span-1"
        />
        <FilterSelect
          label="Filter by year or cohort"
          allLabel="All years"
          value={filters.year}
          onChange={(year) => setFilters((f) => ({ ...f, year }))}
          options={years.map((value) => ({ value, label: value }))}
        />
        <FilterSelect
          label="Filter by team or domain"
          allLabel="All teams and domains"
          value={filters.department}
          onChange={(department) => setFilters((f) => ({ ...f, department }))}
          options={departments.map((value) => ({ value, label: value }))}
        />
      </div>
      <div className="mb-4 flex min-h-8 items-center justify-between text-sm text-muted" aria-live="polite">
        <span>
          {pluralise(results.length, "person", "people")}
          {active ? " match" : ""}
        </span>
        {active && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(NO_FILTERS)}>
            Reset filters
          </Button>
        )}
      </div>
      {results.length === 0 ? (
        <EmptyState icon={UserX} title="No one matches" action={<Button onClick={() => setFilters(NO_FILTERS)}>Reset filters</Button>}>
          Try a different skill, or widen the year and team filters.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((member) => (
            <li key={member.id}>
              <MemberCard member={member} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const { data, currentMember, ready } = useDemo();
  const [editOpen, setEditOpen] = useState(false);
  const member = getMember(data, id);
  if (!ready) return <PageLoading />;
  if (!member) return <NotFoundState thing="Person" backHref="/people" backLabel="Back to People" />;
  const isOwn = member.id === currentMember.id;

  return (
    <>
      <BackLink href="/people">People</BackLink>
      <ProfileView member={member} onEdit={isOwn ? () => setEditOpen(true) : undefined} />
      {isOwn && (
        <p className="mt-6 text-sm text-muted">
          Your learning progress and attendance are on <Link href="/profile" className="font-medium text-accent-text hover:underline">your Profile page</Link>, visible only to you and leads.
        </p>
      )}
      {isOwn && <EditProfileDialog open={editOpen} onClose={() => setEditOpen(false)} />}
    </>
  );
}

/** The signed-in demo user's own page: public profile plus their private records. */
export function MyProfilePage() {
  const { data, currentMember, ready } = useDemo();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const wantsEdit = searchParams.get("edit") === "1";

  useEffect(() => {
    if (!wantsEdit || !ready) return;
    // Opened from the profile menu's "Edit profile" link.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditOpen(true);
    router.replace("/profile", { scroll: false });
  }, [wantsEdit, ready, router]);

  if (!ready) return <PageLoading />;

  const entries = learningEntriesForMember(data, currentMember.id);
  const progress = progressForMember(data, currentMember.id);
  const attendance = attendanceSummaryForMember(data, currentMember.id);

  return (
    <>
      <ProfileView member={currentMember} onEdit={() => setEditOpen(true)} />

      <h2 className="mt-10 mb-1 text-xl font-semibold">Your records</h2>
      <p className="mb-4 text-sm text-muted">These do not appear on your public profile or in the directory.</p>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Learning progress" id="my-progress" action={<RestrictedBadge />}>
          {entries.length === 0 ? (
            <p className="text-sm text-muted">Nothing assigned to you right now.</p>
          ) : (
            <>
              <ProgressBar percent={progress.percent} label="Your completion" />
              <p className="tabular mt-1.5 text-sm text-muted">
                {progress.completed} of {progress.total} items completed
              </p>
              <ul className="mt-4 divide-y divide-line">
                {entries.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5">
                    <span className="min-w-0 text-sm">
                      {entry.resourceId ? (
                        <Link href={`/resources/${entry.resourceId}`} className="font-medium hover:underline">
                          {entry.title}
                        </Link>
                      ) : (
                        <span className="font-medium">{entry.title}</span>
                      )}
                      <span className="block text-xs text-subtle">
                        {entry.kind === "resource" ? "Library resource" : "Learning item"}
                        {entry.dueDate ? ` · due ${formatShortDate(entry.dueDate)}` : ""}
                      </span>
                    </span>
                    <ProgressBadge status={entry.status} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
        <Panel title="Attendance" id="my-attendance" action={<RestrictedBadge />}>
          {attendance.sessions === 0 ? (
            <p className="text-sm text-muted">No sessions recorded for you yet.</p>
          ) : (
            <div className="flex items-start gap-3">
              <CalendarCheck aria-hidden className="mt-1 size-5 text-subtle" />
              <div>
                <p className="tabular text-2xl font-semibold">
                  {attendance.attended} <span className="text-base font-normal text-muted">of {attendance.marked} marked sessions</span>
                </p>
                {attendance.sessions > attendance.marked && (
                  <p className="mt-1 text-sm text-muted">
                    {pluralise(attendance.sessions - attendance.marked, "session")} not marked yet.
                  </p>
                )}
              </div>
            </div>
          )}
          <p className="mt-4 flex items-center gap-1.5 text-xs text-subtle">
            <Lock aria-hidden className="size-3.5" />
            Leads record attendance; only you and they see your record.
          </p>
        </Panel>
      </div>

      <EditProfileDialog open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
