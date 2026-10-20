# 04. UI Design System & UX Principles

**Status:** Design Tokens & Prototype UI Implemented (`[Implemented]`); "Quietly Sharp" Philosophy Confirmed (`[Confirmed]`); shadcn/ui Migration Target (`[Proposed]`)

---

## 1. Design Direction: "Quietly Sharp" `[Confirmed]`

AIMS EMS rejects both generic bootstrap administrative templates and hyper-distracting consumer crypto/SaaS aesthetics. Its visual language is **"Quietly Sharp"**: minimal, contemporary, structured, and professional.

The design synthesizes two complementary aesthetic paradigms:

1. **Calm Editorial:**
   - Restrained layouts with generous, deliberate whitespace.
   - Elegant typographic hierarchy that prioritizes long-form legibility (e.g. reading technical paper abstracts, meeting notes, and roadmap guides).
   - Quiet border contrast that organizes content without heavy visual noise.

2. **Modern Builder Workspace:**
   - High information density where necessary (e.g. attendance roll-calls, member lists).
   - Clear, unambiguous status badges and progress indicators.
   - Fast, keyboard-navigable dialogs and sheets for quick administrative entry.

```
┌────────────────────────────────────────────────────────────────────────┐
│  "QUIETLY SHARP" PHILOSOPHY                                            │
│                                                                        │
│   ❌ AVOID                          ✅ EMBRACE                         │
│   • Gratuitous gradients            • Semantic color tokens            │
│   • Distracting micro-animations    • Purposeful transitions (<250ms)  │
│   • Card-inside-card clutter        • Structured flat surfaces         │
│   • Generic bootstrap buttons       • Subtle borders & tactile states  │
│   • Gimmicky gamification badges    • Clean tabular typography         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Design Tokens & Color Palette `[Implemented]`

The system uses a warm, low-glare dark palette by default—tailored for late-evening student society coding sessions—paired with a clean, high-contrast light mode variant.

### 2.1 CSS Variables & Token Mapping (from `src/app/globals.css`)

```css
/* Dark Theme (Default) */
:root, :root[data-theme="dark"] {
  --bg: #15100c;            /* Warm black background */
  --surface: #1d1611;       /* Primary card surface */
  --surface-2: #261d17;     /* Hover & secondary layer */
  --surface-3: #30251d;     /* Active borders & inputs */
  --line: #352a21;          /* Subtle dividing border */
  --line-strong: #4b3c30;   /* Emphasized structural border */
  --fg: #f5ebdc;            /* Primary warm ivory text */
  --muted: #bcab96;         /* Secondary descriptive text */
  --subtle: #978672;        /* Placeholders & disabled text */
  
  /* Brand Accent: Society Amber */
  --accent: #f2a541;        /* Primary interactive amber */
  --accent-hover: #f7b95f;  /* Interactive hover */
  --accent-ink: #1c1309;    /* High-contrast text on accent */
  --accent-soft: rgb(242 165 65 / 0.13); /* Accent background tint */

  /* Semantic Feedback */
  --success: #8fd0a2;       /* Sage green */
  --success-soft: rgb(143 208 162 / 0.12);
  --danger: #f39580;        /* Coral red */
  --danger-soft: rgb(243 149 128 / 0.12);
  --info: #a7c1f0;          /* Soft slate blue */
  --info-soft: rgb(167 193 240 / 0.12);
}

/* Light Theme */
:root[data-theme="light"] {
  --bg: #faf6f0;            /* Warm linen white */
  --surface: #ffffff;       /* Pure white card surface */
  --surface-2: #f4ede3;     /* Muted neutral container */
  --surface-3: #ebe1d3;     /* Elevated input borders */
  --line: #e7dccc;          /* Soft border line */
  --line-strong: #d2c2ac;   /* Distinct boundary */
  --fg: #23180f;            /* Deep warm espresso text */
  --muted: #65553f;         /* Secondary body text */
  --subtle: #7a6956;        /* Tertiary helper text */
  --accent: #f2a541;        /* Amber accent */
  --accent-hover: #e8962c;  /* Slightly deeper amber */
  --accent-ink: #1c1309;    /* High contrast ink */
}
```

### 2.2 Typography & Radii
- **Primary Typeface:** `Outfit` (`var(--font-outfit)`), modern sans-serif with geometric balance.
- **Heading Styles:** `letter-spacing: -0.02em` with balanced line wraps (`text-wrap: balance`).
- **Tabular Figures:** Used on all numeric displays, attendance percentages, and dates (`font-variant-numeric: tabular-nums`).
- **Border Radii:**
  - Card & Container: `14px` (`var(--radius-card)`)
  - Buttons & Form Inputs: `10px` (`var(--radius-control)`)

---

## 3. Responsive Ergonomics & Layout Strategy `[Implemented]`

The interface must serve two very different physical contexts:
1. **The Laptop Context (Desktop):** A society lead sitting at their desk marking roll-call, managing 30 attendance records, or configuring roadmaps. Requires density, wide tables, and rapid keyboard navigation.
2. **The Mobile Context (Phone):** A junior walking to college checking their assigned tasks, or a member opening a voting link from WhatsApp on the DTU campus.

### 3.1 Layout Adaptations

| Component | Desktop (>= 1024px) | Mobile (< 768px) |
|---|---|---|
| **Navigation** | Sticky Top Navbar (`h-16`) with brand badge, centered horizontal navigation links, theme toggle, and account profile dropdown. | Sticky top bar with brand badge and hamburger trigger opening an accessible mobile navigation sheet drawer with >= 48px touch targets. |
| **Attendance Roll-Call** | Wide table with quick action toggle buttons per row and bulk controls. | Card-based roll-call view with comfortable 48px touch targets. |
| **Modals & Dialogs** | Centered floating modal (`max-width: 560px` or `720px`). | Bottom sheet or full-width drawer with swipe/dismiss touch targets. |
| **Form Inputs** | Two-column grid where logical (e.g. Type + Topic). | Strict single-column vertical stack with native keyboard awareness. |
| **Search & Filters** | Horizontal inline toolbars with instant dropdown selects. | Horizontally scrolling pill bar or expandable filter accordion. |

---

## 4. UI Component Architecture & Evolution

### 4.1 Prototype Custom Primitives (`src/components/ui/`) `[Implemented]`
The prototype includes lightweight, zero-dependency custom components:
- **`Button.tsx`**: Supports `primary`, `secondary`, `danger`, `ghost`, and `icon` variants.
- **`Dialog.tsx`**: Uses native HTML5 `<dialog>` elements for accessible focus trapping, escape-key dismissal, and backdrop scrims.
- **`StatusBadge.tsx`**: Consistent pill badges with soft background tints for `ResourceProgress`, `AttendanceStatus`, and `TaskStatus`.
- **`States.tsx`**: Semantic `EmptyState`, `NotFoundState`, and `AccessRestricted` state containers.
- **`Toast.tsx`**: Non-blocking ephemeral action feedback (`toast-in` animation).

### 4.2 Production Target: shadcn/ui Migration `[Proposed]`
For the production application, the team will standardize on **shadcn/ui** primitives built upon **Radix UI**:
- **Why shadcn/ui:**
  - Radix primitives handle complex WCAG accessibility (WAI-ARIA 1.2), focus management, screen-reader announcements, and keyboard arrow navigation out of the box.
  - Zero lock-in: Components are copied directly into `src/components/ui/`, allowing our custom design tokens (`var(--bg)`, `var(--surface)`, `var(--accent)`) to be wired directly into Tailwind classes.
- **Migration Plan:**
  - Replace prototype `Dialog.tsx` with `@radix-ui/react-dialog`.
  - Replace native selects with `@radix-ui/react-select` for styled, accessible dropdowns.
  - Retain the exact same design tokens, styling rules, and visual aesthetics.

---

## 5. External Product Inspirations & Boundaries `[Confirmed]`

To build an intuitive experience, the team studied existing educational and developer platforms. However, ideas are adopted **only** where they solve real AIMS EMS problems:

- **Tensor Tonic / LeetCode:**
  - *Adopted:* Clean coding profile pills (GitHub, LeetCode handles), minimal problem status badges ("To Do", "In Progress", "Solved").
  - *Rejected:* Heavy gamification, global competitive leaderboards, streak penalties (promotes anxiety rather than collaborative learning).
- **Coursera / edX:**
  - *Adopted:* Simple module roadmap checklist for juniors; clear distinction between "Assigned to me" vs "Community Shared".
  - *Rejected:* Bloated video player interfaces, automated quiz engines, paywalls, and complex multi-week syllabus structures.
- **W3Schools:**
  - *Adopted:* Instant, accessible search filtering by programming language or topic.
  - *Rejected:* Ad-dense sidebars, overly simplistic visual hierarchies.

---

## 6. Accessibility & Motion Guidelines `[Confirmed]`

1. **Color Contrast:** All body text meets WCAG 2.1 AA standard (contrast ratio >= 4.5:1 against surface colors). Muted text meets >= 3:1.
2. **Never Color-Only:** Status badges always pair color with explicit text labels (e.g. green dot + "Present", coral dot + "Absent").
3. **Keyboard Navigation:** Every interactive element has an explicit `:focus-visible` ring (`2px solid var(--accent)` with `2px` offset).
4. **Reduced Motion:** All CSS keyframe animations (dialog zoom, sheet slide, toast pop) are wrapped inside `@media (prefers-reduced-motion: no-preference)`. When users request reduced motion in their OS, UI transitions are instantaneous.
