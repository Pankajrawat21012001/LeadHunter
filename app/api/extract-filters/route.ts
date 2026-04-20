import { NextRequest, NextResponse } from 'next/server';
import { callGroq } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
    try {
        const { description } = await req.json();
        if (!description) return NextResponse.json({ error: 'No description' }, { status: 400 });

        const prompt = `
Extract structured search filters from this natural language LinkedIn search request.

Request: "${description}"

Return a JSON object matching this structure:
{
  "roles": ["string"],
  "industries": ["string"],
  "locations": ["string"],
  "companyStage": "startup" | "enterprise" | "mid-size" | "any",
  "companySize": "string" | null,
  "signals": ["string"],
  "seniority": "C-level" | "Director" | "Manager" | "IC" | "any"
}

Rules:
- Be precise.
- "based in XXX" or "in XXX" for location.
- "in XXX industry" for industry.
- "startup companies" -> companyStage: "startup".
- Only return the JSON. No explanation.
`;

        const result = await callGroq(prompt, true, 'llama-3.1-8b-instant');
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
