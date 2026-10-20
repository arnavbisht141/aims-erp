import { seedData } from "@/data/seed";
import * as schema from "./schema";

export async function seedDatabase(db: any) {
  // Check if members already exist
  const existingMembers = await db.select().from(schema.members);
  const existingMemberIds = new Set(existingMembers.map((m: any) => m.id));

  // 1. Members & Coding Profiles
  for (const m of seedData.members) {
    if (!existingMemberIds.has(m.id)) {
      await db.insert(schema.members).values({
        id: m.id,
        email: m.email,
        passwordHash: "aims2026",
        name: m.name,
        role: m.role as any,
        membershipStatus: m.membershipStatus as any,
        academicYear: m.yearLabel,
        department: m.department || "General",
        bio: m.bio,
        skills: m.skills,
        interests: m.interests,
        avatarUrl: m.avatarUrl || null,
      });
      existingMemberIds.add(m.id);
    }

    if (m.codingProfiles && m.codingProfiles.length > 0) {
      for (const cp of m.codingProfiles) {
        const profileId = `${m.id}-${cp.label.toLowerCase()}`;
        try {
          await db.insert(schema.codingProfiles).values({
            id: profileId,
            memberId: m.id,
            platform: cp.label,
            url: cp.url,
          });
        } catch (_) {}
      }
    }
  }

  // 2. Resources
  const existingResources = await db.select().from(schema.resources);
  if (existingResources.length === 0) {
    for (const r of seedData.resources) {
      await db.insert(schema.resources).values({
        id: r.id,
        title: r.title,
        description: r.description,
        url: r.url,
        type: r.type as any,
        category: r.category,
        submittedBy: r.submittedBy,
        reviewStatus: r.reviewStatus as any,
        note: r.note || null,
      });
    }
  }

  // 3. Resource Assignments
  const existingAssignments = await db.select().from(schema.resourceAssignments);
  if (existingAssignments.length === 0) {
    for (const a of seedData.assignments) {
      await db.insert(schema.resourceAssignments).values({
        id: a.id,
        resourceId: a.resourceId,
        memberId: a.memberId,
        status: a.status as any,
        assignedBy: a.assignedBy,
      });
    }
  }

  // 4. Attendance Sessions & Records
  const existingSessions = await db.select().from(schema.attendanceSessions);
  if (existingSessions.length === 0) {
    for (const s of seedData.attendanceSessions) {
      await db.insert(schema.attendanceSessions).values({
        id: s.id,
        title: s.title,
        sessionDate: s.date,
        groupLabel: s.groupLabel,
        createdBy: "m02",
      });
    }
  }

  const existingRecords = await db.select().from(schema.attendanceRecords);
  if (existingRecords.length === 0) {
    for (const rec of seedData.attendanceRecords) {
      await db.insert(schema.attendanceRecords).values({
        id: rec.id,
        sessionId: rec.sessionId,
        memberId: rec.memberId,
        status: rec.status as any,
        markedBy: "m02",
      });
    }
  }

  // 5. Progress Items
  const existingProgress = await db.select().from(schema.progressItems);
  if (existingProgress.length === 0) {
    for (const p of seedData.progressItems) {
      await db.insert(schema.progressItems).values({
        id: p.id,
        memberId: p.memberId,
        title: p.title,
        status: p.status as any,
        dueDate: p.dueDate || null,
        assignedBy: "m02",
      });
    }
  }

  // 6. Polls, Options & Votes
  const existingPolls = await db.select().from(schema.polls);
  if (existingPolls.length === 0) {
    for (const poll of seedData.polls) {
      await db.insert(schema.polls).values({
        id: poll.id,
        question: poll.question,
        description: poll.description || null,
        createdBy: poll.createdBy,
        status: poll.status as any,
        closesAt: poll.closesAt || null,
        resultsVisibility: poll.resultsVisibility as any,
        outcome: poll.outcome || null,
      });

      for (let i = 0; i < poll.options.length; i++) {
        const opt = poll.options[i];
        await db.insert(schema.pollOptions).values({
          id: opt.id,
          pollId: poll.id,
          label: opt.label,
          displayOrder: i,
        });
      }
    }
  }

  const existingVotes = await db.select().from(schema.pollVotes);
  if (existingVotes.length === 0) {
    for (let i = 0; i < seedData.votes.length; i++) {
      const v = seedData.votes[i];
      await db.insert(schema.pollVotes).values({
        id: `vote-${i + 1}-${v.pollId}-${v.memberId}`,
        pollId: v.pollId,
        optionId: v.optionId,
        memberId: v.memberId,
      });
    }
  }

  // 7. Tasks
  const existingTasks = await db.select().from(schema.tasks);
  if (existingTasks.length === 0) {
    for (const t of seedData.tasks) {
      await db.insert(schema.tasks).values({
        id: t.id,
        title: t.title,
        description: t.description,
        assigneeId: t.assigneeId,
        createdBy: t.createdBy,
        status: t.status as any,
        dueDate: t.dueDate || null,
        relatedResourceId: t.relatedResourceId || null,
        relatedPollId: t.relatedPollId || null,
      });
    }
  }

  // 8. Comments
  const existingComments = await db.select().from(schema.comments);
  if (existingComments.length === 0) {
    for (const c of seedData.comments) {
      await db.insert(schema.comments).values({
        id: c.id,
        parentType: c.parentType as any,
        parentId: c.parentId,
        authorId: c.authorId,
        text: c.text,
      });
    }
  }

  // 9. Announcements
  const existingAnnouncements = await db.select().from(schema.announcements);
  if (existingAnnouncements.length === 0 && seedData.announcements) {
    for (const ann of seedData.announcements) {
      await db.insert(schema.announcements).values({
        id: ann.id,
        title: ann.title,
        body: ann.body,
        authorId: ann.authorId,
      });
    }
  }

  // 10. Invitations
  const existingInvitations = await db.select().from(schema.invitations);
  if (existingInvitations.length === 0 && seedData.invitations) {
    for (const inv of seedData.invitations) {
      await db.insert(schema.invitations).values({
        id: inv.id,
        email: inv.email,
        role: inv.role as any,
        token: `tok-${inv.id}`,
        invitedBy: inv.invitedBy,
        status: inv.status,
      });
    }
  }
}
