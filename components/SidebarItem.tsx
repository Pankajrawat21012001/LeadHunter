'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function SidebarItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  
  const isActive = href === '/' 
    ? pathname === '/' 
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
        isActive 
          ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/10' 
          : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
      }`}
    >
      <span className={`transition-all duration-200 ${isActive ? 'text-primary' : 'group-hover:text-primary'}`}>
        {icon}
      </span>
      <span className={`text-sm transition-all ${isActive ? 'font-semibold text-primary' : 'font-medium'}`}>{label}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(124,58,237,0.8)]" />
      )}
    </Link>
  );
}
