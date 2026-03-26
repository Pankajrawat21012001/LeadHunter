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
    Trash2
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaigns = readCampaigns();
  const campaign = campaigns.find(c => c.id === id);
  
  if (!campaign) notFound();
  
  const allContacts = readContacts();
  const contacts = allContacts.filter(c => c.campaignId === id);

  return (
    <div className="py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <h1 className="text-5xl font-heading tracking-tight max-w-2xl">{campaign.name}</h1>
            <div className="flex gap-4">
                <Badge className="bg-primary/20 text-primary border-primary/20 px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                  {campaign.useCase}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <Calendar className="w-4 h-4" />
                   {new Date(campaign.createdAt).toLocaleDateString()}
                </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Link href={`/api/export?campaignId=${campaign.id}`}>
              <Button variant="outline" className="h-12 px-6 rounded-xl bg-surface border-white/5 gap-2 hover:bg-white/5">
                <Download className="w-5 h-5" />
                Export CSV
              </Button>
            </Link>
            <Link href={`/?q=${encodeURIComponent(campaign.targetDescription)}&useCase=${campaign.useCase}`}>
              <Button className="h-12 px-6 rounded-xl gap-2 accent-glow">
                <RefreshCcw className="w-5 h-5" />
                Find More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
         <StatsCard 
            label="Total Found" 
            value={campaign.totalFound.toString()} 
            icon={<Users className="w-5 h-5 text-primary" />} 
         />
         <StatsCard 
            label="Emails Ready" 
            value={campaign.emailsFound.toString()} 
            icon={<Mail className="w-5 h-5 text-success" />} 
         />
         <StatsCard 
            label="Deduplicated" 
            value="Automatic" 
            icon={<LinkedinIcon className="w-5 h-5 text-primary" />} 
         />
         <StatsCard 
            label="Run Time" 
            value="~2m" 
            icon={<Calendar className="w-5 h-5 text-muted-foreground" />} 
         />
      </div>

      {/* Results Table */}
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-surface/50 p-6 rounded-2xl border border-white/5">
           <div>
              <h3 className="text-xl font-heading">Campaign Contacts</h3>
              <p className="text-sm text-muted-foreground">Detailed outreach information for each profile</p>
           </div>
           {/* Filters would go here */}
           <div className="flex gap-2">
              <Badge variant="outline" className="border-white/5 bg-secondary text-white px-4 py-2">
                All Contacts ({contacts.length})
              </Badge>
           </div>
        </div>
        
        <CampaignTable contacts={contacts} />
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon }: any) {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-secondary/50 rounded-lg">
          {icon}
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <p className="text-4xl font-heading tracking-tighter">{value}</p>
    </div>
  );
}
