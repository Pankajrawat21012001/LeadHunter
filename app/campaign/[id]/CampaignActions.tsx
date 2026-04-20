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
  filtersJson?: string;
}

export default function CampaignActions({ campaignId, targetDescription, useCase, filtersJson }: CampaignActionsProps) {
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

  // Build the "Find More" URL — pass all original filter state so SearchForm can restore it
  const findMoreUrl = (() => {
    const params = new URLSearchParams();
    params.set('useCase', useCase);
    params.set('prev', campaignId);
    params.set('q', targetDescription); // Fallback for old campaigns
    if (filtersJson) params.set('filters', filtersJson);
    return `/?${params.toString()}`;
  })();

  return (
    <div className="flex gap-3 items-center">
      <Link href={`/api/export?campaignId=${campaignId}`}>
        <Button
          variant="outline"
          className="h-10 px-5 rounded-xl bg-white border-purple-200 text-foreground hover:bg-purple-50 hover:border-primary/30 gap-2 font-semibold text-xs transition-all shadow-sm"
        >
          <Download className="w-4 h-4 text-primary" />
          Export CSV
        </Button>
      </Link>

      <Link href={findMoreUrl}>
        <Button
          className="h-10 px-5 rounded-xl gap-2 font-semibold text-xs accent-glow bg-primary hover:bg-primary/90 text-white shadow-sm transition-all"
        >
          <RefreshCcw className="w-4 h-4" />
          Find More
        </Button>
      </Link>

      <Button
        variant="ghost"
        className="h-10 px-4 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 gap-2 border border-transparent hover:border-red-200 transition-all font-semibold text-xs"
        onClick={handleDelete}
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>
    </div>
  );
}
