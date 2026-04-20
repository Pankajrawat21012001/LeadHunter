import { NextRequest, NextResponse } from 'next/server';
import { SearchRequest, Contact, Campaign } from '@/lib/types';
import { 
    callGroq, 
    serperSearch, 
    delay, 
    getLinkedinPrompt, 
    getColdEmailPrompt 
} from '@/lib/api-helpers';
import { getExistingUrls, appendContacts, saveCampaign, ensureDataDir } from '@/lib/csv';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    ensureDataDir();
    const searchParams: SearchRequest = await req.json();
    const { targetDescription, useCase, needs, targetCount, senderContext, previousQuery } = searchParams;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (event: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            };

            try {
                // Step 1: Understand + Generate Boolean Search (Groq)
                const startTime = Date.now();
                sendEvent({ step: 1, status: "running", message: "Understanding who you need..." });
                
                const filterExtractionPrompt = `
Extract structured search filters from this description: "${targetDescription}"

Return ONLY this JSON with no explanation:
{
  "roles": ["list of job titles mentioned or implied"],
  "industries": ["list of industries or sectors"],
  "locations": ["list of countries or cities"],
  "companyStage": "startup or enterprise or mid-size or any",
  "companySize": "employee range if mentioned or null",
  "signals": ["extra intent keywords like fundraising, hiring, scaling"],
  "seniority": "C-level or Director or Manager or IC or any"
}

Rules:
- Never invent filters not present in the description
- If something is not mentioned, use null
- For roles, always include common synonyms (e.g. "CEO" → also add "Founder", "Co-Founder")
`;

                const filters = await callGroq(filterExtractionPrompt, true, 'llama-3.3-70b-versatile');
                sendEvent({ step: 1, status: "running", message: "Parsed filters from your description...", data: { filters } });

                const booleanPrompt = `
You are an expert at finding LinkedIn profiles via Google search.

Target profile:
- Roles: ${filters.roles?.join(' OR ') || 'any'}
- Industries: ${filters.industries?.join(', ') || 'any'}
- Locations: ${filters.locations?.join(' OR ') || 'any'}
- Company stage: ${filters.companyStage || 'any'}
- Company size: ${filters.companySize || 'any'}
- Signals/keywords: ${filters.signals?.join(', ') || 'none'}
- Seniority: ${filters.seniority || 'any'}

${previousQuery ? `IMPORTANT: Previous query was: "${previousQuery}". Generate a DIFFERENT variation to find NEW people. Change job title synonyms, restructure logic.` : ""}

Generate a Google Boolean search string to find LinkedIn profiles.

Rules:
- MUST start with: site:linkedin.com/in
- Use OR between all role/title variants in parentheses
- MUST include location terms if provided
- MUST include industry/niche keywords if provided
- Include signal keywords if they help filter intent
- Exclude: -job -jobs -hiring -"job description"
- Under 250 characters
- Target real individual profiles, not company pages

Return ONLY the search string. Nothing else.
`;
                const booleanQuery = await callGroq(booleanPrompt, false, 'llama-3.3-70b-versatile');
                sendEvent({ step: 1, status: "done", message: "Generated search query", data: { booleanQuery } });

                // Step 2: Search Google (Serper.dev)
                sendEvent({ step: 2, status: "running", message: "Generating search variations..." });

                // Generate a second query variation
                const booleanPrompt2 = booleanPrompt + `\nThis must be a DIFFERENT variation from the first. Use different synonyms for job titles, reorder terms, or use different industry keywords to find different profiles.`;
                const booleanQuery2 = await callGroq(booleanPrompt2, false, 'llama-3.3-70b-versatile');

                sendEvent({ step: 2, status: "running", message: "Searching with multiple queries..." });

                let allResults: any[] = [];
                let pageCount = 1;

                while (allResults.length < targetCount && pageCount <= 4) {
                  const [results1, results2] = await Promise.all([
                    serperSearch(booleanQuery, pageCount),
                    serperSearch(booleanQuery2, pageCount),
                  ]);

                  const combined = [...results1, ...results2];
                  const seen = new Set<string>();
                  const deduped = combined.filter((r: any) => {
                    if (!r.link || !r.link.includes('linkedin.com/in/') || seen.has(r.link)) return false;
                    seen.add(r.link);
                    return true;
                  });

                  allResults = [...allResults, ...deduped];
                  sendEvent({ step: 2, status: "running", message: `Found ${allResults.length} profiles...`, data: { count: allResults.length } });

                  if (results1.length < 10 && results2.length < 10) break;
                  pageCount++;
                  await delay(200);
                }

                const limitedResults = allResults.slice(0, targetCount);
                sendEvent({ step: 2, status: "done", message: `Found ${limitedResults.length} LinkedIn profiles across ${pageCount} pages`, data: { count: limitedResults.length, queries: [booleanQuery, booleanQuery2] } });

                // Step 3: Extract contact details (Groq)
                sendEvent({ step: 3, status: "running", message: "Extracting contact details..." });
                const extractedContacts: any[] = [];
                const batchSize = 5;
                for (let i = 0; i < limitedResults.length; i += batchSize) {
                  const batch = limitedResults.slice(i, i + batchSize);
                  const batchPromises = batch.map(async (result: any) => {
                    const extractPrompt = `
From this Google search result of a LinkedIn profile, extract contact details. Look closely at the snippet for any mentioned email addresses.

Title: "${result.title}"
Snippet: "${result.snippet}"
URL: "${result.link}"

Extract and return ONLY this JSON (no explanation, no markdown):
{
  "fullName": "Full name of the person (required)",
  "jobTitle": "Job title or role (e.g. CEO, Founder)",
  "company": "Full company name (not just 'null')",
  "companyDomain": "The most likely website domain for this company (e.g. apple.com). Guess based on company name if not explicitly present.",
  "linkedinUrl": "The full LinkedIn URL provided",
  "email": "Any email address explicitly mentioned (check for [at] or [dot] variations) or null"
}
`;
                    try {
                      const details = await callGroq(extractPrompt, true);
                      return details;
                    } catch (e) {
                      console.error('Failed to extract contact info:', e);
                      return null;
                    }
                  });
                  const results = await Promise.all(batchPromises);
                  extractedContacts.push(...results.filter(Boolean));
                  sendEvent({ step: 3, status: "running", message: `Extracted ${extractedContacts.length} contacts...` });
                  await delay(500); // Increased delay
                }
                sendEvent({ step: 3, status: "done", message: `Extracted ${extractedContacts.length} contacts` });

                // Step 4: Deduplication check
                sendEvent({ step: 4, status: "running", message: "Removing duplicates..." });
                const existingUrls = getExistingUrls();
                const newContactsRaw = extractedContacts.filter(c => c.linkedinUrl && !existingUrls.has(c.linkedinUrl));
                const removedCount = extractedContacts.length - newContactsRaw.length;
                sendEvent({ step: 4, status: "done", message: `Removed ${removedCount} duplicates. Processing ${newContactsRaw.length} new people.`, data: { newCount: newContactsRaw.length } });

                // Step 5: Email Discovery (Deep Search)
                if (needs.email && newContactsRaw.length > 0) {
                    sendEvent({ step: 5, status: "running", message: "Searching for missing emails..." });
                    
                    const emailBatchSize = 3;
                    for (let i = 0; i < newContactsRaw.length; i += emailBatchSize) {
                        const batch = newContactsRaw.slice(i, i + emailBatchSize);
                        const discoveryPromises = batch.map(async (contact: any) => {
                            if (contact.email && contact.email !== 'null' && contact.email.includes('@')) {
                                contact.emailStatus = "found";
                                return;
                            }

                            // Strategy: Two targeted searches for the best chance of finding the email
                            // 1. LinkedIn profile + "email" keyword (often extracts from snippet even if not on page)
                            // 2. Name + Company + Domain search
                            const domain = contact.companyDomain || contact.company.replace(/\s+/g, '').toLowerCase() + '.com';
                            const discoveryQueries = [
                                `site:linkedin.com/in/${contact.linkedinUrl.split('/in/')[1]?.split('/')[0]} "email"`,
                                `"${contact.fullName}" "${contact.company}" email OR "@${domain}"`
                            ];

                            try {
                                for (const query of discoveryQueries) {
                                    const discoveryResults = await serperSearch(query, 1);
                                    if (discoveryResults.length > 0) {
                                        const snippets = discoveryResults.map((r: any) => `${r.title}: ${r.snippet}`).join('\n\n');
                                        const findEmailPrompt = `
Extract the professional email address for ${contact.fullName} from these search results.
Focus on patterns like name@company.com or emails mentioned in bio/snippets.

Search Results:
${snippets}

Return ONLY the email address or "null". No explanation.
`;
                                        const foundEmail = await callGroq(findEmailPrompt);
                                        const cleanEmail = foundEmail?.toLowerCase()?.trim()?.replace(/["']/g, '');
                                        
                                        if (cleanEmail && cleanEmail.includes('@') && cleanEmail.includes('.') && !cleanEmail.includes(' ')) {
                                            contact.email = cleanEmail;
                                            contact.emailStatus = "found";
                                            break; // Found it, stop searching
                                        }
                                    }
                                    await delay(300); // Be gentle between discovery queries
                                }
                                
                                if (!contact.email) {
                                    contact.email = "";
                                    contact.emailStatus = "not_found";
                                }
                            } catch (e) {
                                console.error(`Discovery failed for ${contact.fullName}:`, e);
                            }
                        });

                        await Promise.all(discoveryPromises);
                        sendEvent({ step: 5, status: "running", message: `Checked ${Math.min(i + emailBatchSize, newContactsRaw.length)} contacts for emails...` });
                        await delay(600);
                    }
                }

                let emailsFound = newContactsRaw.filter(c => c.emailStatus === "found").length;
                const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                sendEvent({ step: 5, status: "done", message: `Found ${emailsFound} emails total` });

                // Step 6: Generate Messages (Groq)
                if ((needs.linkedinMessage || needs.coldEmail) && newContactsRaw.length > 0) {
                  sendEvent({ step: 6, status: "running", message: "Writing personalized messages..." });
                  const batchSize = 2; // Smaller batch size for message generation
                  for (let i = 0; i < newContactsRaw.length; i += batchSize) {
                    const batch = newContactsRaw.slice(i, i + batchSize);
                    const batchPromises = batch.map(async (contact: any) => {
                      const msgPromises: Promise<any>[] = [];
                      if (needs.linkedinMessage) {
                        msgPromises.push(callGroq(getLinkedinPrompt(targetDescription, contact, senderContext, filters)));
                      } else {
                        msgPromises.push(Promise.resolve(""));
                      }

                      if (needs.coldEmail) {
                        msgPromises.push(callGroq(getColdEmailPrompt(targetDescription, useCase, contact, senderContext, filters), true));
                      } else {
                        msgPromises.push(Promise.resolve(null));
                      }

                      const [liMsg, ceMsg] = await Promise.all(msgPromises);
                      contact.linkedinMessage = liMsg;
                      contact.coldEmail = ceMsg ? JSON.stringify(ceMsg) : "";
                    });
                    await Promise.all(batchPromises);
                    sendEvent({ step: 6, status: "running", message: `Wrote messages for ${Math.min(i + batchSize, newContactsRaw.length)} people...` });
                    await delay(800); // Increased delay between batches
                  }
                  sendEvent({ step: 6, status: "done", message: "Messages written" });
                } else {
                  newContactsRaw.forEach(c => {
                    c.linkedinMessage = "";
                    c.coldEmail = "";
                  });
                  sendEvent({ step: 6, status: "done", message: "Message writing skipped" });
                }

                // Step 7: Saving results
                sendEvent({ step: 7, status: "running", message: "Saving results..." });
                
                const contactsToSave: Contact[] = newContactsRaw.map(c => ({
                  id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  campaignId,
                  fullName: c.fullName || "Unknown",
                  jobTitle: c.jobTitle || "Unknown",
                  company: c.company || "Unknown",
                  linkedinUrl: c.linkedinUrl,
                  email: c.email || "",
                  emailStatus: c.emailStatus || "not_searched",
                  linkedinMessage: c.linkedinMessage || "",
                  coldEmail: c.coldEmail || "",
                  status: "pending",
                  foundAt: new Date().toISOString(),
                  useCase,
                  source: "serper+groq"
                }));

                appendContacts(contactsToSave);

                const runTimeSeconds = Math.round((Date.now() - startTime) / 1000);
                
                const campaign: Campaign = {
                  id: campaignId,
                  name: `Search: ${targetDescription}`,
                  useCase,
                  targetDescription,
                  booleanQuery,
                  totalFound: contactsToSave.length,
                  emailsFound,
                  status: "completed",
                  createdAt: new Date(startTime).toISOString(),
                  completedAt: new Date().toISOString(),
                  deduplicatedCount: removedCount || 0,
                  runTimeSeconds
                };

                saveCampaign(campaign);
                sendEvent({ step: 7, status: "done", message: `Saved to CSV in ${runTimeSeconds}s` });

                sendEvent({ 
                    step: 0, 
                    status: "complete", 
                    message: `Done! Found ${contactsToSave.length} new people`, 
                    data: { campaignId } 
                });

                controller.close();
            } catch (error: any) {
                console.error('Search pipeline error:', error);
                sendEvent({ step: -1, status: "error", message: `Search failed: ${error.message}` });
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
