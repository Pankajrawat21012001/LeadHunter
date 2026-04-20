import { Contact, UseCase } from './types';

// Bypass SSL verification issues locally (often needed behind corporate proxies/antivirus)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// Helper for delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Groq API call helper with retry logic and rate-limit awareness
export const callGroq = async (
    prompt: string,
    jsonResponse: boolean = false,
    model: string = 'llama-3.1-8b-instant',
    maxRetries: number = 4
) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not set');

    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                response_format: jsonResponse ? { type: 'json_object' } : undefined,
                temperature: 0.1,
            }),
        });

        // Rate limited — wait and retry with exponential backoff
        if (response.status === 429) {
            // Try to read Retry-After header from Groq response
            let waitMs = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
            try {
                const errBody = await response.json();
                // Groq sometimes embeds a wait time in the message
                const match = errBody?.error?.message?.match(/try again in (\d+\.?\d*)s/i);
                if (match) waitMs = Math.ceil(parseFloat(match[1]) * 1000) + 500;
            } catch (_) { /* ignore */ }
            console.warn(`[Groq] Rate limit hit. Waiting ${Math.round(waitMs)}ms (attempt ${attempt + 1}/${maxRetries})...`);
            await delay(waitMs);
            continue;
        }

        if (!response.ok) {
            const error = await response.text();
            lastError = new Error(`Groq API error: ${error}`);
            // Non-429 errors: break out immediately
            break;
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        if (jsonResponse) {
            try {
                return JSON.parse(content);
            } catch (e) {
                console.error('Failed to parse Groq JSON response:', content);
                throw new Error('Invalid JSON from Groq');
            }
        }

        return content.trim();
    }

    throw lastError ?? new Error('Groq: Max retries exceeded due to rate limiting');
};

// Serper API call helper
export const serperSearch = async (query: string, page: number = 1) => {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) throw new Error('SERPER_API_KEY is not set');

    const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            q: query,
            num: 10,
            page: page,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Serper API error: ${error}`);
    }

    const data = await response.json();
    return data.organic || [];
};

// Message generation prompts
export const getLinkedinPrompt = (targetDescription: string, contact: any, senderContext?: string, filters?: any) => `
Write a LinkedIn connection request message.

From: ${senderContext || 'me'}
To: ${contact.fullName}, ${contact.jobTitle} at ${contact.company}

Why connecting: ${targetDescription}
Their profile context: industry=${filters?.industries?.join(', ') || 'unknown'}, stage=${filters?.companyStage || 'unknown'}, seniority=${filters?.seniority || 'unknown'}

STRICT RULES:
- Maximum 300 characters (hard limit, count carefully)
- Sound human and genuine, NOT like a bot
- Reference something specific about their role or company context
- NO selling, NO pitching, NO buzzwords
- ONE clear reason to connect
- End with a light question or open statement

Return ONLY the message text. No quotes, no explanation.
`;

export const getColdEmailPrompt = (targetDescription: string, useCase: UseCase, contact: any, senderContext?: string, filters?: any) => `
Write a cold email to ${contact.fullName}, ${contact.jobTitle} at ${contact.company}.

From: ${senderContext || 'me'}
Purpose: ${targetDescription}
Their context: industry=${filters?.industries?.join(', ') || 'unknown'}, company stage=${filters?.companyStage || 'unknown'}
Use case: ${useCase}

RULES:
- Include a subject line
- Max 100 words in body
- First sentence must be about THEM specifically (their role, company, or industry)
- Use the company stage and industry context to make it relevant
- ONE soft call to action at the end
- No "I hope this email finds you well"
- No "opportunity"  
- Sound like a real person, not a template

Return ONLY this JSON (no markdown):
{"subject": "...", "body": "..."}
`;
