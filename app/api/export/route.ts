import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { readContacts } from '@/lib/csv';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const campaignId = url.searchParams.get('campaignId');
        
        let contacts = readContacts();
        if (campaignId) {
            contacts = contacts.filter(c => c.campaignId === campaignId);
        }

        const csv = Papa.unparse(contacts);
        const fileName = campaignId ? `campaign_${campaignId}_contacts.csv` : `all_contacts.csv`;

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename=${fileName}`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
