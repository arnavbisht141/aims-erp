"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "aims-splash";
const MIN_VISIBLE_MS = 1700;
const EXIT_MS = 900;

/**
 * First-load splash, shown once per browser tab. An inline script in the root
 * layout sets html[data-splash="show"] before first paint, so returning
 * visitors never see a flash. Pure CSS animation; JS only decides when to leave.
 */
export function Splash() {
  const [phase, setPhase] = useState<"show" | "leaving" | "gone">("show");

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.splash !== "show") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("gone");
      return;
    }
    const started = performance.now();
    let timer: number | undefined;
    const leave = () => {
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - started));
      timer = window.setTimeout(() => {
        setPhase("leaving");
        // Releases the paused hero/page entrance animations underneath.
        root.dataset.splash = "done";
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* private mode: splash may replay next visit */
        }
        timer = window.setTimeout(() => setPhase("gone"), EXIT_MS);
      }, wait);
    };
    if (document.readyState === "complete") leave();
    else window.addEventListener("load", leave, { once: true });
    return () => {
      window.removeEventListener("load", leave);
      window.clearTimeout(timer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div className="splash" data-leaving={phase === "leaving"} role="status" aria-label="Loading AIMS workspace">
      <div className="splash-stage" aria-hidden>
        <svg viewBox="-100 -100 200 200" className="splash-orbit">
          <circle r="34" className="splash-ring r1" />
          <circle r="58" className="splash-ring r2" />
          <circle r="82" className="splash-ring r3" />
          <g className="splash-spin s1">
            <circle cx="34" r="4" className="splash-dot" />
          </g>
          <g className="splash-spin s2">
            <circle cx="-58" r="3.2" className="splash-dot" />
          </g>
          <g className="splash-spin s3">
            <circle cx="82" r="2.6" className="splash-dot" />
          </g>
          <circle r="9" className="splash-core" />
        </svg>
        <p className="splash-word">AIMS</p>
        <p className="splash-sub">AI &amp; ML Society · DTU</p>
      </div>
      <div className="splash-bar" aria-hidden>
        <span />
      </div>
    </div>
  );
}
