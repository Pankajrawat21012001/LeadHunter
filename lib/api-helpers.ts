import { Contact, UseCase } from './types';

// Helper for delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Groq API call helper
export const callGroq = async (prompt: string, jsonResponse: boolean = false) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not set');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            response_format: jsonResponse ? { type: 'json_object' } : undefined,
            temperature: 0.1,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${error}`);
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
export const getLinkedinPrompt = (targetDescription: string, contact: any, senderContext?: string) => `
Write a LinkedIn connection request message from ${senderContext || 'me'} 
to ${contact.fullName} who is ${contact.jobTitle} at ${contact.company}.

Use case context: ${targetDescription}

STRICT RULES:
- Maximum 300 characters (hard limit)
- Sound human, curious, genuine
- NO selling, NO pitching
- ONE specific reason you want to connect
- End with a light question or statement

Return ONLY the message text. Count characters carefully.
`;

export const getColdEmailPrompt = (targetDescription: string, useCase: UseCase, contact: any, senderContext?: string) => `
Write a short cold email to ${contact.fullName}, ${contact.jobTitle} at ${contact.company}.

From: ${senderContext || 'me'}
Purpose: ${targetDescription}
Use case: ${useCase}

RULES:
- Subject line included
- Max 100 words in body
- First sentence about THEM, not you
- ONE soft call to action at the end
- No "I hope this email finds you well"
- No "opportunity"
- Sound like a real person

Return ONLY this JSON (no markdown):
{"subject": "...", "body": "..."}
`;
