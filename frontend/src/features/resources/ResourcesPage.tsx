"use client";

import { BookMarked, Hourglass, Plus, SearchX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Display";
import { FilterSelect, SearchInput } from "@/components/ui/Form";
import { cn } from "@/lib/cn";
import { pluralise } from "@/lib/formatters";
import { canReviewResources } from "@/lib/permissions";
import { filterResources, visibleResources, type ResourceFilters } from "@/lib/selectors";
import { useDemo } from "@/state/store";
import type { ResourceType } from "@/types";
import { categoryOptions, RESOURCE_TYPE_OPTIONS, ResourceCard, SuggestResourceDialog } from "./ResourceParts";

const NO_FILTERS: ResourceFilters = { query: "", type: "", category: "", assignedToMe: false };

export function ResourcesPage() {
  const { data, role, currentMember } = useDemo();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ResourceFilters>(() => ({
    ...NO_FILTERS,
    assignedToMe: searchParams.get("assigned") === "me",
  }));
  const [pendingOnly, setPendingOnly] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const visible = visibleResources(data, role, currentMember.id);
  const pending = visible.filter((r) => r.reviewStatus === "pending_review");
  const isReviewer = canReviewResources(role);
  const results = filterResources(
    pendingOnly ? pending : visible,
    filters,
    data.assignments,
    currentMember.id,
  );
  const hasAssignments = data.assignments.some((a) => a.memberId === currentMember.id);
  const filtersActive =
    Boolean(filters.query || filters.type || filters.category) || filters.assignedToMe || pendingOnly;

  const update = (changes: Partial<ResourceFilters>) => setFilters((current) => ({ ...current, ...changes }));

  return (
    <>
      <PageHeader
        title="Resources"
        description="Courses, papers, tools and opportunities shared by AIMS members. Links open the original source."
        actions={
          <Button variant="primary" onClick={() => setSuggestOpen(true)}>
            <Plus aria-hidden />
            Suggest a resource
          </Button>
        }
      />

      {isReviewer && pending.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-info/30 bg-info-soft px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-fg">
            <Hourglass aria-hidden className="size-4 text-info" />
            {pluralise(pending.length, "suggestion")} waiting for review.
          </p>
          <Button size="sm" onClick={() => setPendingOnly((v) => !v)} aria-pressed={pendingOnly}>
            {pendingOnly ? "Show all resources" : "Review suggestions"}
          </Button>
        </div>
      )}

      <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_220px_auto]">
        <SearchInput
          label="Search resources"
          placeholder="Search titles, descriptions and topics"
          value={filters.query}
          onChange={(query) => update({ query })}
          className="sm:col-span-2 lg:col-span-1"
        />
        <FilterSelect
          label="Filter by type"
          allLabel="All types"
          value={filters.type}
          onChange={(type) => update({ type: type as ResourceType | "" })}
          options={RESOURCE_TYPE_OPTIONS}
        />
        <FilterSelect
          label="Filter by topic"
          allLabel="All topics"
          value={filters.category}
          onChange={(category) => update({ category })}
          options={categoryOptions(data.resources)}
        />
        <button
          type="button"
          aria-pressed={filters.assignedToMe}
          onClick={() => update({ assignedToMe: !filters.assignedToMe })}
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border px-3 text-sm font-medium whitespace-nowrap transition-colors sm:col-span-2 lg:col-span-1",
            filters.assignedToMe
              ? "border-accent/60 bg-accent-soft text-accent-text"
              : "border-line-strong text-muted hover:bg-surface-2 hover:text-fg",
          )}
        >
          <BookMarked aria-hidden className="size-4" />
          Assigned to me
        </button>
      </div>

      <div className="mb-4 flex min-h-8 items-center justify-between gap-3 text-sm text-muted" aria-live="polite">
        <span>
          {pluralise(results.length, "resource")}
          {filtersActive ? " match your filters" : ""}
        </span>
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters(NO_FILTERS);
              setPendingOnly(false);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={filters.assignedToMe && !hasAssignments ? "Nothing assigned to you yet" : "No resources match"}
          action={
            <Button
              onClick={() => {
                setFilters(NO_FILTERS);
                setPendingOnly(false);
              }}
            >
              Clear filters
            </Button>
          }
        >
          {filters.assignedToMe && !hasAssignments
            ? "When a lead assigns you something to work through, it will show up here."
            : "Try a broader search or a different type or topic. Know a good one? Suggest it."}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((resource) => (
            <li key={resource.id} className="flex">
              <div className="flex w-full flex-col [&>article]:flex-1">
                <ResourceCard resource={resource} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <SuggestResourceDialog open={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </>
  );
}
