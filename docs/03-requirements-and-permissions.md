# 03. Product Requirements & Access Control

**Status:** Roles Implemented in Prototype (`[Implemented]`); Production Server-Side RBAC Architecture (`[Confirmed]`); Discrete Granular Roles (`[Proposed]`)

---

## 1. Access Control Philosophy

AIMS EMS is a private, trusted society tool. However, internal trust does not remove the need for strict data boundaries. 
The access-control architecture is guided by four non-negotiable principles:

1. **Explicit Server-Side Authorization:** Every mutation and data fetch must execute an authorization check on the server. The UI only toggles visual elements for user convenience; the server provides the true security boundary.
2. **Strict Privacy by Default:** Sensitive personal metrics—specifically attendance consistency and junior learning assessments—are private between the individual and designated society leadership. They are never visible to peers.
3. **Least Privilege for Leads:** A member assigned to lead a workshop or record attendance does not automatically need global administrative access or database write access across the platform.
4. **Separation of Academic Cohort from System Privilege:** A student in their 4th year is an academic senior, but not necessarily a system administrator. Roles are explicitly granted, never inferred from seniority.

---

## 2. Role Taxonomy

### 2.1 Confirmed Roles (Prototype Baseline) `[Implemented]`

The system currently models four baseline roles in `src/types/index.ts`:

- **`member`**: Active general society member. Can discover resources, search member profiles, participate in polls, view assigned tasks, and edit their own personal profile.
- **`junior`**: Newly recruited member participating in onboarding or society learning roadmaps. Possesses all `member` capabilities, plus dedicated views for assigned learning milestones and personal progress tracking.
- **`senior` (Authorized Lead)**: Senior member or department lead responsible for running initiatives. Can access the Administration section, create tasks, assign learning resources, mark session attendance, and review junior progress.
- **`admin`**: Executive council member (e.g. President, Vice President, Tech Lead). Has global operational oversight, can manage society membership, configure roles, and audit all workflows.

### 2.2 Proposed Specialized Roles `[Proposed]`

To prevent over-granting full `senior` privileges to members who only need specific operational access, the production schema proposes two additional role scopes:

- **`attendance_manager` `[Proposed]`**: A designated lead or coordinator authorized to create sessions and record attendance roll-calls, without granting access to junior evaluation records or system settings.
- **`team_lead` `[Proposed]`**: Department-specific lead (e.g., ML Lead, Dev Lead, Design Lead) whose resource assignment and task creation privileges are scoped to their respective sub-team.

---

## 3. Comprehensive Permissions Matrix

The following matrix defines the authoritative access rights across all platform capabilities:

| Feature / Operation | Junior | Member | Senior / Lead | Attendance Manager `[Proposed]` | Administrator |
|---|:---:|:---:|:---:|:---:|:---:|
| **People & Profiles** | | | | | |
| View member directory & profiles | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own profile (bio, skills, links) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit other members' profiles | ❌ | ❌ | ❌ | ❌ | ✅ |
| View external coding profile links | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Resources & Knowledge** | | | | | |
| Browse & search published resources | ✅ | ✅ | ✅ | ✅ | ✅ |
| Suggest new resource | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review / approve pending resources | ❌ | ❌ | ✅ | ❌ | ✅ |
| Assign resources to juniors | ❌ | ❌ | ✅ | ❌ | ✅ |
| Update personal progress on assigned resource | ✅ | ✅ | ✅ | ✅ | ✅ |
| View another person's resource progress | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Attendance Management** | | | | | |
| View own attendance history | ✅ | ✅ | ✅ | ✅ | ✅ |
| View another person's individual attendance | ❌ | ❌ | ✅ | ✅ | ✅ |
| View aggregate session attendance counts | ❌ | ❌ | ✅ | ✅ | ✅ |
| Create attendance session | ❌ | ❌ | ✅ | ✅ | ✅ |
| Mark attendance roll call (present/absent) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Bulk mark attendance ("Mark all present") | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Junior Progress Tracking** | | | | | |
| View own learning milestone progress | ✅ | ✅ | ✅ | ✅ | ✅ |
| View other juniors' individual progress | ❌ | ❌ | ✅ | ❌ | ✅ |
| Update junior learning item status | ❌ | ❌ | ✅ | ❌ | ✅ |
| Create new junior progress milestone | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Polls & Decisions** | | | | | |
| Vote in open polls | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change cast vote (if poll permits) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create new society poll | ❌ | ❌ | ✅ | ❌ | ✅ |
| Close poll & publish decision record | ❌ | ❌ | ✅ | ❌ | ✅ |
| View results before close (subject to visibility) | ⚠️ (Rules) | ⚠️ (Rules) | ✅ (Always) | ⚠️ (Rules) | ✅ (Always) |
| **Tasks & Collaboration** | | | | | |
| View tasks assigned to self | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all society tasks | ❌ | ❌ | ✅ | ❌ | ✅ |
| Create and assign tasks | ❌ | ❌ | ✅ | ❌ | ✅ |
| Update status of task assigned to self | ✅ | ✅ | ✅ | ✅ | ✅ |
| Post comments on tasks / resources | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete own comments | ✅ | ✅ | ✅ | ✅ | ✅ |
| Moderate / delete any comment | ❌ | ❌ | ❌ | ❌ | ✅ |
| **System Administration** | | | | | |
| Access `/admin` overview dashboard | ❌ | ❌ | ✅ | ✅ (Limited) | ✅ |
| Invite new members | ❌ | ❌ | ❌ | ❌ | ✅ |
| Change member system role | ❌ | ❌ | ❌ | ❌ | ✅ |
| View audit activity logs `[Proposed]` | ❌ | ❌ | ❌ | ❌ | ✅ |

*Table Legend:*  
- ✅ = Permitted  
- ❌ = Forbidden (Server halts with `403 Forbidden`)  
- ⚠️ (Rules) = Governed by dynamic configuration (e.g., poll results visibility setting)

---

## 4. Privacy Boundaries & Data Segregation `[Confirmed]`

### 4.1 Attendance Privacy
- Attendance records evaluate reliability and commitment. Making them public creates peer embarrassment or resentment.
- **Rule:** The People Directory (`/people`) and Member Profiles (`/people/[id]`) must **NEVER** query or render attendance percentages or records.
- Attendance history is only accessible on the user's private profile (`/profile`) or within the restricted administrative roll-call route (`/admin/attendance`).

### 4.2 Junior Progress Privacy
- Learning roadmaps contain subjective learning paces. Juniors must not feel exposed to comparison with peers.
- **Rule:** Junior progress summaries and individual progress items are queryable **only** by the junior themselves and authorized leads (`senior`, `admin`).
- The general member directory must only show self-reported skills, technical interests, and coding handles.

### 4.3 Poll Visibility Rules `[Implemented]`
Polls feature three privacy levels defined at creation:
1. `always`: Live vote tallies and distribution are visible to all members at all times.
2. `after_vote`: Members must submit their vote before seeing current distributions.
3. `after_close`: Tally is completely hidden until a lead formally closes the poll and publishes the decision record.
*Note:* Poll managers and administrators can always view live counts to monitor participation quorum.

---

## 5. Registration & Onboarding Lifecycle `[Confirmed]`

Public self-registration is strictly disabled. Because AIMS EMS is a private society workspace, membership is invite-only or approved-only.

### 5.1 Onboarding Workflow `[Proposed]`

```
  [ Administrator ]
          │
          ▼
  Issues Invitation (Email + Role)
          │
          ▼
  Clerk Invitation Email sent to Student
          │
          ▼
  Student signs up via Clerk (Email Verification / Google DTU Workspace)
          │
          ▼
  Webhook or Post-Auth Hook fires in Next.js
          │
          ▼
  Next.js links Clerk User ID (`sub`) to pending `invitations` record in Neon DB
          │
          ▼
  Creates initial `members` profile record with invited role
          │
          ▼
  User lands on `/profile` to complete technical bio & skills
```

### 5.2 Handling Uninvited Signups
If an uninvited student accesses the Clerk login portal, the authentication flow succeeds at Clerk's layer, but the application's Next.js authorization check detects that no active `members` record exists in the database.
- The user is placed into a "Pending Society Approval" state.
- They are redirected to an onboarding waiting screen: `/pending-approval`.
- They cannot access any internal routes until an administrator explicitly confirms their society membership.
