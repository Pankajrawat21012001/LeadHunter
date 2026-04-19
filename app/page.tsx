import { Suspense } from "react";
import { Zap, History, Users } from "lucide-react";
import { getContactCount } from "@/lib/csv";
import SearchForm from "@/components/SearchForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const count = getContactCount();

  return (
    <div className="py-12 relative overflow-hidden">
      {/* Search Header Section */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
            <Zap className="w-8 h-8 text-primary fill-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-heading tracking-tight">LeadHunter</h2>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mt-1 flex items-center gap-2">
              <Users className="w-3 h-3 opacity-50" />
              Pulse: <span className="text-white">{count}</span> People Pulled
            </p>
          </div>
        </div>

        <Link href="/history">
          <Button variant="outline" className="rounded-xl px-6 h-12 gap-2 border-white/5 bg-surface hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]">
            <History className="w-4 h-4 text-primary" />
            View History
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="h-96 w-full bg-surface/50 rounded-3xl border border-dashed border-white/10 animate-pulse flex items-center justify-center text-muted-foreground italic">Gravity engaging...</div>}>
        <SearchForm existingCount={count} />
      </Suspense>
    </div>
  );
}
