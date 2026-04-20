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
    maxRetries: number = 7
) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not set');

    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
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
                let waitMs = Math.pow(2, attempt) * 3000 + Math.random() * 2000;
                try {
                    const errBody = await response.json();
                    // Groq sometimes embeds a wait time in the message
                    const match = errBody?.error?.message?.match(/try again in (\d+\.?\d*)s/i);
                    if (match) {
                        waitMs = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
                    }
                } catch (_) { /* ignore */ }

                console.warn(`[Groq] Rate limit hit (${model}). Waiting ${Math.round(waitMs)}ms (attempt ${attempt + 1}/${maxRetries})...`);
                await delay(waitMs);
                continue;
            }

            if (!response.ok) {
                const error = await response.text();
                lastError = new Error(`Groq API error: ${error}`);
                // If it's a transient 5xx error, we might want to retry too, but let's stick to 429 for now
                if (response.status >= 500 && attempt < maxRetries - 1) {
                    await delay(2000);
                    continue;
                }
                break;
            }

            const data = await response.json();
            let content = data.choices[0].message.content;

            if (jsonResponse) {
                try {
                    return JSON.parse(content);
                } catch (e) {
                    console.error('Failed to parse Groq JSON response:', content);
                    // If JSON parse fails, maybe retry?
                    if (attempt < maxRetries - 1) {
                        await delay(1000);
                        continue;
                    }
                    throw new Error('Invalid JSON from Groq');
                }
            }

            return content.trim();
        } catch (e: any) {
            lastError = e;
            console.error(`[Groq] Request failed (attempt ${attempt + 1}):`, e.message);
            if (attempt < maxRetries - 1) {
                await delay(Math.pow(2, attempt) * 2000);
                continue;
            }
            break;
        }
    }

    throw lastError ?? new Error('Groq: Max retries exceeded due to rate limiting');
};

// Serper API call helper
export const serperSearch = async (query: string, page: number = 1, gl?: string) => {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) throw new Error('SERPER_API_KEY is not set');

    const body: any = {
        q: query,
        num: 10,
        page: page,
    };

    if (gl) body.gl = gl;

    const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Serper API error: ${error}`);
    }

    const data = await response.json();
    return data.organic || [];
};

// ── Use-case context helpers ──────────────────────────────────────────────
const useCaseContext = {
    job: {
        senderRole: 'a job seeker',
        linkedinGoal: 'you are looking for a job opportunity and want to connect with this hiring manager or recruiter',
        linkedinTone: 'professional, enthusiastic about the company, NOT desperate',
        linkedinDo: [
            'Mention a specific thing you admire about the company or their team',
            'Drop one concrete skill or achievement that is relevant to their stack/domain',
            'End with a light ask — e.g. "Would love to learn more about your team."',
        ],
        linkedinDont: [
            'Never say "I am looking for a job"',
            'Never beg or sound desperate',
            'No "I saw your job posting" — keep it warm and human',
        ],
        emailGoal: 'position yourself as a strong candidate and get a reply / referral / intro call',
        emailTone: 'confident, concise, shows you did your homework on them',
        emailSubjectHint: 'Subject should feel relevant, not generic — e.g. "Your [company] engineering journey" or "Background in [skill] — thought you might appreciate"',
        emailCTAHint: 'Soft CTA: "Would love to chat — happy to share my work if helpful."',
    },
    customer: {
        senderRole: 'a founder / salesperson',
        linkedinGoal: 'you are pitching a product or service that solves a specific pain point relevant to their role',
        linkedinTone: 'direct but respectful, no hype, concrete value-first',
        linkedinDo: [
            'Lead with a problem they likely face given their role and company stage',
            'One sentence on how your solution helps — no jargon',
            'End with an easy yes/no question: "Does this resonate?"',
        ],
        linkedinDont: [
            'No "I wanted to reach out"',
            'No "game-changing" or "revolutionary"',
            'No long pitches — 300 chars max',
        ],
        emailGoal: 'book a 15-minute discovery call or get them to reply expressing interest',
        emailTone: 'consultative, insight-led, not pushy',
        emailSubjectHint: 'Subject should hint at a pain or insight — e.g. "Reducing churn for [industry] teams" or "Quick question about [company]\'s [pain area]"',
        emailCTAHint: 'CTA: "Worth a 15-min call?" or "Happy to share a quick demo if useful."',
    },
    connection: {
        senderRole: 'a professional looking to network',
        linkedinGoal: 'you want to build a genuine professional relationship, no immediate ask',
        linkedinTone: 'warm, curious, genuine — like a real person not a bot',
        linkedinDo: [
            'Reference something specific about their work, background, or company',
            'State one genuine reason why you find their work interesting',
            'End with an open, low-pressure question related to their expertise',
        ],
        linkedinDont: [
            'No pitching anything',
            'No "Let me know if I can be of value"',
            'No vague "I would love to connect" without context',
        ],
        emailGoal: 'spark a real conversation, share mutual value, explore collaboration or advice',
        emailTone: 'curious, peer-to-peer, intellectually engaging',
        emailSubjectHint: 'Subject should feel personal — e.g. "Your work on [topic]" or "Fellow [industry] practitioner"',
        emailCTAHint: 'CTA: "Would love to hear your thoughts — no obligation." or "Open to a brief virtual chat sometime?"',
    },
};

// Message generation prompts
export const getLinkedinPrompt = (targetDescription: string, contact: any, senderContext?: string, filters?: any, useCase: UseCase = 'connection') => {
    const ctx = useCaseContext[useCase];
    return `
You are writing a LinkedIn connection request message on behalf of ${ctx.senderRole}.

SENDER: ${senderContext || 'a professional'}
RECIPIENT: ${contact.fullName}, ${contact.jobTitle} at ${contact.company || 'their company'}
RECIPIENT CONTEXT: industry=${filters?.industries?.join(', ') || 'unknown'}, stage=${filters?.companyStage || 'unknown'}, seniority=${filters?.seniority || 'unknown'}

GOAL: ${ctx.linkedinGoal}
TONE: ${ctx.linkedinTone}

MUST DO:
${ctx.linkedinDo.map((d, i) => `${i + 1}. ${d}`).join('\n')}

MUST NOT:
${ctx.linkedinDont.map((d, i) => `${i + 1}. ${d}`).join('\n')}

ADDITIONAL CONTEXT: ${targetDescription}

HARD RULES:
- Maximum 300 characters TOTAL (count carefully — LinkedIn enforces this)
- NEVER start with "Hi [name]" — jump into the message
- Sound 100% human, NOT like a template
- ONE tight, clear message — no filler

Return ONLY the message text. No quotes, no labels, no explanation.
`;
};

export const getColdEmailPrompt = (targetDescription: string, useCase: UseCase, contact: any, senderContext?: string, filters?: any) => {
    const ctx = useCaseContext[useCase];
    return `
You are writing a cold email on behalf of ${ctx.senderRole}.

SENDER: ${senderContext || 'a professional'}
RECIPIENT: ${contact.fullName}, ${contact.jobTitle} at ${contact.company || 'their company'}
RECIPIENT CONTEXT: industry=${filters?.industries?.join(', ') || 'unknown'}, company stage=${filters?.companyStage || 'unknown'}
ADDITIONAL CONTEXT: ${targetDescription}

GOAL: ${ctx.emailGoal}
TONE: ${ctx.emailTone}
SUBJECT GUIDANCE: ${ctx.emailSubjectHint}
CTA GUIDANCE: ${ctx.emailCTAHint}

RULES:
- Subject line must feel personal, relevant, NOT generic
- Body: max 100 words
- First sentence MUST be about THEM (their role, company, or a specific insight)
- Use company stage and industry to make it ultra-relevant
- ${ctx.emailCTAHint}
- NEVER say "I hope this email finds you well"
- NEVER use the word "opportunity"
- Sound like a real human wrote this, not an AI template

Return ONLY this JSON (no markdown, no explanation):
{"subject": "...", "body": "..."}
`;
};

