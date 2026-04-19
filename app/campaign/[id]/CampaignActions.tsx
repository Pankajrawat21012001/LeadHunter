'use client';

import { Button } from "@/components/ui/button";
import { Download, RefreshCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CampaignActionsProps {
  campaignId: string;
  targetDescription: string;
  useCase: string;
}

export default function CampaignActions({ campaignId, targetDescription, useCase }: CampaignActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this campaign and all its contacts?')) {
      try {
        const res = await fetch(`/api/campaign?id=${campaignId}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success("Campaign deleted");
          router.push('/history');
        } else {
          toast.error("Failed to delete campaign");
        }
      } catch (e) {
        toast.error("An error occurred");
      }
    }
  };

  return (
    <div className="flex gap-4">
      <Link href={`/api/export?campaignId=${campaignId}`}>
        <Button variant="outline" className="h-12 px-6 rounded-xl bg-surface border-white/5 gap-2 hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </Link>
      
      <Link href={`/?q=${encodeURIComponent(targetDescription)}&useCase=${useCase}&prev=${encodeURIComponent(campaignId)}`}>
        <Button className="h-12 px-6 rounded-xl gap-2 accent-glow font-bold uppercase tracking-widest text-[10px]">
          <RefreshCcw className="w-4 h-4" />
          Find More
        </Button>
      </Link>
      
      <Button 
          variant="ghost" 
          className="h-12 px-4 rounded-xl text-error hover:bg-error/10 gap-2 border border-transparent hover:border-error/20 transition-all font-bold uppercase tracking-widest text-[10px]"
          onClick={handleDelete}
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>
    </div>
  );
}
