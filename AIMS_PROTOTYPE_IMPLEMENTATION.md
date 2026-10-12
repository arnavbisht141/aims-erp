# AIMS Internal Platform --- Claude Code Prototype Implementation Specification

**Document:** `AIMS_PROTOTYPE_IMPLEMENTATION.md`\
**Version:** 0.1\
**Date:** 12 October 2026\
**Purpose:** Implementation-ready specification for building the first
interactive AIMS internal-platform prototype with Claude Code.

------------------------------------------------------------------------

## 1. Instructions for Claude Code

Implement the interactive prototype described in this document in the
current repository.

### Before writing code

1.  Inspect the repository, existing source files, package manager,
    scripts, and installed dependencies.
2.  If a working application already exists, preserve its framework,
    conventions, and working features. Extend the existing project
    rather than replacing it unnecessarily.
3.  If the repository is empty or only contains a starter scaffold, use:
    -   Next.js with the App Router
    -   TypeScript
    -   Tailwind CSS
    -   Lucide icons for React
    -   A lightweight charting library only if a chart is genuinely
        useful
4.  Use the existing package manager and lockfile. Do not switch package
    managers without a clear reason.
5.  Do not add a backend, database, external authentication provider,
    email service, or third-party integration for this prototype.
6.  Implement a complete, navigable prototype with believable sample
    data and working local interactions. Do not stop after producing
    static mockups.
7.  Keep the implementation understandable and maintainable. Avoid
    unnecessary abstractions, oversized components, and speculative
    infrastructure.

### Implementation workflow

Work incrementally:

1.  Inspect the repository and summarise its current state.
2.  Establish the application shell, navigation, design tokens, and
    responsive layout.
3.  Add typed sample data and role-aware navigation.
4.  Implement Resources and People.
5.  Implement Administration: Attendance, Junior Progress, and Polls.
6.  Implement Tasks and Comments.
7.  Add interaction feedback, responsive behaviour, empty states, and
    error states.
8.  Run the project's lint, type-check, test, and build commands where
    available.
9.  Fix errors caused by the implementation.
10. Update the README with setup and demo instructions.

Do not ask for clarification on decisions already specified here. If the
existing repository imposes a constraint, preserve it and document the
adaptation.

------------------------------------------------------------------------

## 2. Product overview

AIMS is the AI & ML Society of Delhi Technological University. The
platform is a private internal workspace intended to make selected
society operations easier to access than the current collection of
spreadsheets, documents, forms, and scattered links.

The project also serves as a practical software-engineering learning
project for Arnav and Vaatsalya.

### Product goals

-   Centralise useful learning resources and opportunities.
-   Make member skills, interests, and coding profiles discoverable.
-   Demonstrate accessible administrative workflows for attendance,
    junior progress, and polls.
-   Support lightweight tasks, comments, and decisions.
-   Provide a coherent, responsive interface for laptop and mobile use.
-   Demonstrate different user experiences based on role and privacy
    boundaries.

### Initial target

-   Approximately 200--300 eventual users.
-   Active members, juniors/recruits, seniors/department leads, and
    alumni.
-   Laptop-first responsive web application.
-   Prototype uses fictional sample data only.
-   No production backend or real authentication is required at this
    stage.

### Product principles

1.  One central entry point does not require replacing every external
    tool.
2.  Resources may point to external URLs.
3.  Prefer a few complete user journeys over a large set of shallow
    features.
4.  Individual attendance and progress data must not appear in ordinary
    member-facing screens.
5.  Role switching is a prototype demonstration mechanism, not real
    authentication or security.
6.  Avoid adding AI features, scraping, messaging, or integrations that
    are not required by this specification.

------------------------------------------------------------------------

## 3. Confirmed decisions

Treat these as requirements, not suggestions:

-   The first deliverable is an interactive prototype with realistic
    sample data.
-   Account access is conceptually invite-only.
-   The initial roles are members, juniors, seniors/authorised leads,
    and administrators.
-   Permissions are role-based, with specific administrative
    capabilities granted only where appropriate.
-   MVP priorities are resources, administration, and member profiles.
-   The prototype must include basic demonstrations of attendance,
    junior progress, and polls/decisions.
-   Member profiles and skills are visible to members.
-   Individual attendance and progress records are restricted to the
    relevant individual and authorised personnel.
-   Comments, tasks, and decisions are supporting collaboration
    features.
-   The application is a responsive web app, optimised for laptop use
    but usable on mobile.
-   Selected Google-based workflows may eventually be replaced; the
    prototype does not need to integrate with Google.
-   Use fictional sample people and records only.

------------------------------------------------------------------------

## 4. Explicit non-goals

Do **not** implement the following in this prototype:

-   Real login, password handling, OAuth, or email invitations.
-   A backend API or database.
-   Production-grade authorisation enforcement.
-   Google Sheets, Drive, Docs, or Forms integration.
-   Email, push, or SMS notifications.
-   Real-time chat or direct messaging.
-   External scraping of papers, blogs, videos, or competitions.
-   GitHub, LeetCode, Codeforces, or other coding-platform APIs.
-   AI recommendations, embeddings, or intelligent matching.
-   Full project management or complex workflow automation.
-   Advanced analytics or gamification.
-   Real member data or sensitive production records.

The prototype may simulate an invitation screen and may offer a clearly
labelled demo role switcher. It must not claim that simulated
permissions provide real security.

------------------------------------------------------------------------

## 5. Primary user roles

Implement these roles in a typed role model:

``` ts
type UserRole = "member" | "junior" | "senior" | "admin";
```

Alumni should be represented as a membership status or profile attribute
initially, rather than automatically being granted a new privileged
role. Alumni may use the member experience in the prototype; their
eventual restrictions remain configurable and are deferred for
validation.

### Role definitions

#### Member

Can: - View the dashboard. - Browse, search, and filter resources. -
View member profiles and skills. - Edit their own profile. - Submit a
resource suggestion. - View and participate in polls. - View tasks
assigned to them. - Comment where the interface permits it. - View their
own assigned learning and personal progress.

Cannot by default: - View other members' individual attendance or
progress. - Mark attendance for others. - Change another person's
profile. - Manage roles or invitations.

#### Junior

Can: - Use the member capabilities. - See assigned learning materials. -
Update the status of their own assigned resources. - See their own
progress information.

Cannot by default: - View another junior's individual progress or
attendance. - Record attendance for others. - Change roles or administer
membership.

#### Senior / authorised lead

Can: - Use the member capabilities. - Access the Administration area in
the prototype. - View and update sample attendance records. - View and
update junior progress records. - Create and manage sample polls. -
Create and assign tasks. - Comment on relevant items.

Important: the prototype's senior role demonstrates an authorised lead.
Do not assume that every senior in the real society should automatically
have every permission. A later version can model permissions at
department or workflow level.

#### Administrator

Can: - Use member-facing features. - View the administration area. -
View the member-management demonstration screen or section. - Simulate
issuing an invitation and assigning a role. - View and manage sample
resources, polls, tasks, and records.

Do not build a full account-management system. A small invite-management
demonstration is sufficient if it fits naturally into the prototype.

### Prototype role switching

Provide a demo-only role switcher in a discreet location, preferably in
the profile menu or a clearly labelled "Demo role" control.

Requirements: - Options: Member, Junior, Senior, Administrator. -
Switching roles changes the dashboard context and role-specific
navigation. - It must be clearly identified as a prototype/demo
feature. - It must not be described as secure authentication. - Preserve
the selected role while navigating within the current session. - Provide
an obvious way to return to the default demo role.

Default demo role: **Junior**, because assigned resources and progress
make the product's learning value easy to demonstrate.

------------------------------------------------------------------------

## 6. Information architecture and navigation

### Main navigation

Desktop navigation should use a left sidebar with:

1.  Home
2.  Resources
3.  People
4.  Tasks
5.  Administration --- visible only to Senior and Administrator demo
    roles
6.  Profile

The profile menu should contain: - View/edit profile - Demo role
switcher - Demo reset action, if implemented

On narrow screens: - Convert the sidebar into a drawer, compact menu, or
suitable responsive navigation. - Avoid horizontal overflow. - Keep the
most common actions accessible. - Ensure dialogs and forms fit within
the viewport.

### Suggested routes

If using Next.js App Router, implement routes similar to:

``` text
/
 /resources
 /resources/[id]
 /people
 /people/[id]
 /tasks
 /admin
 /admin/attendance
 /admin/progress
 /admin/polls
 /profile
```

These are a suggested route structure. Adapt to existing repository
conventions where appropriate. A single-page application with
client-side view switching is acceptable if the existing project is
structured that way, but deep-linkable pages are preferable.

### Route and navigation behaviour

-   Clicking a navigation item opens the corresponding screen.
-   Active navigation state is visible.
-   Unknown resource/person IDs show a useful not-found state.
-   Restricted pages show a clear access-restricted screen when visited
    under a role that should not access them.
-   Do not rely only on hiding a navigation link: check the current demo
    role at the page/component level too.
-   This role check is for prototype behaviour only, not a substitute
    for server-side authorisation.

------------------------------------------------------------------------

## 7. Visual and interaction design

### Overall visual direction

Build a modern, restrained, credible internal SaaS workspace. It should
feel designed for a student technical society rather than a generic
corporate HR system.

Design characteristics: - Clean, light interface. - Neutral backgrounds
with one restrained accent colour. - Strong typographic hierarchy. -
Generous spacing without excessive empty space. - Clear card boundaries
and subtle borders. - Rounded corners used consistently. - Small,
meaningful icons. - Data tables that remain readable. - Clear hover,
focus, selected, disabled, success, and error states. - Avoid excessive
gradients, glassmorphism, oversized decorative headings, and unnecessary
animation.

If the repository already contains a design system or branding, use it
rather than inventing a conflicting one.

### Layout

Desktop: - Persistent left sidebar, approximately 230--260 px wide. -
Main content area with a readable maximum width. - Page title and short
explanatory subtitle at the top. - Primary action near the page heading
when appropriate. - Cards and tables aligned to a consistent grid.

Mobile: - Sidebar collapses. - Cards stack vertically. - Tables become
horizontally scrollable or convert into readable record cards. - Forms
use a single-column layout. - Modal/dialog content must remain usable on
a small screen. - Buttons should have comfortable touch targets.

### Typography and spacing

-   Use the existing font setup if available; otherwise use a clean
    system sans-serif or a well-supported web font already installed.
-   Establish consistent tokens for spacing, radii, borders, and muted
    text.
-   Body text should be comfortable to read.
-   Avoid using colour as the only way to communicate status.

### Components to reuse

Create reusable components where they materially improve consistency:

-   `AppShell`
-   `Sidebar` / `MobileNavigation`
-   `PageHeader`
-   `StatCard`
-   `SearchInput`
-   `FilterSelect`
-   `StatusBadge`
-   `EmptyState`
-   `ConfirmDialog`
-   `Modal` or `Dialog`
-   `FormField`
-   `DataTable` or responsive record list
-   `Avatar` / initials fallback
-   `ResourceCard`
-   `MemberCard`
-   `TaskCard`
-   `PollCard`
-   `DemoRoleSwitcher`
-   `Toast` or inline action feedback

Do not create an abstraction for every small element. Prefer native
semantic elements and a small, consistent component library.

### Icons

Use the icon library already present in the repository. If starting
fresh, use Lucide icons for React. Use icons consistently and pair
unfamiliar icons with labels.

### Accessibility

-   Use semantic headings and landmarks.
-   All interactive elements must be keyboard accessible.
-   Provide visible focus states.
-   Label form inputs.
-   Use buttons for actions and links for navigation.
-   Dialogs should have clear titles and close actions.
-   Ensure adequate contrast.
-   Provide textual labels for statuses and icons where needed.
-   Respect reduced-motion preferences if animation is used.
-   Do not create hover-only interactions.

------------------------------------------------------------------------

## 8. Screen specifications

### 8.1 Home dashboard

**Purpose:** Give a member a useful overview of what needs attention.

#### Shared content

-   Greeting with the current demo user's name.
-   Short description such as "Your AIMS workspace".
-   Resource summary.
-   Assigned tasks summary.
-   Recent resource additions or recommendations from peers.
-   Upcoming or active poll, if one exists.
-   A small activity or announcements area using sample data.

#### Junior dashboard

Prioritise: - Assigned resources. - Progress overview. - Tasks assigned
to the junior. - Current polls or decisions. - Recently shared
resources.

#### Member dashboard

Prioritise: - Recommended/recent resources. - Tasks assigned to the
member. - Polls. - Quick link to the member directory.

#### Senior dashboard

Prioritise: - Attendance summary. - Junior progress summary. - Tasks
they manage. - Polls they manage. - Quick actions for attendance,
progress, and creating a poll.

Only show individual progress/attendance details to authorised roles.
Aggregate counts are acceptable if they do not expose sensitive
individual data.

#### Admin dashboard

Prioritise: - Membership summary. - Resource activity. - Administrative
shortcuts. - Poll and task summaries.

#### Acceptance criteria

-   Dashboard content changes according to the demo role.
-   Summary cards use the same sample records as the relevant detail
    pages.
-   Clicking a card or quick action navigates to a useful destination.
-   Empty states appear when a list has no items.
-   No dashboard card exposes another member's restricted individual
    records.

------------------------------------------------------------------------

### 8.2 Resources library

**Purpose:** Make learning resources and opportunities easy to discover
and share.

#### Resource categories and types

Use a simple flexible category field. Seed examples such as: - Machine
Learning - Deep Learning - Python - Web Development - Competitive
Programming - Career Opportunities - Events and Competitions

Types may include: - Blog - Research paper - Video - Course -
Documentation - Competition - Opportunity - Other

Do not assume this category list is final; it is sample content for the
prototype.

#### Resource list page

Include: - Page title and short description. - Search input. - Type
filter. - Topic/category filter. - Optional "Assigned to me" filter. -
Resource cards or a compact table/list. - "Suggest a resource" action. -
Empty state when no resources match the filters.

Each resource card should show: - Title. - Short description. - Resource
type. - Topic/category. - Contributor or submitter. - Date added or a
relative timestamp. - Assignment indicator where relevant. - Status
indicator for the current user's assignment, where relevant.

#### Resource detail

Show: - Title and description. - Type and topic. - External destination
link. - Contributor. - Date added. - Assigned audience, if relevant. -
Comments section or a simplified discussion panel. - Assignment status
for the current user. - Actions appropriate to the role.

Opening an external URL should use a safe new-tab link where
appropriate, with `rel="noreferrer"` when using `target="_blank"`.

#### Suggest a resource interaction

Use a modal or dedicated form with: - Title --- required. - URL ---
required and validated as a URL. - Type --- required. - Topic/category
--- required. - Description --- optional. - Optional note about why it
is useful.

On submit: - Validate required fields. - Add the new item to in-memory
state. - Show confirmation. - Update the resource list immediately. - Do
not call a backend.

For the prototype, newly submitted resources may appear as "Pending
review" if the UI demonstrates moderation. If this adds unnecessary
complexity, add them directly with a visible "Demo submission" label.

#### Assignment interactions

An authorised role can: - Open an assignment dialog. - Select a sample
member or group. - Confirm assignment. - See the assignment reflected in
the relevant dashboard and resource view.

A junior/member can: - Open an assigned resource. - Set status to "Not
started", "In progress", or "Completed". - See the status update
immediately.

#### Resource status model

``` ts
type ResourceProgress = "not_started" | "in_progress" | "completed";
```

A resource itself may have a separate moderation status:

``` ts
type ResourceReviewStatus = "published" | "pending_review";
```

Do not conflate content publication status with an individual's learning
progress.

#### Acceptance criteria

-   Search matches title, description, and topic/category.
-   Filters work together.
-   A resource detail view is reachable from the list.
-   Form validation prevents submission with missing required fields or
    an invalid URL.
-   Resource submissions update the UI.
-   Assignment and completion updates are reflected consistently.
-   A user cannot see another person's personal assignment status unless
    their role is authorised to do so.

------------------------------------------------------------------------

### 8.3 People directory

**Purpose:** Help members find collaborators and understand one
another's technical interests.

#### Directory fields

Each member may have: - Display name. - Avatar or initials. - Year or
membership cohort. - Department/team, if relevant. - Skills. - Technical
interests. - Preferred collaboration domains. - Coding profile links,
such as GitHub, LeetCode, or Codeforces. - Short bio.

Use fictional identities and example URLs only. Do not use real AIMS
member data.

#### Directory page

Include: - Search by name, skill, or domain. - Filters for year/cohort
and technical domain. - Member cards with name, cohort, and a few skill
tags. - Clear empty state when no results match. - Optional
reset-filters action.

#### Profile detail

Show: - Profile information. - Skills and interests. - Coding profile
links. - Optional tasks or shared resources only if the data is not
sensitive. - Edit action for the current demo user.

Never display: - Individual attendance records. - Individual junior
progress. - Private administrative notes.

#### Edit profile interaction

Provide fields for: - Display name. - Short bio. - Skills. - Technical
interests. - Coding profile URLs.

Requirements: - Validate required fields. - Validate URLs when
provided. - Save changes to in-memory state. - Show a success message. -
Reflect updates in both the profile page and directory. - Users can edit
their own profile only in the normal prototype flow.

#### Acceptance criteria

-   Search and filters operate on sample data.
-   Clicking a member opens the corresponding profile.
-   Profile edits appear in the directory and profile detail.
-   No profile exposes attendance or individual progress information.

------------------------------------------------------------------------

### 8.4 Administration overview

**Purpose:** Present authorised users with a clear starting point for
the three initial administrative workflows.

Only Senior and Administrator demo roles should see the Administration
navigation item.

The overview should contain three clear sections/cards:

1.  Attendance
2.  Junior progress
3.  Polls and decisions

Each card should include: - A concise description. - A relevant sample
summary. - A primary action. - A link to the corresponding workflow.

Do not build a complex analytics dashboard. The aim is to demonstrate
clear access to the workflows.

------------------------------------------------------------------------

### 8.5 Attendance management

**Purpose:** Demonstrate a more accessible interface for recording and
reviewing attendance.

#### Attendance page

Include: - Session selector. - Session title and date. - Group/cohort
label. - Summary counts: present, absent, and not marked. - List/table
of fictional members. - Attendance status per member. - Save/update
action if needed. - Clear confirmation after changes.

Suggested status model:

``` ts
type AttendanceStatus = "present" | "absent" | "not_marked";
```

#### Interactions

-   Select a sample session.
-   View the corresponding attendance records.
-   Mark an individual as present or absent.
-   Optionally use a bulk action such as "Mark all present", with an
    undo or confirmation affordance.
-   Update summary counts immediately.
-   Switch sessions without losing the in-memory updates made to other
    sessions.

#### Privacy

-   Only Senior/Admin demo roles can open the administrative attendance
    interface.
-   A member's normal dashboard may show their own attendance summary if
    the prototype includes it.
-   Never show another member's individual attendance in the general
    member directory or dashboard.
-   Do not display individual records in a public summary.

#### Acceptance criteria

-   Changing a status updates the row and summary counts.
-   The selected session determines which records are displayed.
-   A role without administrative access receives an access-restricted
    state if they navigate directly to the route.
-   All data is fictional and local to the prototype.

------------------------------------------------------------------------

### 8.6 Junior progress

**Purpose:** Demonstrate a simple view of learning and task progress
without designing the final AIMS evaluation process.

#### Progress page

Include: - Search/filter for sample juniors. - A progress overview. - A
table or responsive list with fictional junior names. - Number of
assigned resources or tasks. - Completed count. - A simple status or
completion percentage. - A detail view or drawer for one junior's
assigned items. - An edit/update interaction for authorised users.

Use simple progress values derived from sample assigned items when
practical. Avoid contradictory hard-coded percentages.

#### Example model

``` ts
type ProgressItemStatus = "not_started" | "in_progress" | "completed";

interface ProgressItem {
  id: string;
  memberId: string;
  title: string;
  status: ProgressItemStatus;
  dueDate?: string;
}
```

Progress should be calculated from the relevant items rather than stored
separately if the value can be derived reliably.

#### Interactions

-   Select a junior.
-   View assigned learning/task items.
-   Update an item's status as an authorised senior.
-   Recalculate the junior's summary.
-   Demonstrate a member/junior view where the individual sees only
    their own progress.

#### Privacy

-   The senior/admin role may see the individual records included in the
    demo.
-   A junior/member can view their own progress only.
-   Other members cannot inspect a junior's individual progress through
    profile pages, directory search, or general dashboards.
-   Avoid adding sensitive notes or subjective evaluations.

#### Acceptance criteria

-   Progress summaries update when item statuses change.
-   Summary calculations match the underlying items.
-   Individual records are absent from ordinary member-facing pages.
-   Direct navigation to the administrative page under a restricted role
    shows an access-restricted state.

------------------------------------------------------------------------

### 8.7 Polls and decisions

**Purpose:** Demonstrate how AIMS might collect input without issuing a
separate Google Form for every small decision.

#### Poll list

Show: - Poll question. - Short description/context. - Status: Open or
Closed. - Closing date if applicable. - Vote count if configured as
visible. - Whether the current demo user has voted.

#### Create poll form

For Senior/Admin demo roles: - Question --- required. - Description ---
optional. - At least two options --- required. - Open/closed state. -
Optional closing date. - Results visibility --- use a simple setting if
it can be implemented cleanly.

#### Vote interaction

-   A member selects one option.
-   The prototype records the vote in in-memory state.
-   The UI confirms the vote.
-   The member cannot vote multiple times in the normal flow unless the
    poll is explicitly configured to allow changing a vote.
-   Results update consistently.
-   Closed polls cannot accept new votes.

For this prototype, use single-choice voting. Do not build anonymous
voting, ranked-choice voting, complex quorum logic, or formal election
rules.

#### Decision record

When a poll is closed, show: - Final status. - Result counts or
percentages. - A brief outcome summary if provided by the creator.

Do not imply that every poll is legally or organisationally binding.

#### Acceptance criteria

-   An authorised user can create a poll.
-   Members can vote in an open poll.
-   Duplicate votes are prevented in the normal interaction.
-   Closed polls reject further votes.
-   Results reflect the recorded sample votes.
-   Poll visibility follows the selected simplified setting.

------------------------------------------------------------------------

### 8.8 Tasks and comments

**Purpose:** Provide lightweight coordination in the same workspace.

#### Task fields

-   Title.
-   Description.
-   Assignee.
-   Creator.
-   Status: To do, In progress, Done.
-   Optional due date.
-   Optional related resource or poll.
-   Created date.

#### Task list

Include: - Tabs or filters for assigned to me, created by me, and all
tasks where the role permits. - Status filter. - Task cards or rows. -
Detail panel with description and comments. - Role-appropriate
create/edit actions.

#### Task interactions

-   Authorised user creates a task.
-   Select a fictional member as assignee.
-   Task appears in the assignee's dashboard.
-   Assignee can update status.
-   Creator or authorised role can edit or close the task.
-   Show a confirmation after changes.

#### Comments

Comments may be attached to resources, tasks, or polls where
appropriate.

Each comment contains: - ID. - Parent item type and ID. - Author ID. -
Text. - Created timestamp.

Prototype comment requirements: - Submit a non-empty comment. - Display
author and time. - Add the comment immediately to in-memory state. -
Validate whitespace-only submissions. - No real-time updates or
moderation engine is required.

#### Acceptance criteria

-   Creating a task updates the relevant list and assignee dashboard.
-   Status changes appear consistently.
-   Comments are displayed on the relevant item.
-   Empty comments cannot be submitted.
-   Tasks and comments do not expose restricted attendance/progress
    records.

------------------------------------------------------------------------

### 8.9 Profile and demo controls

The profile menu should include: - View profile. - Edit profile. -
Current demo role. - Switch demo role. - Reset demo data, if
implemented.

If a reset control is provided: - Ask for confirmation. - Restore the
original sample dataset and default demo role. - Explain that this only
resets prototype state. - Do not imply that real account data is being
deleted.

------------------------------------------------------------------------

## 9. Data model and sample data

Use TypeScript interfaces and centralised seed data. Avoid scattering
hard-coded records across individual page components.

A suggested structure:

``` text
src/
  app/ or existing route directory
  components/
  features/
    dashboard/
    resources/
    people/
    attendance/
    progress/
    polls/
    tasks/
  data/
    seed.ts
  lib/
    permissions.ts
    selectors.ts
    validation.ts
    formatters.ts
  types/
    index.ts
```

Adapt the directory layout to the existing project. Do not duplicate
route, component, or type definitions unnecessarily.

### Suggested types

``` ts
export type UserRole = "member" | "junior" | "senior" | "admin";

export type MembershipStatus = "active" | "alumni" | "inactive";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  membershipStatus: MembershipStatus;
  yearLabel?: string;
  department?: string;
  bio: string;
  skills: string[];
  interests: string[];
  codingProfiles: {
    label: string;
    url: string;
  }[];
  avatarUrl?: string;
}

export type ResourceType =
  | "blog"
  | "paper"
  | "video"
  | "course"
  | "documentation"
  | "competition"
  | "opportunity"
  | "other";

export type ResourceProgress =
  | "not_started"
  | "in_progress"
  | "completed";

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: ResourceType;
  category: string;
  submittedBy: string;
  createdAt: string;
  reviewStatus: "published" | "pending_review";
  assignedMemberIds: string[];
}

export interface ResourceAssignment {
  id: string;
  resourceId: string;
  memberId: string;
  status: ResourceProgress;
  assignedBy: string;
  assignedAt: string;
}

export type AttendanceStatus = "present" | "absent" | "not_marked";

export interface AttendanceSession {
  id: string;
  title: string;
  date: string;
  groupLabel: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  memberId: string;
  status: AttendanceStatus;
}

export interface ProgressItem {
  id: string;
  memberId: string;
  title: string;
  status: ResourceProgress;
  dueDate?: string;
}

export type PollStatus = "open" | "closed";

export interface PollOption {
  id: string;
  label: string;
}

export interface PollVote {
  pollId: string;
  memberId: string;
  optionId: string;
}

export interface Poll {
  id: string;
  question: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  closesAt?: string;
  status: PollStatus;
  options: PollOption[];
  resultsVisibility: "after_vote" | "always" | "after_close";
}

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  createdBy: string;
  status: TaskStatus;
  dueDate?: string;
  relatedResourceId?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  parentType: "resource" | "task" | "poll";
  parentId: string;
  authorId: string;
  text: string;
  createdAt: string;
}
```

Claude Code may adjust this model if the resulting implementation is
simpler and remains consistent with the product requirements. Avoid
introducing a general-purpose database abstraction for in-memory state.

### Seed data requirements

Create believable fictional sample data with: - At least 8--12 members
across the roles and cohorts. - A mix of current members and alumni. -
At least 10 resources across several categories and resource types. - At
least 6 resource assignments with different progress states. - At least
2 attendance sessions. - Attendance records for several members per
session. - At least 5 progress items across multiple juniors. - At least
3 polls, including open and closed polls. - At least 6 tasks with
different statuses and assignees. - A few comments on resources and
tasks.

Ensure the IDs and references are consistent. Every resource submitter,
assignment member, attendance member, task assignee, poll creator, vote,
and comment author must reference an existing record.

Use fictional names and reserved/example URLs or well-known public
educational links that do not imply any affiliation or endorsement.
Avoid using real private information.

### Derived data

Use selectors/helpers for: - Current member's assigned resources. -
Current member's tasks. - Resource counts by progress state. -
Attendance counts for the selected session. - Junior progress
completion. - Poll vote totals and percentages. - Search/filter results.

Do not hard-code a displayed count that contradicts the sample records.

------------------------------------------------------------------------

## 10. State management and prototype persistence

No backend is required.

### Recommended approach

-   Keep the seed dataset in a central module.
-   Initialise an application-level state store from the seed data.
-   Use the simplest state approach compatible with the existing
    project: React state/context or an existing state library.
-   Keep related state updates in shared actions/reducers so multiple
    screens remain consistent.
-   Use generated IDs that are stable for the session.
-   Use in-memory state for all demo mutations.

### Persistence

Do not require persistence across browser reloads. The prototype can
reset to its initial seed data on reload.

If a local persistence mechanism already exists in the starter project,
do not add it automatically. If localStorage is introduced for
convenience, it must: - Be treated as demo-only. - Include a clear reset
option. - Handle malformed or outdated saved data gracefully. - Never
store real member data or credentials. - Be documented as prototype
behaviour.

### Suggested state operations

Create central actions for: - `setCurrentDemoRole` -
`updateMemberProfile` - `submitResource` - `assignResource` -
`updateResourceProgress` - `updateAttendanceRecord` -
`updateProgressItem` - `createPoll` - `castVote` - `closePoll` -
`createTask` - `updateTaskStatus` - `addComment` - `resetDemoState`

These names are suggestions; use consistent naming that fits the
implementation.

------------------------------------------------------------------------

## 11. Permission helpers

Centralise role checks rather than repeating ad hoc conditions across
screens.

Possible helper functions:

``` ts
canAccessAdministration(role)
canManageAttendance(role)
canManageProgress(role)
canManagePolls(role)
canAssignResources(role)
canCreateTasks(role)
canEditMemberProfile(currentMemberId, targetMemberId)
canViewIndividualProgress(role, currentMemberId, targetMemberId)
canViewIndividualAttendance(role, currentMemberId, targetMemberId)
```

Use these helpers to: - Show/hide role-specific navigation. - Decide
whether action buttons are available. - Render access-restricted
states. - Keep permission behaviour consistent.

Prototype policy: - `senior` and `admin` may access the demo
administration workflows. - Members and juniors can view their own
progress. - Members and juniors cannot view other people's individual
progress or attendance. - Only the current member can edit their own
profile through the normal UI. - Admin-only controls should not appear
for ordinary members. - Additional workflow-specific restrictions can be
represented with simple helpers.

**Security warning:** client-side permission helpers are only for
prototype demonstration. A production version must enforce access on the
server/API and data layer. Do not describe this prototype as secure
authentication or authorisation.

------------------------------------------------------------------------

## 12. Forms, validation, and feedback

All interactive forms must have clear validation and feedback.

### Validation rules

-   Required text fields must not accept whitespace-only values.
-   URLs must be valid when required.
-   Optional URLs must be valid if entered.
-   Polls require a question and at least two non-empty options.
-   Task title is required.
-   Comments cannot be empty.
-   Attendance changes must use one of the defined status values.
-   Profile edits must not mutate another user's profile through the
    ordinary UI.

### Feedback patterns

Use: - Inline field errors for validation. - Toasts or inline success
messages for completed actions. - Confirmation dialogs for destructive
or bulk actions. - Disabled states while a local action is being
processed, if relevant. - Empty states for lists with no results. -
Access-restricted states for unauthorised routes. - Not-found states for
missing resources or members.

Do not use browser `alert()` as the primary interaction pattern unless
the existing project has no viable UI alternative.

------------------------------------------------------------------------

## 13. Responsive behaviour

Test at least these viewport widths: - 1440 px desktop. - 1024 px
laptop/tablet landscape. - 768 px tablet. - 390 px mobile.

Requirements: - No accidental horizontal overflow at the page level. -
Sidebar collapses or becomes a mobile menu. - Main content cards stack
naturally. - Tables remain usable via horizontal scrolling or responsive
record cards. - Dialogs fit on screen and can be dismissed. - Search and
filter controls wrap or stack cleanly. - Primary actions remain
reachable. - Long titles and URLs do not break the layout. - Empty,
loading, and error states fit mobile layouts too.

------------------------------------------------------------------------

## 14. Quality and testing requirements

### Functional checks

Verify manually or with automated tests that:

1.  The app starts using the documented command.
2.  Main navigation works.
3.  Switching demo roles changes the visible navigation and dashboard.
4.  Restricted roles cannot access administrative screens through normal
    route navigation.
5.  Resource search and filters work together.
6.  Resource submissions appear in the library.
7.  Assignment status changes update relevant screens.
8.  Profile edits update the profile and directory.
9.  Attendance changes update summary counts.
10. Progress updates change derived summaries.
11. Poll creation, voting, closure, and results work.
12. Duplicate voting is prevented in the normal flow.
13. Task creation and status updates work.
14. Comments cannot be submitted empty.
15. The reset function, if present, restores seed data.
16. The app is usable at desktop and mobile widths.
17. No console errors occur during the core journeys.

### Automated tests

If a test framework is already installed, extend it. Otherwise, add a
small test setup only if doing so is straightforward and consistent with
the repository.

Prioritise tests for: - Permission helpers. - Progress/count
selectors. - Poll vote counting and duplicate-vote prevention. - Form
validation. - Critical state mutations.

Do not spend more time building a large testing framework than
implementing the prototype.

### Build checks

Run the available commands from `package.json`, such as: - lint -
typecheck, if present - test, if present - build

Fix errors introduced by the implementation. If an existing command
fails due to an unrelated pre-existing issue, report it accurately
instead of hiding it.

------------------------------------------------------------------------

## 15. Suggested implementation milestones

### Milestone 1 --- Application shell

Deliver: - Routing/navigation. - Responsive sidebar/mobile navigation. -
Basic design tokens. - Page headers and shared components. - Demo role
switcher. - Seed data and types.

### Milestone 2 --- Resources and People

Deliver: - Resource library, filters, detail, submit, assign, and
progress interactions. - Member directory, filters, profile detail, and
profile edit. - Shared in-memory state updates.

### Milestone 3 --- Administration

Deliver: - Administration overview. - Attendance session and record
editing. - Junior progress overview and item updates. - Poll creation,
voting, closing, and results. - Role-aware access-restricted states.

### Milestone 4 --- Collaboration

Deliver: - Task list, task creation, assignment, and status changes. -
Comments on relevant records. - Dashboard summaries linked to the same
state.

### Milestone 5 --- Polish and validation

Deliver: - Responsive review. - Validation and success/error feedback. -
Empty states. - Accessibility review. - Functional tests. -
Build/lint/type-check verification. - README with demo instructions.

------------------------------------------------------------------------

## 16. Definition of done

The prototype is complete when all of the following are true:

-   [ ] The application runs locally using the documented instructions.
-   [ ] The interface is responsive and usable on laptop and
    mobile-sized screens.
-   [ ] Navigation covers Home, Resources, People, Tasks, Profile, and
    role-restricted Administration.
-   [ ] Sample roles demonstrate distinct experiences.
-   [ ] Resources can be searched, filtered, opened, submitted, and
    assigned.
-   [ ] Resource progress can be updated and is reflected consistently.
-   [ ] Members can be searched by skills/domains.
-   [ ] The current demo member can edit their profile.
-   [ ] Attendance records can be updated in the authorised view.
-   [ ] Junior progress can be reviewed and updated in the authorised
    view.
-   [ ] Polls can be created, voted on, closed, and reviewed.
-   [ ] Tasks can be created, assigned, and updated.
-   [ ] Comments can be added to supported items.
-   [ ] Individual attendance and progress are not exposed in ordinary
    member views.
-   [ ] All data is fictional.
-   [ ] All major actions provide visible feedback.
-   [ ] The prototype does not falsely claim real authentication,
    backend persistence, or production-grade security.
-   [ ] Available lint, type-check, tests, and production build commands
    have been run.
-   [ ] README instructions and known limitations are documented.

------------------------------------------------------------------------

## 17. README requirements

Update or create the README with: - Project purpose. - Requirements and
tools. - Installation instructions. - Local development command. - Build
and test commands. - How to switch demo roles. - How to reset sample
data. - Main screens and prototype journeys. - Important limitations: no
backend, no real authentication, sample data only, and client-side role
simulation. - Any known incomplete features.

Do not include real API keys, credentials, personal data, or secrets.

------------------------------------------------------------------------

## 18. Final instructions to Claude Code

Prioritise a coherent and polished prototype over premature
infrastructure.

-   Inspect before modifying.
-   Reuse the existing stack when one is present.
-   Keep the implementation type-safe and modular.
-   Use central seed data and shared state so changes remain consistent
    across screens.
-   Implement meaningful interactions for the specified journeys.
-   Keep privacy boundaries visible in the UI.
-   Do not add unrelated features.
-   Do not create a backend or claim production security.
-   Run the available checks and fix implementation errors.
-   At the end, provide a concise report listing:
    1.  What was implemented.
    2.  Important files and routes.
    3.  Commands to run the app.
    4.  Checks performed and their results.
    5.  Any known limitations or unfinished requirements.

**Expected outcome:** a realistic, navigable, role-aware AIMS prototype
that can be shown to society members for requirements validation before
the team commits to a production architecture.
