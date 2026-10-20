import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Outfit } from "next/font/google";
import { MotionRuntime } from "@/components/motion/MotionRuntime";
import { Splash } from "@/components/motion/Splash";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/Toast";
import { DemoProvider } from "@/state/store";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AIMS Workspace",
    template: "%s · AIMS Workspace",
  },
  description: "Official internal workspace for the AI & ML Society of Delhi Technological University (DTU).",
};

export const viewport: Viewport = {
  themeColor: "#15100c",
};

// Applies the saved theme before first paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem("aims-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

// Flags the first visit in this tab so the splash can paint before hydration (no flash on return visits).
const splashScript = `try{if(!sessionStorage.getItem("aims-splash"))document.documentElement.dataset.splash="show"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" data-theme="dark" className={outfit.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: splashScript }} />
      </head>
      <body>
        <Splash />
        <Suspense fallback={null}>
          <MotionRuntime />
        </Suspense>
        <DemoProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
