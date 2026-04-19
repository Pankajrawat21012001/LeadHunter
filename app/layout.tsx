import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import { LayoutDashboard, History, Users, Settings, Zap } from "lucide-react";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

import SidebarItem from "@/components/SidebarItem";

export const metadata: Metadata = {
  title: "LeadHunter | AI Outreach",
  description: "Find and connect with your target audience using AI gravity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans bg-background text-foreground flex min-h-screen`}
      >
        {/* Sidebar */}
        <aside className="w-64 border-r border-border/50 bg-surface flex flex-col fixed h-full z-50">
          <div className="p-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center accent-glow shadow-primary/20 shadow-lg">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="font-heading text-xl tracking-tighter uppercase font-extrabold group-hover:tracking-normal transition-all duration-300">LeadHunter</span>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2">
            <SidebarItem href="/" icon={<LayoutDashboard className="w-4 h-4" />} label="New Search" />
            <SidebarItem href="/history" icon={<History className="w-4 h-4" />} label="History" />
            <SidebarItem href="/contacts" icon={<Users className="w-4 h-4" />} label="All Contacts" />
          </nav>

          <div className="p-4 border-t border-border/10">
            <SidebarItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
            <div className="mt-4 p-5 rounded-3xl bg-secondary/30 border border-white/5 shadow-inner">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-3 opacity-60">System Credits</p>
              <div className="flex items-end justify-between">
                <p className="text-xl font-heading text-white tracking-widest leading-none">∞<span className="text-[10px] ml-1 uppercase opacity-30">Remaining</span></p>
                <Zap className="w-4 h-4 text-primary fill-primary opacity-20 animate-pulse" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8 relative">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        <Toaster theme="dark" position="top-right" richColors />
      </body>
    </html>
  );
}
