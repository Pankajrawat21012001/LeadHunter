import { NextRequest, NextResponse } from 'next/server';
import { readCampaigns, overwriteCampaigns, readContacts } from '@/lib/csv';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.csv');

export async function DELETE(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        // 1. Remove campaign
        const campaigns = readCampaigns();
        const updatedCampaigns = campaigns.filter(c => c.id !== id);
        overwriteCampaigns(updatedCampaigns);

        // 2. Remove associated contacts
        const allContacts = readContacts();
        const updatedContacts = allContacts.filter(c => c.campaignId !== id);
        fs.writeFileSync(CONTACTS_FILE, Papa.unparse(updatedContacts));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
