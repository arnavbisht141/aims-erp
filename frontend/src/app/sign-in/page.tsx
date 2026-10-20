"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, quickDemoLoginAction } from "@/lib/auth/actions";
import { ArrowRight, Lock, Mail, ShieldCheck, UserCheck, Sparkles } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await loginAction(email, password);
    setLoading(false);

    if (res.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(res.error || "Failed to sign in");
    }
  };

  const handleQuickLogin = async (memberId: string) => {
    setLoading(true);
    setError(null);
    const res = await quickDemoLoginAction(memberId);
    setLoading(false);

    if (res.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(res.error || "Quick sign-in failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--bg)] p-4 text-[var(--fg)]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AIMS • Delhi Technological University</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)]">
            Sign in to AIMS EMS
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Private workspace for internal society operations, learning & governance
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-lg text-sm bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/30 flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* Manual Credentials Form */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6 shadow-sm space-y-4">
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--subtle)] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@aims.example"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-[var(--surface-2)] border border-[var(--line-strong)] rounded-lg text-sm text-[var(--fg)] placeholder:text-[var(--subtle)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Password
                </label>
                <span className="text-[11px] text-[var(--subtle)]">Default: aims2026</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--subtle)] absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-[var(--surface-2)] border border-[var(--line-strong)] rounded-lg text-sm text-[var(--fg)] placeholder:text-[var(--subtle)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? "Signing in..." : "Sign In to Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 1-Click Role Access (RBAC Showcase) */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--line)]">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg)]">
              Quick Role-Based Access (Local DB)
            </h2>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Instant 1-click test sign-in into the local PostgreSQL database:
          </p>

          <div className="space-y-2">
            {/* Admin */}
            <button
              type="button"
              onClick={() => handleQuickLogin("m01")}
              disabled={loading}
              className="w-full text-left p-2.5 rounded-lg border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)] transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--fg)]">Riya Malhotra</span>
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Administrator
                  </span>
                </div>
                <p className="text-xs text-[var(--subtle)]">Full governance, invitations & settings</p>
              </div>
              <UserCheck className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)] transition" />
            </button>

            {/* Senior Lead */}
            <button
              type="button"
              onClick={() => handleQuickLogin("m02")}
              disabled={loading}
              className="w-full text-left p-2.5 rounded-lg border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)] transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--fg)]">Kabir Sethi</span>
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Senior Lead
                  </span>
                </div>
                <p className="text-xs text-[var(--subtle)]">Workshops, attendance & junior progress</p>
              </div>
              <UserCheck className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)] transition" />
            </button>

            {/* Attendance Manager */}
            <button
              type="button"
              onClick={() => handleQuickLogin("m13")}
              disabled={loading}
              className="w-full text-left p-2.5 rounded-lg border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)] transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--fg)]">Devansh Joshi</span>
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    Attendance Mgr
                  </span>
                </div>
                <p className="text-xs text-[var(--subtle)]">Session roll-call & attendance management</p>
              </div>
              <UserCheck className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)] transition" />
            </button>

            {/* Junior */}
            <button
              type="button"
              onClick={() => handleQuickLogin("m06")}
              disabled={loading}
              className="w-full text-left p-2.5 rounded-lg border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)] transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--fg)]">Arjun Nair</span>
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Junior
                  </span>
                </div>
                <p className="text-xs text-[var(--subtle)]">Assigned roadmaps & personal progress</p>
              </div>
              <UserCheck className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)] transition" />
            </button>

            {/* Member */}
            <button
              type="button"
              onClick={() => handleQuickLogin("m04")}
              disabled={loading}
              className="w-full text-left p-2.5 rounded-lg border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)] transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--fg)]">Sneha Nambiar</span>
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-zinc-500/15 text-zinc-300 border border-zinc-500/30">
                    Active Member
                  </span>
                </div>
                <p className="text-xs text-[var(--subtle)]">Directory, library resources & polls</p>
              </div>
              <UserCheck className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)] transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
