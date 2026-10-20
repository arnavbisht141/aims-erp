"use client";

import { ArrowLeft, ArrowRight, Lock, Mail, ShieldCheck, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { CURTAIN_CANCEL_EVENT, CURTAIN_EVENT } from "@/components/motion/MotionRuntime";
import { loginAction, quickDemoLoginAction } from "@/lib/auth/actions";

const QUICK_ROLES = [
  { id: "m01", name: "Riya Malhotra", badge: "Administrator", note: "Full governance, invitations & settings", tone: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { id: "m02", name: "Kabir Sethi", badge: "Senior Lead", note: "Workshops, attendance & junior progress", tone: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { id: "m13", name: "Devansh Joshi", badge: "Attendance Mgr", note: "Session roll-call & attendance management", tone: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  { id: "m06", name: "Arjun Nair", badge: "Junior", note: "Assigned roadmaps & personal progress", tone: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { id: "m04", name: "Sneha Nambiar", badge: "Active Member", note: "Directory, library resources & polls", tone: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
];

const LAUNCH_MS = 800;

const idx = (n: number) => ({ "--i": n }) as CSSProperties;

function ringStyle(size: string, depth: number): CSSProperties {
  return {
    "--depth": depth,
    width: size,
    height: size,
    left: "50%",
    top: "50%",
    marginLeft: `calc(${size} / -2)`,
    marginTop: `calc(${size} / -2)`,
  } as CSSProperties;
}

export default function SignInPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"hero" | "form">("hero");
  const [origin, setOrigin] = useState({ x: "50%", y: "72%" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const frame = useRef(0);

  const onPointerMove = (e: ReactPointerEvent) => {
    if (frame.current || e.pointerType === "touch") return;
    const { clientX, clientY } = e;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const el = heroRef.current;
      if (!el) return;
      el.style.setProperty("--px", ((clientX / window.innerWidth - 0.5) * 2).toFixed(3));
      el.style.setProperty("--py", ((clientY / window.innerHeight - 0.5) * 2).toFixed(3));
    });
  };

  const begin = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: `${rect.left + rect.width / 2}px`, y: `${rect.top + rect.height / 2}px` });
    setStage("form");
    window.setTimeout(() => emailRef.current?.focus({ preventScroll: true }), 700);
  };

  // The launch wipe starts on click and runs while the request is in flight, so the
  // app never feels stalled. The route changes once both the wipe and sign-in are done.
  const launchWith = async (el: HTMLElement, request: () => Promise<{ success: boolean; error?: string }>, fallback: string) => {
    const rect = el.getBoundingClientRect();
    setLoading(true);
    setError(null);
    window.dispatchEvent(new CustomEvent(CURTAIN_EVENT, { detail: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } }));
    const [res] = await Promise.all([request(), new Promise((resolve) => window.setTimeout(resolve, LAUNCH_MS))]);
    if (res.success) {
      router.push("/");
      router.refresh();
    } else {
      window.dispatchEvent(new Event(CURTAIN_CANCEL_EVENT));
      setLoading(false);
      setError(res.error || fallback);
    }
  };

  const handleManualLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const button = e.currentTarget.querySelector<HTMLButtonElement>("button[type=submit]");
    if (button) void launchWith(button, () => loginAction(email, password), "Failed to sign in");
  };

  const handleQuickLogin = (memberId: string, el: HTMLElement) =>
    void launchWith(el, () => quickDemoLoginAction(memberId), "Quick sign-in failed");

  return (
    <div data-lenis-prevent className="fixed inset-0 z-50 overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
      {/* Stage 1: landing hero */}
      <div
        ref={heroRef}
        onPointerMove={onPointerMove}
        className={`hero-stage hero-intro absolute inset-0 flex items-center justify-center overflow-hidden px-6 ${stage === "form" ? "is-away" : ""}`}
        aria-hidden={stage === "form"}
        inert={stage === "form"}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <span className="hero-layer rounded-full border border-[var(--line)]" style={ringStyle("min(120vmin, 1000px)", -14)} />
          <span className="hero-layer rounded-full border border-[var(--line-strong)]" style={ringStyle("min(78vmin, 640px)", -28)} />
          <span
            className="hero-layer rounded-full"
            style={{ "--depth": 40, width: "46vmax", height: "46vmax", right: "-12vmax", top: "-16vmax", background: "radial-gradient(closest-side, var(--accent-soft), transparent)" } as CSSProperties}
          />
          <span className="hero-layer rounded-full" style={{ "--depth": 64, width: 14, height: 14, left: "18%", top: "26%", background: "var(--accent)" } as CSSProperties} />
          <span className="hero-layer rounded-full" style={{ "--depth": -52, width: 8, height: 8, right: "22%", bottom: "24%", background: "var(--accent)", opacity: 0.7 } as CSSProperties} />
        </div>

        <div className="relative max-w-3xl text-center">
          <p className="fade-up text-sm font-medium tracking-[0.3em] text-[var(--accent-text)]" style={idx(0)}>
            AIMS · DTU
          </p>
          <h1 className="mt-5 text-[clamp(2.6rem,8vw,5.6rem)] leading-[1.02] font-semibold tracking-tight">
            <span className="line-mask">
              <span style={idx(1)}>One workspace for</span>
            </span>
            <span className="line-mask">
              <span style={idx(2)} className="text-[var(--accent)]">
                everything AIMS runs on.
              </span>
            </span>
          </h1>
          <p className="fade-up mx-auto mt-6 max-w-xl text-base text-[var(--muted)] sm:text-lg" style={idx(5)}>
            Resources, people, attendance, progress, polls and tasks in one private place for the society.
          </p>
          <div className="fade-up mt-10" style={idx(7)}>
            <button
              type="button"
              onClick={begin}
              className="group inline-flex min-h-14 cursor-pointer items-center gap-3 rounded-full bg-[var(--accent)] px-8 text-base font-semibold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)]"
            >
              Begin your mission
              <ArrowRight aria-hidden className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {stage === "form" && <span aria-hidden className="portal-ring" style={{ "--cx": origin.x, "--cy": origin.y } as CSSProperties} />}

      {/* Stage 2: sign-in, revealed by an expanding portal */}
      <div
        className={`portal absolute inset-0 overflow-y-auto bg-[var(--bg)] ${stage === "form" ? "is-open" : ""}`}
        style={{ "--cx": origin.x, "--cy": origin.y } as CSSProperties}
        inert={stage === "hero"}
      >
        <div className="mx-auto flex min-h-full w-full max-w-md items-center px-4 py-10">
          <div className="stagger w-full space-y-6">
            <button
              type="button"
              onClick={() => setStage("hero")}
              style={idx(0)}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md text-sm font-medium text-[var(--muted)] hover:text-[var(--fg)]"
            >
              <ArrowLeft aria-hidden className="size-4" />
              Back
            </button>
            <div style={idx(1)} className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">Sign in to AIMS</h2>
              <p className="text-sm text-[var(--muted)]">Private workspace for internal society operations, learning and governance.</p>
            </div>

            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-3.5 text-sm text-[var(--danger)]">
                <span>{error}</span>
              </div>
            )}

            <div style={idx(2)} className="space-y-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label htmlFor="si-email" className="mb-1.5 block text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail aria-hidden className="absolute top-3 left-3 size-4 text-[var(--subtle)]" />
                    <input
                      id="si-email"
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@aims.example"
                      required
                      autoComplete="email"
                      className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface-2)] py-2 pr-3 pl-9 text-sm text-[var(--fg)] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="si-password" className="block text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
                      Password
                    </label>
                    <span className="text-[11px] text-[var(--subtle)]">Default: aims2026</span>
                  </div>
                  <div className="relative">
                    <Lock aria-hidden className="absolute top-3 left-3 size-4 text-[var(--subtle)]" />
                    <input
                      id="si-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface-2)] py-2 pr-3 pl-9 text-sm text-[var(--fg)] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  <span>{loading ? "Signing in…" : "Sign in to workspace"}</span>
                  <ArrowRight aria-hidden className="size-4" />
                </button>
              </form>
            </div>

            <div style={idx(3)} className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2">
                <ShieldCheck aria-hidden className="size-4 text-[var(--accent)]" />
                <h3 className="text-xs font-semibold tracking-wider uppercase">Quick role-based access (local DB)</h3>
              </div>
              <p className="text-xs text-[var(--muted)]">Instant one-click sign-in as a sample person in each role:</p>
              <div className="space-y-2">
                {QUICK_ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    disabled={loading}
                    onClick={(e) => handleQuickLogin(role.id, e.currentTarget)}
                    className="group flex w-full cursor-pointer items-center justify-between rounded-lg border border-[var(--line)] p-2.5 text-left transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)] disabled:opacity-60"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{role.name}</span>
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${role.tone}`}>{role.badge}</span>
                      </div>
                      <p className="text-xs text-[var(--subtle)]">{role.note}</p>
                    </div>
                    <UserCheck aria-hidden className="size-4 text-[var(--muted)] transition group-hover:text-[var(--accent)]" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
