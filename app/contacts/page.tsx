import { readContacts } from "@/lib/csv";
import CampaignTable from "@/components/CampaignTable";
import { Users, Download, Search, Filter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ContactsPage() {
  const allContacts = readContacts().sort((a, b) => new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime());

  return (
    <div className="py-12 space-y-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary rounded-2xl border border-white/5">
                <Users className="w-8 h-8 text-primary shadow-lg shadow-primary/10" />
              </div>
              <h1 className="text-5xl font-heading tracking-tight">All Contacts</h1>
          </div>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <span className="text-white font-bold">{allContacts.length}</span> people discovered across all campaigns
          </p>
        </div>

        <div className="flex gap-4">
            <Link href="/api/export">
                <Button variant="outline" className="h-12 px-6 rounded-xl bg-surface border-white/5 gap-2 hover:bg-white/5">
                <Download className="w-5 h-5" />
                Export All CSV
                </Button>
            </Link>
        </div>
      </div>

      {/* Filter Bar (Simplified) */}
      <div className="flex gap-4 items-center bg-surface/50 p-4 rounded-2xl border border-white/5 shadow-inner">
        <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
                type="text" 
                placeholder="Search by name, company, or role..." 
                className="w-full h-12 bg-secondary/50 rounded-xl pl-12 pr-4 text-sm border-0 focus:ring-1 ring-primary transition-all shadow-inner"
            />
        </div>
        
        <div className="flex gap-2">
            <div className="relative group">
                <Button variant="ghost" className="h-12 px-4 rounded-xl gap-2 hover:bg-white/5 bg-secondary/30">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Filter</span>
                </Button>
            </div>
            <Badge variant="outline" className="h-12 border-white/5 bg-secondary px-6 text-white text-[10px] font-bold uppercase tracking-widest shadow-inner">
                {allContacts.length} Total
            </Badge>
        </div>
      </div>

      <CampaignTable contacts={allContacts} />
    </div>
  );
}
