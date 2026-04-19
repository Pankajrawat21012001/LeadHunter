import { NextRequest, NextResponse } from 'next/server';
import { readCampaigns, readContacts } from '@/lib/csv';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const campaigns = readCampaigns();
        const campaign = campaigns.find(c => c.id === id);
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
        const allContacts = readContacts();
        const campaignContacts = allContacts.filter(c => c.campaignId === id);
        return NextResponse.json({ ...campaign, contacts: campaignContacts });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
