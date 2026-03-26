import { NextRequest, NextResponse } from 'next/server';
import { readContacts, updateContactStatus } from '@/lib/csv';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const campaignId = url.searchParams.get('campaignId');
        let contacts = readContacts();
        if (campaignId) {
            contacts = contacts.filter(c => c.campaignId === campaignId);
        }
        // Sort by foundAt desc
        contacts.sort((a, b) => new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime());
        return NextResponse.json(contacts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { id, status } = await req.json();
        updateContactStatus(id, status);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
