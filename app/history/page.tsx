import { readCampaigns, readContacts } from "@/lib/csv";
import HistoryChart from "@/components/HistoryChart";
import { 
    History as HistoryIcon, 
    ChevronRight, 
    Calendar, 
    Users, 
    Mail, 
    LayoutDashboard,
    Briefcase,
    Target,
    Link2
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const campaigns = readCampaigns().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const allContacts = readContacts();
  
  const stats = {
    totalCampaigns: campaigns.length,
    totalPeople: allContacts.length,
    uniquePeople: new Set(allContacts.map(c => c.linkedinUrl)).size,
    successRate: Math.round((allContacts.filter(c => c.emailStatus === 'found').length / (allContacts.length || 1)) * 100)
  };

  return (
    <div className="py-12 space-y-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Go to Search
          </Link>
          <h1 className="text-5xl font-heading tracking-tight">Campaign History</h1>
          <p className="text-muted-foreground font-medium">Tracking your outreach results since Jan 2026</p>
        </div>
      </div>

      {/* Stats Summary Table */}
      <div className="grid grid-cols-4 gap-6">
        <StatsTile label="Total Campaigns" value={stats.totalCampaigns.toString()} />
        <StatsTile label="People Found" value={stats.totalPeople.toString()} />
        <StatsTile label="Unique Profiles" value={stats.uniquePeople.toString()} />
        <StatsTile label="Email Find Rate" value={`${stats.successRate}%`} />
      </div>

      {/* Chart Section */}
      <HistoryChart campaigns={campaigns} />

      {/* Campaign List */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
            <HistoryIcon className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-heading">Recent Activity</h2>
        </div>

        <div className="grid gap-4">
          {campaigns.length > 0 ? campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaign/${campaign.id}`} className="group">
              <div className="p-6 bg-surface hover:bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between transition-all duration-300 group-hover:scale-[1.01] shadow-xl">
                 <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-xl ${
                        campaign.useCase === 'job' ? 'bg-[#6366f1]/10 text-[#6366f1]' : 
                        campaign.useCase === 'customer' ? 'bg-[#10b981]/10 text-[#10b981]' : 
                        'bg-[#f59e0b]/10 text-[#f59e0b]'
                    }`}>
                        {campaign.useCase === 'job' ? <Briefcase className="w-6 h-6" /> : 
                         campaign.useCase === 'customer' ? <Target className="w-6 h-6" /> : 
                         <Link2 className="w-6 h-6" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{campaign.name}</h4>
                        <div className="flex gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                           <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(campaign.createdAt).toLocaleDateString()}</span>
                           <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {campaign.totalFound} Found</span>
                           {campaign.emailsFound > 0 && <span className="flex items-center gap-1 text-success"><Mail className="w-3 h-3" /> {campaign.emailsFound} Emails</span>}
                        </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Status</p>
                        <Badge variant="outline" className={`font-bold border-white/5 bg-secondary px-3 py-1 ${
                            campaign.status === 'completed' ? 'text-success' : 'text-warning'
                        }`}>
                            {campaign.status}
                        </Badge>
                    </div>
                    <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 group-hover:text-white transition-all" />
                 </div>
              </div>
            </Link>
          )) : (
            <div className="p-12 bg-surface/50 border border-dashed border-white/10 rounded-2xl text-center flex flex-col items-center">
              <HistoryIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No campaigns found. Start your first search now!</p>
              <Link href="/" className="mt-4 text-primary font-bold hover:underline">Launch New Search</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/30 p-6 rounded-2xl border border-white/5 text-center">
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2 opacity-60">{label}</p>
        <p className="text-3xl font-heading text-white">{value}</p>
    </div>
  );
}
