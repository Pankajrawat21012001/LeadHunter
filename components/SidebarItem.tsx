'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function SidebarItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  
  // Logic for active state:
  // - Exactly match for root (/)
  // - Starts with for others (/history, /contacts, etc.)
  const isActive = href === '/' 
    ? pathname === '/' 
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
        isActive 
          ? 'bg-primary/15 text-white border border-primary/20 shadow-lg shadow-primary/5' 
          : 'text-muted-foreground hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={`transition-all duration-300 ${isActive ? 'text-primary scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className={`font-medium tracking-tight ${isActive ? 'font-bold' : ''}`}>{label}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,1)]" />
      )}
    </Link>
  );
}
