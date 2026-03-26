import { NextRequest, NextResponse } from 'next/server';
import { readCampaigns } from '@/lib/csv';

export async function GET() {
    try {
        const campaigns = readCampaigns();
        // Sort by createdAt desc
        const sorted = campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return NextResponse.json(sorted);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
