"use client";

import { ExternalLink, Link2, PencilLine, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Avatar } from "@/components/ui/Display";
import { FormField, Input, Textarea } from "@/components/ui/Form";
import { Badge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { formatDate, MEMBERSHIP_LABELS, ROLE_LABELS } from "@/lib/formatters";
import { canEditMemberProfile } from "@/lib/permissions";
import { parseList, profileHasErrors, validateProfile, type ProfileErrors, type ProfileInput } from "@/lib/validation";
import { useDemo } from "@/state/store";
import type { Member } from "@/types";

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-md bg-surface-3 px-2 py-0.5 text-[13px] text-fg">{children}</span>;
}

export function MemberCard({ member }: { member: Member }) {
  return (
    <article className="group relative flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-colors hover:border-line-strong hover:bg-surface-2">
      <div className="flex items-center gap-3">
        <Avatar name={member.name} id={member.id} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">
            <Link
              href={`/people/${member.id}`}
              className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none group-has-[:focus-visible]:underline"
            >
              {member.name}
            </Link>
          </h3>
          <p className="truncate text-sm text-muted">
            {member.yearLabel}
            {member.department ? ` · ${member.department}` : ""}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted">{member.bio}</p>
      <ul className="mt-auto flex flex-wrap gap-1.5 pt-4" aria-label="Skills">
        {member.skills.slice(0, 4).map((skill) => (
          <li key={skill}>
            <Tag>{skill}</Tag>
          </li>
        ))}
        {member.skills.length > 4 && <li className="self-center text-xs text-subtle">+{member.skills.length - 4} more</li>}
      </ul>
      {member.membershipStatus !== "active" && (
        <span className="absolute top-4 right-4">
          <Badge>{MEMBERSHIP_LABELS[member.membershipStatus]}</Badge>
        </span>
      )}
    </article>
  );
}

/**
 * Public profile. Deliberately has no attendance or progress data:
 * those are shown only on the person's own Profile page and to leads.
 */
export function ProfileView({ member, onEdit }: { member: Member; onEdit?: () => void }) {
  const { data, currentMember } = useDemo();
  const isOwn = canEditMemberProfile(currentMember.id, member.id);
  const shared = data.resources
    .filter((r) => r.submittedBy === member.id && r.reviewStatus === "published")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar name={member.name} id={member.id} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[28px] leading-tight font-semibold break-words sm:text-[34px]">{member.name}</h1>
              <p className="mt-1 text-[15px] text-muted">
                {member.yearLabel}
                {member.department ? ` · ${member.department}` : ""}
              </p>
            </div>
            {isOwn && onEdit && (
              <Button onClick={onEdit}>
                <PencilLine aria-hidden />
                Edit profile
              </Button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="accent">{ROLE_LABELS[member.role]}</Badge>
            <Badge>{MEMBERSHIP_LABELS[member.membershipStatus]}</Badge>
            {isOwn && <Badge tone="info">This is you</Badge>}
          </div>
          <p className="mt-4 max-w-[65ch] text-[16px] leading-relaxed">{member.bio}</p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <h2 className="text-base font-semibold">Skills</h2>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {member.skills.map((skill) => (
              <li key={skill}>
                <Tag>{skill}</Tag>
              </li>
            ))}
          </ul>
          <h2 className="mt-5 text-base font-semibold">Interests</h2>
          {member.interests.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No interests listed yet.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {member.interests.map((interest) => (
                <li key={interest}>
                  <Tag>{interest}</Tag>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <h2 className="text-base font-semibold">Coding profiles</h2>
          {member.codingProfiles.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No profiles linked yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {member.codingProfiles.map((profile) => (
                <li key={profile.url + profile.label}>
                  <a
                    href={profile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 items-center gap-3 rounded-md py-2 text-sm hover:text-accent-text"
                  >
                    <Link2 aria-hidden className="size-4 shrink-0 text-subtle" />
                    <span className="font-medium">{profile.label}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">{profile.url.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink aria-hidden className="size-4 shrink-0 text-subtle" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-subtle">Sample links on example domains.</p>
        </section>
      </div>

      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <h2 className="text-base font-semibold">Resources shared</h2>
        {shared.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            {isOwn ? "You haven't shared any resources yet." : "Nothing shared yet."}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {shared.map((resource) => (
              <li key={resource.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
                <Link href={`/resources/${resource.id}`} className="min-w-0 font-medium hover:underline">
                  {resource.title}
                </Link>
                <span className="text-sm text-subtle">
                  {resource.category} · {formatDate(resource.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const MAX_PROFILES = 4;

function toInput(member: Member): ProfileInput {
  return {
    name: member.name,
    bio: member.bio,
    skills: member.skills.join(", "),
    interests: member.interests.join(", "),
    profiles: member.codingProfiles.length > 0 ? member.codingProfiles.map((p) => ({ ...p })) : [{ label: "", url: "" }],
  };
}

export function EditProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Edit profile" description="Changes appear in the People directory straight away.">
      <EditProfileForm onDone={onClose} />
    </Dialog>
  );
}

function EditProfileForm({ onDone }: { onDone: () => void }) {
  const { currentMember, actions } = useDemo();
  const toast = useToast();
  const [values, setValues] = useState<ProfileInput>(() => toInput(currentMember));
  const [errors, setErrors] = useState<ProfileErrors>({});

  const setField = (key: "name" | "bio" | "skills" | "interests", value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key in errors) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setProfile = (index: number, key: "label" | "url", value: string) => {
    setValues((current) => ({
      ...current,
      profiles: current.profiles.map((p, i) => (i === index ? { ...p, [key]: value } : p)),
    }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateProfile(values);
    setErrors(found);
    if (profileHasErrors(found)) return;
    actions.updateProfile(currentMember.id, {
      name: values.name.trim(),
      bio: values.bio.trim(),
      skills: parseList(values.skills),
      interests: parseList(values.interests),
      codingProfiles: values.profiles
        .filter((p) => p.label.trim() && p.url.trim())
        .map((p) => ({ label: p.label.trim(), url: p.url.trim() })),
    });
    toast("Profile saved.");
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <FormField label="Display name" required error={errors.name}>
        <Input value={values.name} onChange={(e) => setField("name", e.target.value)} autoComplete="name" />
      </FormField>
      <FormField label="Short bio" required error={errors.bio}>
        <Textarea value={values.bio} onChange={(e) => setField("bio", e.target.value)} />
      </FormField>
      <FormField label="Skills" required error={errors.skills} hint="Separate with commas, e.g. Python, PyTorch, SQL">
        <Input value={values.skills} onChange={(e) => setField("skills", e.target.value)} />
      </FormField>
      <FormField label="Technical interests" hint="Separate with commas">
        <Input value={values.interests} onChange={(e) => setField("interests", e.target.value)} />
      </FormField>

      <fieldset>
        <legend className="text-sm font-medium">
          Coding profiles <span className="font-normal text-subtle">(optional)</span>
        </legend>
        <ul className="mt-2 grid gap-3">
          {values.profiles.map((profile, index) => {
            const error = errors.profiles?.[index];
            return (
              <li key={index}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[140px_minmax(0,1fr)_auto]">
                  <label className="sr-only" htmlFor={`profile-label-${index}`}>
                    Profile {index + 1} label
                  </label>
                  <Input
                    id={`profile-label-${index}`}
                    value={profile.label}
                    placeholder="GitHub"
                    onChange={(e) => setProfile(index, "label", e.target.value)}
                    aria-invalid={Boolean(error)}
                    className="col-span-1"
                  />
                  <label className="sr-only" htmlFor={`profile-url-${index}`}>
                    Profile {index + 1} link
                  </label>
                  <Input
                    id={`profile-url-${index}`}
                    type="url"
                    inputMode="url"
                    value={profile.url}
                    placeholder="https://"
                    onChange={(e) => setProfile(index, "url", e.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `profile-error-${index}` : undefined}
                    className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto"
                  />
                  <Button
                    variant="ghost"
                    className="col-start-2 row-start-1 px-3 sm:col-start-auto sm:row-start-auto"
                    aria-label={`Remove profile ${index + 1}`}
                    onClick={() =>
                      setValues((current) => ({ ...current, profiles: current.profiles.filter((_, i) => i !== index) }))
                    }
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
                {error && (
                  <p id={`profile-error-${index}`} className="mt-1.5 text-sm text-danger">
                    {error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        {values.profiles.length < MAX_PROFILES && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => setValues((current) => ({ ...current, profiles: [...current.profiles, { label: "", url: "" }] }))}
          >
            <Plus aria-hidden />
            Add a profile link
          </Button>
        )}
      </fieldset>

      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary">
          Save profile
        </Button>
      </div>
    </form>
  );
}
