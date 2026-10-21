"use client";

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  Mail,
  Users,
  X,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  useEffect,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { CURTAIN_CANCEL_EVENT, CURTAIN_EVENT } from "@/components/motion/MotionRuntime";
import {
  loginAction,
  googleSsoLoginAction,
  getDemoAccountsAction,
  type DemoAccountSummary,
} from "@/lib/auth/actions";

const LAUNCH_MS = 800;

const idx = (n: number) => ({ "--i": n } as CSSProperties);

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

  // Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isAccountsDrawerOpen, setIsAccountsDrawerOpen] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountSummary[]>([]);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    getDemoAccountsAction().then((accs) => {
      if (accs && accs.length > 0) setDemoAccounts(accs);
    });
  }, []);

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

  const launchWith = async (
    targetEl: HTMLElement | null,
    request: () => Promise<{ success: boolean; error?: string }>,
    fallback: string
  ) => {
    setLoading(true);
    setError(null);

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent(CURTAIN_EVENT, {
          detail: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        })
      );
    }

    try {
      const [res] = await Promise.all([
        request(),
        new Promise((resolve) => window.setTimeout(resolve, LAUNCH_MS)),
      ]);

      if (res.success) {
        router.push("/");
        router.refresh();
      } else {
        window.dispatchEvent(new Event(CURTAIN_CANCEL_EVENT));
        setLoading(false);
        setError(res.error || fallback);
      }
    } catch (err: any) {
      window.dispatchEvent(new Event(CURTAIN_CANCEL_EVENT));
      setLoading(false);
      setError(err?.message || fallback);
    }
  };

  const handleManualLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const btn = e.currentTarget.querySelector<HTMLButtonElement>("button[type=submit]");
    void launchWith(
      btn,
      () => loginAction(email, password),
      "Invalid credentials. Please verify your email and password."
    );
  };

  const handleGoogleSso = async (targetEmail?: string, triggerBtn?: HTMLElement | null) => {
    setSsoLoading(true);
    setError(null);
    setIsGoogleModalOpen(false);

    await launchWith(
      triggerBtn || null,
      () => googleSsoLoginAction(targetEmail),
      "Google SSO authentication failed."
    );
    setSsoLoading(false);
  };

  const selectPersonaToFill = (acc: DemoAccountSummary) => {
    setEmail(acc.email);
    setPassword("aims2026");
    setIsAccountsDrawerOpen(false);
    emailRef.current?.focus();
  };

  return (
    <div data-lenis-prevent className="fixed inset-0 z-50 overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
      {/* =========================================================================
          STAGE 1: Landing Hero with Semicircle Animated Rings & Depth Parallax
      ========================================================================= */}
      <div
        ref={heroRef}
        onPointerMove={onPointerMove}
        className={`hero-stage hero-intro absolute inset-0 flex items-center justify-center overflow-hidden px-6 ${
          stage === "form" ? "is-away" : ""
        }`}
        aria-hidden={stage === "form"}
        inert={stage === "form"}
      >
        {/* Parallax concentric semicircle rings */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <span
            className="hero-layer rounded-full border border-[var(--line)]"
            style={ringStyle("min(120vmin, 1000px)", -14)}
          />
          <span
            className="hero-layer rounded-full border border-[var(--line-strong)]"
            style={ringStyle("min(78vmin, 640px)", -28)}
          />
          <span
            className="hero-layer rounded-full"
            style={
              {
                "--depth": 40,
                width: "46vmax",
                height: "46vmax",
                right: "-12vmax",
                top: "-16vmax",
                background: "radial-gradient(closest-side, var(--accent-soft), transparent)",
              } as CSSProperties
            }
          />
          <span
            className="hero-layer rounded-full shadow-[0_0_12px_var(--accent)]"
            style={
              {
                "--depth": 64,
                width: 14,
                height: 14,
                left: "18%",
                top: "26%",
                background: "var(--accent)",
              } as CSSProperties
            }
          />
          <span
            className="hero-layer rounded-full"
            style={
              {
                "--depth": -52,
                width: 8,
                height: 8,
                right: "22%",
                bottom: "24%",
                background: "var(--accent)",
                opacity: 0.7,
              } as CSSProperties
            }
          />
        </div>

        {/* Hero Narrative & CTA */}
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
              <ArrowRight
                aria-hidden
                className="size-5 transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Expanding portal ring animation originating from the button */}
      {stage === "form" && (
        <span
          aria-hidden
          className="portal-ring"
          style={{ "--cx": origin.x, "--cy": origin.y } as CSSProperties}
        />
      )}

      {/* =========================================================================
          STAGE 2: Elevated Sign-In Portal (Visible on First Glance, No Scroll)
      ========================================================================= */}
      <div
        className={`portal absolute inset-0 overflow-y-auto bg-[var(--bg)] ${
          stage === "form" ? "is-open" : ""
        }`}
        style={{ "--cx": origin.x, "--cy": origin.y } as CSSProperties}
        inert={stage === "hero"}
      >
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-3 sm:py-5">
          <div className="stagger w-full space-y-3 sm:space-y-3.5">
            {/* Top Navigation Row */}
            <div style={idx(0)} className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStage("hero")}
                className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg text-xs font-semibold text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
              >
                <ArrowLeft aria-hidden className="size-3.5" />
                Back
              </button>
              <span className="rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[var(--subtle)] uppercase">
                DTU Campus Node
              </span>
            </div>

            {/* Title Block */}
            <div style={idx(1)} className="space-y-0.5">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--fg)]">
                Sign in to AIMS
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Private workspace for internal society operations & governance.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-2.5 text-xs text-[var(--danger)]"
              >
                <span>{error}</span>
              </div>
            )}

            {/* Option 1: Google SSO Button */}
            <div style={idx(2)}>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                disabled={loading || ssoLoading}
                className="group flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-xs font-semibold text-[var(--fg)] transition-all hover:border-[var(--accent)] hover:bg-[var(--surface-2)] hover:shadow-md disabled:opacity-50"
              >
                <svg className="size-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
                <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.2 text-[10px] font-normal text-[var(--muted)]">
                  Gmail & @dtu.ac.in
                </span>
              </button>
            </div>

            {/* Divider */}
            <div style={idx(3)} className="relative flex items-center justify-center py-0.5">
              <div className="w-full border-t border-[var(--line)]" />
              <span className="absolute bg-[var(--bg)] px-2.5 text-[10px] font-medium tracking-wider text-[var(--subtle)] uppercase">
                or continue with email
              </span>
            </div>

            {/* Option 2: Clean Credentials Form Card */}
            <div
              style={idx(4)}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-lg"
            >
              <form onSubmit={handleManualLogin} className="space-y-3">
                {/* Email or Username */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="si-email"
                      className="block text-[11px] font-semibold tracking-wider text-[var(--muted)] uppercase"
                    >
                      Email or Username
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAccountsDrawerOpen(true)}
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--accent-text)] hover:underline"
                    >
                      <HelpCircle className="size-3" />
                      Seeded accounts
                    </button>
                  </div>
                  <div className="relative">
                    <Mail
                      aria-hidden
                      className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-[var(--subtle)]"
                    />
                    <input
                      id="si-email"
                      ref={emailRef}
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="riya.malhotra@aims.example"
                      required
                      autoComplete="email"
                      className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface-2)] py-2 pr-3 pl-8 text-xs text-[var(--fg)] placeholder:text-[var(--subtle)] transition-colors focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="si-password"
                      className="block text-[11px] font-semibold tracking-wider text-[var(--muted)] uppercase"
                    >
                      Password
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[var(--subtle)]">Default:</span>
                      <button
                        type="button"
                        onClick={() => setPassword("aims2026")}
                        className="rounded border border-amber-500/30 bg-amber-500/10 px-1 py-0.2 text-[9px] font-mono font-semibold text-amber-400 hover:bg-amber-500/20"
                        title="Click to fill default password"
                      >
                        aims2026 (fill)
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Lock
                      aria-hidden
                      className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-[var(--subtle)]"
                    />
                    <input
                      id="si-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface-2)] py-2 pr-8 pl-8 text-xs text-[var(--fg)] placeholder:text-[var(--subtle)] transition-colors focus:border-[var(--accent)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-2.5 right-2.5 text-[var(--subtle)] hover:text-[var(--fg)]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between text-[11px] text-[var(--muted)] pt-0.5">
                  <label className="flex cursor-pointer items-center gap-1.5 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-3 rounded border-[var(--line-strong)] bg-[var(--surface-2)] accent-[var(--accent)]"
                    />
                    <span>Remember this device</span>
                  </label>
                  <span className="text-[10px] text-[var(--subtle)]">Session: 30 days</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || ssoLoading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  <span>{loading ? "Signing in…" : "Sign in to workspace"}</span>
                  <ArrowRight aria-hidden className="size-3.5" />
                </button>
              </form>
            </div>

            {/* Footer Reference */}
            <div style={idx(5)} className="text-center text-[11px] text-[var(--subtle)] pt-1">
              <button
                type="button"
                onClick={() => setIsAccountsDrawerOpen(true)}
                className="text-amber-300 hover:underline"
              >
                docs/SEEDED_CREDENTIALS.md
              </button>
              {" · "}
              <span>Clerk SSO Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: Google / Gmail SSO Account Picker (Clerk-Ready Prototype Flow)
      ========================================================================= */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <svg className="size-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--fg)]">
                  Google Workspace Single Sign-On
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Sign in with your @gmail.com or @dtu.ac.in account
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-300">
              <span className="font-semibold">Clerk SSO Ready:</span> In production, this OAuth handshake is serviced by Clerk. Select a Google account or enter your email below to authenticate locally.
            </div>

            <div className="space-y-2 mb-4">
              <label className="block text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
                Choose a Google Account
              </label>

              {[
                {
                  email: "riya.malhotra@aims.example",
                  display: "riya.malhotra@gmail.com",
                  name: "Riya Malhotra",
                  role: "Administrator",
                },
                {
                  email: "kabir.sethi@aims.example",
                  display: "kabir.sethi@gmail.com",
                  name: "Kabir Sethi",
                  role: "Senior Lead",
                },
                {
                  email: "arjun.nair@aims.example",
                  display: "arjun.nair@dtu.ac.in",
                  name: "Arjun Nair",
                  role: "Junior Member",
                },
              ].map((item) => (
                <button
                  key={item.email}
                  type="button"
                  onClick={() => void handleGoogleSso(item.email)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-left transition hover:border-[var(--accent)] hover:bg-[var(--surface-3)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[var(--accent)]/20 text-xs font-bold text-[var(--accent)]">
                      {item.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--fg)]">{item.name}</div>
                      <div className="text-xs text-[var(--muted)]">{item.display}</div>
                    </div>
                  </div>
                  <span className="rounded bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-text)]">
                    {item.role}
                  </span>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                Or type another Google email:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="flex-1 rounded-xl border border-[var(--line-strong)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--fg)] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customGoogleEmail) void handleGoogleSso(customGoogleEmail);
                  }}
                  disabled={!customGoogleEmail}
                  className="cursor-pointer rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  Sign in
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(false)}
              className="w-full cursor-pointer rounded-xl border border-[var(--line)] py-2 text-center text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-2)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER: Seeded Credentials Reference (docs/SEEDED_CREDENTIALS.md)
      ========================================================================= */}
      {isAccountsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative flex h-full w-full max-w-lg flex-col border-l border-[var(--line-strong)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-[var(--accent)]" />
                  <h3 className="text-base font-semibold text-[var(--fg)]">
                    Seeded Test Accounts
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  From <code className="text-amber-300">docs/SEEDED_CREDENTIALS.md</code>. Click any row to pre-fill.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountsDrawerOpen(false)}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--fg)]">Global Password:</span>
                  <code className="rounded bg-black/40 px-2 py-0.5 font-mono text-amber-300">
                    aims2026
                  </code>
                </div>
                <p className="mt-1 text-[11px] text-[var(--subtle)]">
                  All seeded accounts share this default password.
                </p>
              </div>

              <div className="space-y-2">
                {demoAccounts.map((acc) => {
                  const roleBadgeColors: Record<string, string> = {
                    admin: "bg-amber-500/15 text-amber-300 border-amber-500/30",
                    senior: "bg-blue-500/15 text-blue-300 border-blue-500/30",
                    attendance_manager: "bg-purple-500/15 text-purple-300 border-purple-500/30",
                    junior: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                    member: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
                  };
                  const badgeClass =
                    roleBadgeColors[acc.role] || "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";

                  return (
                    <div
                      key={acc.id}
                      onClick={() => selectPersonaToFill(acc)}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/60 p-3.5 transition hover:border-[var(--accent)] hover:bg-[var(--surface-2)]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--fg)]">
                            {acc.name}
                          </span>
                          <span
                            className={`rounded border px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
                          >
                            {acc.role.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-[var(--muted)]">
                          {acc.email}
                        </div>
                        <div className="text-[11px] text-[var(--subtle)]">
                          {acc.academicYear} · {acc.department || "General"}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-medium text-[var(--accent-text)] opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Use</span>
                        <ChevronRight className="size-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[var(--line)] p-4 bg-[var(--surface-2)] text-center text-xs text-[var(--muted)]">
              Refer to{" "}
              <span className="text-amber-300 font-medium">docs/SEEDED_CREDENTIALS.md</span> for full permission breakdown.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
