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

export const metadata: Metadata = {
  title: "leadhunter V2 | AI-Powered Outreach",
  description: "Find and connect with your target audience using AI.",
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
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center accent-glow">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="font-heading text-xl tracking-tight uppercase">leadhunter</span>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2">
            <SidebarItem href="/" icon={<LayoutDashboard className="w-5 h-5" />} label="New Search" />
            <SidebarItem href="/history" icon={<History className="w-5 h-5" />} label="History" />
            <SidebarItem href="/contacts" icon={<Users className="w-5 h-5" />} label="All Contacts" />
          </nav>

          <div className="p-4 border-t border-border/50">
            <SidebarItem href="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/10">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Credits</p>
              <p className="text-sm font-mono mt-1">Unlimited</p>
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

function SidebarItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-all duration-200 group"
    >
      <span className="group-hover:scale-110 transition-transform duration-200">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
