import { readCampaigns, readContacts } from "@/lib/csv";
import CampaignTable from "@/components/CampaignTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Download, 
    RefreshCcw, 
    ChevronLeft,
    Calendar,
    Users,
    Mail, 
    Linkedin as LinkedinIcon,
    Trash2,
    Clock
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CampaignActions from "./CampaignActions";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaigns = readCampaigns();
  const campaign = campaigns.find(c => c.id === id);
  
  if (!campaign) notFound();
  
  const allContacts = readContacts();
  const contacts = allContacts.filter(c => c.campaignId === id);

  return (
    <div className="py-10 space-y-10">
      {/* Back Link */}
      <Link href="/" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest gap-1.5 group">
        <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>
      
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-8">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 font-semibold uppercase tracking-widest text-[10px] rounded-lg">
                {campaign.useCase}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(campaign.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <h1 className="text-4xl font-heading tracking-tight text-foreground max-w-xl leading-tight">{campaign.name}</h1>
            {campaign.targetDescription && (
              <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">{campaign.targetDescription}</p>
            )}
          </div>

          <CampaignActions 
            campaignId={campaign.id} 
            targetDescription={campaign.targetDescription} 
            useCase={campaign.useCase} 
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-5">
         <StatsCard 
            label="Total Found" 
            value={campaign.totalFound.toString()} 
            icon={<Users className="w-5 h-5 text-primary" />}
            color="purple"
         />
         <StatsCard 
            label="Emails Ready" 
            value={campaign.emailsFound.toString()} 
            icon={<Mail className="w-5 h-5 text-emerald-600" />}
            color="green"
         />
         <StatsCard 
            label="Deduplicated" 
            value={(campaign.deduplicatedCount || 0).toString()} 
            icon={<LinkedinIcon className="w-5 h-5 text-sky-600" />}
            color="blue"
         />
         <StatsCard 
            label="Run Time" 
            value={`${campaign.runTimeSeconds || 0}s`} 
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            color="amber"
         />
      </div>

      {/* Results Table */}
      <div className="space-y-5">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
           <div>
              <h3 className="text-lg font-heading text-foreground">Campaign Contacts</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Detailed outreach information for each profile</p>
           </div>
           <div className="flex gap-2">
              <Badge className="bg-primary/8 text-primary border border-primary/15 px-4 py-2 rounded-xl font-semibold text-xs">
                All Contacts ({contacts.length})
              </Badge>
           </div>
        </div>
        
        <CampaignTable contacts={contacts} />
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: 'purple' | 'green' | 'blue' | 'amber' }) {
  const colorMap = {
    purple: 'bg-purple-50 border-purple-100',
    green:  'bg-emerald-50 border-emerald-100',
    blue:   'bg-sky-50 border-sky-100',
    amber:  'bg-amber-50 border-amber-100',
  };
  return (
    <div className={`bg-white p-6 rounded-2xl border shadow-sm card-lift relative overflow-hidden`}>
      {/* Subtle tinted corner */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-40 -translate-y-8 translate-x-8 ${
        color === 'purple' ? 'bg-purple-100' :
        color === 'green'  ? 'bg-emerald-100' :
        color === 'blue'   ? 'bg-sky-100' : 'bg-amber-100'
      }`} />
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-xl ${
          color === 'purple' ? 'bg-purple-50' :
          color === 'green'  ? 'bg-emerald-50' :
          color === 'blue'   ? 'bg-sky-50' : 'bg-amber-50'
        }`}>
          {icon}
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <p className="text-4xl font-heading tracking-tighter text-foreground">{value}</p>
    </div>
  );
}
