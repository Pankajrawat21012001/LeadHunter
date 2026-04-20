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
    Link2,
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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
    <div className="py-10 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest gap-1.5 group">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Go to Search
          </Link>
          <h1 className="text-4xl font-heading tracking-tight text-foreground">Campaign History</h1>
          <p className="text-muted-foreground text-sm">Tracking your outreach results since Jan 2026</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-5">
        <StatsTile label="Total Campaigns" value={stats.totalCampaigns.toString()} color="purple" />
        <StatsTile label="People Found" value={stats.totalPeople.toString()} color="blue" />
        <StatsTile label="Unique Profiles" value={stats.uniquePeople.toString()} color="green" />
        <StatsTile label="Email Find Rate" value={`${stats.successRate}%`} color="amber" />
      </div>

      {/* Chart */}
      <HistoryChart campaigns={campaigns} />

      {/* Campaign List */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HistoryIcon className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-heading text-foreground">Recent Activity</h2>
        </div>

        <div className="grid gap-3">
          {campaigns.length > 0 ? campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaign/${campaign.id}`} className="group">
              <div className="p-5 bg-white hover:bg-purple-50/50 border border-purple-100 hover:border-primary/30 rounded-2xl flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-primary/8 group-hover:scale-[1.005]">
                 <div className="flex items-center gap-5">
                    <div className={`p-3.5 rounded-xl ${
                        campaign.useCase === 'job' ? 'bg-purple-50 text-primary' : 
                        campaign.useCase === 'customer' ? 'bg-emerald-50 text-emerald-600' : 
                        'bg-amber-50 text-amber-600'
                    }`}>
                        {campaign.useCase === 'job' ? <Briefcase className="w-5 h-5" /> : 
                         campaign.useCase === 'customer' ? <Target className="w-5 h-5" /> : 
                         <Link2 className="w-5 h-5" />}
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">{campaign.name}</h4>
                        <div className="flex gap-4 text-xs font-medium text-muted-foreground">
                           <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(campaign.createdAt).toLocaleDateString()}</span>
                           <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {campaign.totalFound} Found</span>
                           {campaign.emailsFound > 0 && <span className="flex items-center gap-1 text-emerald-600"><Mail className="w-3 h-3" /> {campaign.emailsFound} Emails</span>}
                        </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1 tracking-widest">Status</p>
                        <Badge className={`font-semibold px-3 py-1 text-xs ${
                            campaign.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                            {campaign.status}
                        </Badge>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                 </div>
              </div>
            </Link>
          )) : (
            <div className="p-16 bg-white border border-dashed border-purple-200 rounded-2xl text-center flex flex-col items-center shadow-sm">
              <HistoryIcon className="w-12 h-12 text-purple-200 mb-4" />
              <p className="text-muted-foreground mb-4">No campaigns found. Start your first search now!</p>
              <Link href="/" className="text-primary font-semibold hover:underline text-sm">Launch New Search →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsTile({ label, value, color }: { label: string; value: string; color: 'purple' | 'blue' | 'green' | 'amber' }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm text-center card-lift">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest mb-2">{label}</p>
        <p className={`text-3xl font-heading ${
          color === 'purple' ? 'text-primary' :
          color === 'blue' ? 'text-sky-600' :
          color === 'green' ? 'text-emerald-600' : 'text-amber-600'
        }`}>{value}</p>
    </div>
  );
}
