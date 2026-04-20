import { Suspense } from "react";
import { Zap, History, Users } from "lucide-react";
import { getContactCount } from "@/lib/csv";
import SearchForm from "@/components/SearchForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const count = getContactCount();

  return (
    <div className="py-10 relative overflow-hidden">
      {/* Search Header Section */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/15 shadow-sm shadow-primary/5">
            <Zap className="w-7 h-7 text-primary fill-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-heading tracking-tight text-foreground">LeadHunter</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-primary" />
              Pulse: <span className="text-primary font-bold">{count}</span> People Pulled
            </p>
          </div>
        </div>

        <Link href="/history">
          <Button variant="outline" className="rounded-xl px-5 h-10 gap-2 border-purple-200 bg-white hover:bg-purple-50 hover:border-primary/30 font-semibold text-xs text-foreground shadow-sm transition-all">
            <History className="w-4 h-4 text-primary" />
            View History
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="h-96 w-full bg-white/60 rounded-3xl border border-dashed border-purple-200 animate-pulse flex items-center justify-center text-muted-foreground italic">Gravity engaging...</div>}>
        <SearchForm existingCount={count} />
      </Suspense>
    </div>
  );
}
