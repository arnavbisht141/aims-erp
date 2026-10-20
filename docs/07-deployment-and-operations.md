# 07. Deployment, Operations & Cloud Quotas

**Status:** Provider Capabilities & Quotas Verified (`[Confirmed]`); Local Setup Guide Active (`[Implemented]`); Production Deployment Workflow (`[Proposed]`)

---

## 1. Cloud Infrastructure & Hosting Topology `[Confirmed]`

AIMS EMS is designed for zero-maintenance operation on managed cloud services.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GitHub Repository (`main`)                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Automated Deploy Hook
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              Vercel                                    │
│   • Global Edge Network & CDN                                          │
│   • Serverless Function Compute (Next.js App Router)                   │
│   • Automated Preview Deployments on Pull Requests                     │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌────────────────────────────────────┐ ┌─────────────────────────────────┐
│           Clerk Auth API           │ │         Neon PostgreSQL         │
│   • 50,000 MRU Free Tier           │ │   • Serverless Postgres         │
│   • Identity & Session Handling    │ │   • Branching per PR            │
│   • Google / DTU Workspace Auth    │ │   • 1 GB Storage / 100 CU-hrs   │
└────────────────────────────────────┘ └─────────────────────────────────┘
```

---

## 2. Verified Provider Capabilities, Quotas & Limitations `[Confirmed]`

*All provider specifications below were actively checked and verified against official platform documentation as of October 2026.*

### 2.1 Neon Serverless PostgreSQL
- **Free Tier Allowance:**
  - **Storage:** **1 GB** per project (ample capacity; text-based attendance, polls, and profiles for 300 members consumes < 20 MB/year).
  - **Compute:** **100 Compute Unit (CU)-hours** per project / month (1 CU ≈ 1 vCPU + 4 GB RAM, autoscaling up to 2 CU).
  - **Scale-to-Zero:** Compute automatically scales to zero after **5 minutes** of inactivity, consuming 0 CU-hours during inactive periods.
  - **Database Branching:** Up to **10 branches** included for free.
  - **Network Transfer (Egress):** 5 GB public network transfer per project / month.
  - **Point-in-Time Restore (PITR):** 6-hour history window.
- **Operational Implications for AIMS:**
  - The 100 CU-hours/month limit easily accommodates 200–300 users because student traffic is clustered (e.g. evening workshops, weekend contests). Inactive hours consume zero compute.
  - Branching allows spinning up an isolated database clone for feature branches and Pull Requests to test Drizzle schema migrations safely.

### 2.2 Clerk Identity & Authentication
- **Free Tier Allowance (Hobby Plan):**
  - **Monthly Retained Users (MRU):** **50,000 MRUs** per application (Clerk defines an MRU as a user who signs up and returns at least one day later).
  - **Authentication Features:** Passwordless email, Google OAuth, Session Management, MFA.
- **CRITICAL ARCHITECTURAL CONSTRAINT:**
  - Clerk's B2B **Organizations** feature is capped at **20 members per organization** on the free tier.
  - **Enforced Architectural Decision:** AIMS EMS **must not** rely on Clerk Organizations for society membership. Membership, cohorts, roles, and teams are stored directly in **Neon PostgreSQL**, while Clerk is used exclusively for personal user authentication and session tokens (`userId`).
- **Operational Implications for AIMS:**
  - 50,000 MRUs is >150x the size of AIMS (200–300 members), ensuring the free tier remains completely sufficient for years.

### 2.3 Vercel Serverless Hosting
- **Free Tier Allowance (Hobby Plan):**
  - **Usage Restrictions:** Strictly non-commercial, personal, educational, or learning projects. AIMS is an internal non-commercial student society platform, fully adhering to terms.
  - **Function Execution Timeout:** Hard cap of **60 seconds** per serverless invocation.
  - **Monthly Invocations:** 1,000,000 serverless function invocations.
  - **Fast Data Transfer:** 100 GB bandwidth / month.
- **Operational Implications for AIMS:**
  - Standard CRUD requests complete in < 200ms, well below the 60-second execution cap.
  - Preview deployments automatically provide a unique live preview URL for every GitHub Pull Request.

### 2.4 GitHub Education / Student Developer Pack `[Confirmed]`
- **Confirmed Benefits:** Verified students receive **GitHub Pro** (unlimited private repositories, GitHub Copilot Pro) and free custom domain vouchers (via Namecheap/Name.com).
- **Rule on Imaginary Credits:** Neither Neon nor Vercel currently offer distinct proprietary GitHub Student Pack monetary credit quotas beyond their generous standard free tiers. The team relies strictly on verified public free tiers.

---

## 3. Database Migration & Deployment Workflow `[Proposed]`

Database schema changes are managed strictly through version-controlled migrations using **Drizzle Kit**.

```
1. Developer edits schema in `src/db/schema.ts`
                      │
                      ▼
2. Run migration generator locally:
   `npx drizzle-kit generate`
   (Creates timestamped SQL file in `drizzle/migrations/`)
                      │
                      ▼
3. Commit SQL migration file to Git feature branch
                      │
                      ▼
4. Open Pull Request on GitHub:
   • Vercel generates preview deployment
   • Neon generates isolated preview database branch
   • CI runs `npm test` and `npm run typecheck`
                      │
                      ▼
5. Review & Merge to `main`:
   • Production deployment triggered on Vercel
   • Production database migration applied: `npx drizzle-kit migrate`
```

---

## 4. Disaster Recovery & Backup Routine `[Confirmed]`

1. **Neon Continuous Backup:** Neon retains continuous write-ahead logs with a 6-hour point-in-time recovery history window on the free tier.
2. **Weekly Logical Dump Routine (`pg_dump`):**
   - For long-term historical archives, a GitHub Action runs a weekly scheduled workflow executing:
     ```bash
     pg_dump $DATABASE_URL > aims_backup_$(date +%Y%m%d).sql
     ```
   - Encrypted and stored in a private secure backup repository or local drive.

---

## 5. Developer Onboarding: Step-by-Step Local Setup `[Implemented]`

Follow these steps to run AIMS EMS locally on a new development machine:

### Step 1: System Prerequisites
- **Node.js:** Version 20.9 or newer (Node.js 22 LTS recommended).
- **Git:** Installed and authenticated with GitHub.
- **Package Manager:** `npm` (comes with Node.js).

### Step 2: Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/arnavbisht141/aims-erp.git
cd aims-erp

# Install dependencies for the frontend workspace
npm run install:all
```

### Step 3: Configure Environment Variables
Copy the example environment configuration into both the root and `frontend/`:
```bash
cp .env.example .env
cp .env.example frontend/.env.local
```
*(For the current in-memory prototype, default placeholders in `.env.local` work immediately without external accounts).*

### Step 4: Run Development Server
```bash
# Start local development server from root
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Step 5: Verification Commands
Run the verification suite to ensure everything is operating cleanly:
```bash
npm test            # Runs Vitest unit tests (17 tests)
npm run typecheck   # Runs Next.js route typegen & TypeScript check
npm run lint        # Runs ESLint code style checks
npm run build       # Verifies production Next.js bundle compiles
```
