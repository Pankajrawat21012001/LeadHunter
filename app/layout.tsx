import type { Metadata } from "next";
import { Syne, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import { LayoutDashboard, History, Users, Settings, Zap } from "lucide-react";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
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
    <html lang="en">
      <body
        className={`${syne.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans bg-background text-foreground flex min-h-screen`}
      >
        {/* Sidebar */}
        <aside className="w-64 border-r border-purple-100 sidebar-gradient flex flex-col fixed h-full z-50 shadow-[2px_0_20px_rgba(124,58,237,0.06)]">
          {/* Logo */}
          <div className="p-6 border-b border-purple-100/80">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center accent-glow shadow-purple-500/20 shadow-lg">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div> */}
              <span className="font-heading text-lg tracking-tight uppercase font-extrabold text-primary group-hover:opacity-80 transition-opacity">LeadHunter</span>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 space-y-1">
            <SidebarItem href="/" icon={<LayoutDashboard className="w-4 h-4" />} label="New Search" />
            <SidebarItem href="/history" icon={<History className="w-4 h-4" />} label="History" />
            <SidebarItem href="/contacts" icon={<Users className="w-4 h-4" />} label="All Contacts" />
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-purple-100/80">
            <SidebarItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-primary/8 to-primary/4 border border-primary/12">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">System Credits</p>
              <div className="flex items-end justify-between">
                <p className="text-xl font-heading text-primary tracking-widest leading-none">∞<span className="text-[10px] ml-1 uppercase text-muted-foreground">Remaining</span></p>
                <Zap className="w-4 h-4 text-primary fill-primary opacity-40 animate-pulse" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 relative">
          {/* Gradient background */}
          <div className="fixed inset-0 ml-64 bg-gradient-to-br from-[#f5f3ff] via-[#ede9fe] to-[#ddd6fe] -z-10" />
          <div className="p-8 relative">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </div>
        </main>

        <Toaster theme="light" position="top-right" richColors />
      </body>
    </html>
  );
}
