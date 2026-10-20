"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/*
 * App-wide motion, kept deliberately cheap:
 *  - Lenis: eased (lerped) window scrolling, no scroll hijacking of nested scrollers.
 *  - ONE IntersectionObserver reveals blocks as they scroll in, staggered per batch.
 *  - ONE rAF-throttled scroll handler drives parallax via the `translate` property
 *    (reveals use `transform`, so the two never fight).
 * Everything animates transform/opacity only and switches off for reduced motion.
 */

const REVEAL_SELECTOR = [
  "[data-reveal]",
  "#main > :not(ul):not(dialog):not(script)",
  "#main ul[class*='grid'] > li",
  "#main .grid > section",
].join(",");

/** Elements added this long after navigation (filter results, toasts) appear instantly. */
const ENTRANCE_WINDOW_MS = 1600;
const STAGGER_MS = 60;
const MAX_STAGGER = 8;

export const CURTAIN_EVENT = "aims:curtain";
export const CURTAIN_CANCEL_EVENT = "aims:curtain-cancel";

interface CurtainState {
  x: number;
  y: number;
  phase: "in" | "out";
}

export function MotionRuntime() {
  const pathname = usePathname();
  const navAt = useRef(0);
  const [curtain, setCurtain] = useState<CurtainState | null>(null);

  // Route change: open a new window in which fresh content gets the entrance animation.
  useEffect(() => {
    navAt.current = performance.now();
    window.scrollTo(0, 0);
    const retract = window.setTimeout(() => setCurtain((c) => (c?.phase === "in" ? { ...c, phase: "out" } : c)), 350);
    return () => window.clearTimeout(retract);
  }, [pathname]);

  // The sign-in "mission launch" wipe is requested via a window event.
  useEffect(() => {
    const open = (event: Event) => {
      const { x, y } = (event as CustomEvent<{ x: number; y: number }>).detail;
      setCurtain({ x, y, phase: "in" });
      // Safety net: never leave the screen covered if navigation fails.
      window.setTimeout(() => setCurtain((c) => (c?.phase === "in" ? { ...c, phase: "out" } : c)), 6000);
    };
    const cancel = () => setCurtain((c) => (c ? { ...c, phase: "out" } : c));
    window.addEventListener(CURTAIN_EVENT, open);
    window.addEventListener(CURTAIN_CANCEL_EVENT, cancel);
    return () => {
      window.removeEventListener(CURTAIN_EVENT, open);
      window.removeEventListener(CURTAIN_CANCEL_EVENT, cancel);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("js-motion");

    /* ---------- Smooth scroll ---------- */
    const lenis = new Lenis({
      lerp: 0.11,
      wheelMultiplier: 0.95,
      prevent: (node) => Boolean(node.closest("dialog, [data-lenis-prevent]")),
    });
    let rafId = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    /* ---------- Scroll reveal ---------- */
    const revealIo = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        entering.forEach((entry, i) => {
          const el = entry.target as HTMLElement;
          el.style.setProperty("--mrv-delay", `${Math.min(i, MAX_STAGGER) * STAGGER_MS}ms`);
          el.dataset.mrv = "in";
          revealIo.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );

    const prepare = (el: Element) => {
      const node = el as HTMLElement;
      if (node.dataset.mrv) return;
      if (performance.now() - navAt.current > ENTRANCE_WINDOW_MS && !node.matches("[data-reveal]")) {
        node.dataset.mrv = "in";
        node.style.setProperty("--mrv-delay", "0ms");
        node.classList.add("mrv-instant");
        return;
      }
      node.dataset.mrv = "pre";
      revealIo.observe(node);
    };
    const scan = (scope: ParentNode) => {
      if (scope instanceof Element && scope.matches(REVEAL_SELECTOR)) prepare(scope);
      scope.querySelectorAll(REVEAL_SELECTOR).forEach(prepare);
    };
    scan(document);

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => node instanceof Element && scan(node));
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    /* ---------- Parallax ---------- */
    let scheduled = false;
    const applyParallax = () => {
      scheduled = false;
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const speed = parseFloat(el.dataset.parallax ?? "0");
        el.style.translate = `0 ${((rect.top + rect.height / 2 - vh / 2) * -speed).toFixed(1)}px`;
      });
      document.querySelectorAll<HTMLElement>("[data-parallax-page]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallaxPage ?? "0");
        el.style.translate = `0 ${(window.scrollY * -speed).toFixed(1)}px`;
      });
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(applyParallax);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      revealIo.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.classList.remove("js-motion");
      document.querySelectorAll<HTMLElement>("[data-mrv]").forEach((el) => {
        delete el.dataset.mrv;
      });
    };
  }, []);

  if (!curtain) return null;
  return (
    <div
      aria-hidden
      className="mission-curtain"
      data-phase={curtain.phase}
      style={{ "--cx": `${curtain.x}px`, "--cy": `${curtain.y}px` } as React.CSSProperties}
      onAnimationEnd={() => curtain.phase === "out" && setCurtain(null)}
    >
      <span className="mission-curtain-mark" />
    </div>
  );
}
