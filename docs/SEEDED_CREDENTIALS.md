# AIMS EMS Seeded Login Credentials & Test Personas

This document outlines all pre-seeded accounts in the local database for **AIMS EMS** (AI & ML Society, Delhi Technological University). Use these credentials to sign in and test different role-based views and permissions.

---

## 🔑 Global Default Password

For all seeded accounts in the development environment, the default password is:

```
aims2026
```

> **Note:** The sign-in form also supports typing either the full email (e.g., `riya.malhotra@aims.example`) or just the username prefix (e.g., `riya.malhotra`).

---

## 📋 Quick Reference: Seeded Accounts Matrix

| Name | Role | Email Address | Academic Year | Department | Primary Testing Focus |
|---|---|---|---|---|---|
| **Riya Malhotra** | `admin` | `riya.malhotra@aims.example` | 4th year | Core team | Full governance, invitations, settings, all modules |
| **Kabir Sethi** | `senior` | `kabir.sethi@aims.example` | 3rd year | Machine Learning | ML Lead: workshops, task assignment, progress review |
| **Ananya Iyer** | `senior` | `ananya.iyer@aims.example` | 3rd year | Web & Infra | Tech Lead: infrastructure, resources, tech roadmaps |
| **Devansh Joshi** | `attendance_manager` | `devansh.joshi@aims.example` | 2nd year | Events & Operations | Attendance roll-calls, session records, event logistics |
| **Dev Khanna** | `member` | `dev.khanna@aims.example` | 2nd year | Machine Learning | Active member: resource catalog, voting, personal tasks |
| **Meher Gill** | `member` | `meher.gill@aims.example` | 2nd year | Competitive Programming | Active member: discussions, CP resources, polls |
| **Rohan Das** | `member` | `rohan.das@aims.example` | 2nd year | Web & Infra | Active member: web tasks, comments, directory |
| **Arjun Nair** | `junior` | `arjun.nair@aims.example` | 1st year | Machine Learning | Junior: assigned roadmaps, learning progress, roll-call |
| **Sana Qureshi** | `junior` | `sana.qureshi@aims.example` | 1st year | Web & Infra | Junior: frontend track, resource suggestions |
| **Vihaan Bose** | `junior` | `vihaan.bose@aims.example` | 1st year | Competitive Programming | Junior: algorithm challenges, progress tracking |
| **Tara Menon** | `junior` | `tara.menon@aims.example` | 1st year | Research | Junior: paper reading group, research track |
| **Nikhil Rawat** | `member` (Alumni) | `nikhil.rawat@aims.example` | Alumni 2025 | Machine Learning | Alumni view: community access, code review |
| **Ishita Chawla** | `member` (Alumni) | `ishita.chawla@aims.example` | Alumni 2024 | Research | Alumni view: research advisory, paper archives |

---

## 👥 Role Profiles & Capabilities

### 1. Administrator (`admin`)
- **Primary Persona:** Riya Malhotra (`riya.malhotra@aims.example`)
- **Password:** `aims2026`
- **Capabilities:**
  - Executive council governance: view and modify all records.
  - Member onboarding and role management.
  - Organization settings, audit logs, and society-wide announcements.
  - Approve or decline submitted learning resources.
  - Manage attendance sessions and records across all groups.

### 2. Senior Leads (`senior`)
- **Personas:** 
  - Kabir Sethi (`kabir.sethi@aims.example`) — Machine Learning Lead
  - Ananya Iyer (`ananya.iyer@aims.example`) — Web & Infra Lead
- **Password:** `aims2026`
- **Capabilities:**
  - Create and assign tasks to juniors and active members.
  - Review submitted resources and publish them to the curated library.
  - Mark session attendance for workshops and reading groups.
  - Monitor junior roadmap progression and sign off on completed milestones.

### 3. Attendance Manager (`attendance_manager`)
- **Persona:** Devansh Joshi (`devansh.joshi@aims.example`)
- **Password:** `aims2026`
- **Capabilities:**
  - Create attendance sessions for society events, meetups, and workshops.
  - Take live roll-calls and update attendance states (`present`, `absent`, `excused`, `late`).
  - View aggregate attendance rates and export session summaries.

### 4. Active Members (`member`)
- **Personas:** Dev Khanna, Meher Gill, Rohan Das
- **Password:** `aims2026`
- **Capabilities:**
  - Search and filter the full society member directory and view coding profiles.
  - Access published educational resources and bookmark links.
  - Submit new educational resources for senior lead review.
  - Participate in active society polls and view public results.
  - Manage own profile (bio, skills, coding handles).

### 5. Junior Members (`junior`)
- **Personas:** Arjun Nair, Sana Qureshi, Vihaan Bose, Tara Menon
- **Password:** `aims2026`
- **Capabilities:**
  - Access personal learning roadmaps assigned by senior leads.
  - Track individual completion status (`in_progress`, `completed`).
  - View personal attendance history.
  - Participate in society polls and suggest new resources.

### 6. Alumni (`alumni` status)
- **Personas:** Nikhil Rawat (2025), Ishita Chawla (2024)
- **Password:** `aims2026`
- **Capabilities:**
  - Stay connected with society discussions, research repositories, and mentorship networks.

---

## 🌐 Single Sign-On (SSO) with Google / Gmail

AIMS EMS supports **Google Workspace SSO** (accommodating `@dtu.ac.in` institutional IDs and personal `@gmail.com` accounts).

### Local / Prototype SSO Flow:
1. Click **"Continue with Google"** on the sign-in page.
2. Select your persona or enter your Google email in the interactive Google SSO dialog.
3. If an email prefix matches a seeded member (e.g. `riya.malhotra@gmail.com`), you are automatically authenticated as that member.
4. If no custom email is specified, the system signs in with the default Administrator persona (**Riya Malhotra**).

### Production Integration with Clerk:
- When deployed to production, Google SSO delegates authentication to **Clerk OAuth 2.0 / OpenID Connect**.
- Clerk verifies the Google OAuth token and matches the email against the Neon database `members` table to bind the verified JWT to the member's role and permissions.

---

## 🛠️ Database Seeding & Reset

If the local database needs to be re-seeded or wiped:
```bash
# From the frontend/ directory:
npm run dev
# The local PGlite/Neon database automatically runs seedDatabase() if empty.
```

To inspect seed definitions in code, see:
- [`frontend/src/data/seed.ts`](file:///d:/Main_Files/Projects/aims-erp/frontend/src/data/seed.ts)
- [`frontend/src/db/seed.ts`](file:///d:/Main_Files/Projects/aims-erp/frontend/src/db/seed.ts)
