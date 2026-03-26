import { getContactCount } from "@/lib/csv";
import SearchForm from "@/components/SearchForm";
import Link from "next/link";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const count = getContactCount();

  return (
    <div className="py-12 relative overflow-hidden">
      {/* Search Header Section */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <svg 
              className="w-8 h-8 text-primary" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-heading tracking-tight">LeadHunter Dashboard</h2>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mt-1">
              Active Session — v2.2
            </p>
          </div>
        </div>

        <Link href="/history">
          <Button variant="outline" className="rounded-xl px-6 h-12 gap-2 border-white/5 bg-surface hover:bg-white/5">
            <History className="w-5 h-5 text-primary" />
            View History
          </Button>
        </Link>
      </div>

      <SearchForm existingCount={count} />
    </div>
  );
}
