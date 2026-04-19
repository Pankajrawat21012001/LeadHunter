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
                
                const booleanPrompt = `
You are an expert at finding people on LinkedIn via Google search.

User wants to find: "${targetDescription}"
Use case: ${useCase}
${previousQuery ? `IMPORTANT: The previous search used this query: "${previousQuery}". Generate a DIFFERENT variation that will find NEW people not found before. Change the job titles, add different keywords, or restructure the boolean logic.` : ""}

Generate a Google Boolean search string to find LinkedIn profiles of these people.

Rules:
- MUST start with: site:linkedin.com/in
- Use OR for multiple job titles
- Use quotes for exact phrases
- Exclude job postings: add -job -jobs -hiring -"job description"
- IMPORTANT: If possible, try to find profiles that might have emails in their snippets. You can add "( "email" OR "@gmail.com" OR "@outlook.com" OR "contact" )" if it helps find profiles with contact info in the public snippet.
- Keep it under 250 characters
- Make it specific enough to find real individual profiles

Return ONLY the search string. Nothing else. No explanation.
`;
                const booleanQuery = await callGroq(booleanPrompt);
                sendEvent({ step: 1, status: "done", message: "Generated search query", data: { booleanQuery } });

                // Step 2: Search Google (Serper.dev)
                sendEvent({ step: 2, status: "running", message: "Searching the internet..." });
                let allResults: any[] = [];
                let pageCount = 1;
                while (allResults.length < targetCount && pageCount <= 5) {
                  const results = await serperSearch(booleanQuery, pageCount);
                  const filtered = results.filter((r: any) => r.link && r.link.includes('linkedin.com/in/'));
                  allResults = [...allResults, ...filtered];
                  sendEvent({ step: 2, status: "running", message: `Found ${allResults.length} profiles...`, data: { count: allResults.length } });
                  if (results.length < 10) break;
                  pageCount++;
                  await delay(200);
                }
                const limitedResults = allResults.slice(0, targetCount);
                sendEvent({ step: 2, status: "done", message: `Found ${limitedResults.length} LinkedIn profiles`, data: { count: limitedResults.length } });

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
  "fullName": "First Last or null",
  "jobTitle": "their job title or null",
  "company": "company name or null",
  "companyDomain": "best guess domain like company.com or null",
  "linkedinUrl": "the full LinkedIn URL",
  "email": "any email address found in snippet/title or null"
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
                  await delay(200);
                }
                sendEvent({ step: 3, status: "done", message: `Extracted ${extractedContacts.length} contacts` });

                // Step 4: Deduplication check
                sendEvent({ step: 4, status: "running", message: "Removing duplicates..." });
                const existingUrls = getExistingUrls();
                const newContactsRaw = extractedContacts.filter(c => c.linkedinUrl && !existingUrls.has(c.linkedinUrl));
                const removedCount = extractedContacts.length - newContactsRaw.length;
                sendEvent({ step: 4, status: "done", message: `Removed ${removedCount} duplicates. Processing ${newContactsRaw.length} new people.`, data: { newCount: newContactsRaw.length } });

                // Step 5: Process extracted emails (Replaces Skrapp)
                let emailsFound = 0;
                newContactsRaw.forEach(c => {
                  if (c.email && c.email !== 'null') {
                    emailsFound++;
                    c.emailStatus = "found";
                  } else {
                    c.email = "";
                    c.emailStatus = "not_found";
                  }
                });
                const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                sendEvent({ step: 5, status: "done", message: `Found ${emailsFound} emails in search results` });

                // Step 6: Generate Messages (Groq)
                if ((needs.linkedinMessage || (needs.coldEmail && emailsFound > 0)) && newContactsRaw.length > 0) {
                  sendEvent({ step: 6, status: "running", message: "Writing personalized messages..." });
                  for (let i = 0; i < newContactsRaw.length; i += 3) {
                    const batch = newContactsRaw.slice(i, i + 3);
                    const batchPromises = batch.map(async (contact: any) => {
                      const msgPromises: Promise<any>[] = [];
                      if (needs.linkedinMessage) {
                        msgPromises.push(callGroq(getLinkedinPrompt(targetDescription, contact, senderContext)));
                      } else {
                        msgPromises.push(Promise.resolve(""));
                      }

                      if (needs.coldEmail && contact.email) {
                        msgPromises.push(callGroq(getColdEmailPrompt(targetDescription, useCase, contact, senderContext), true));
                      } else {
                        msgPromises.push(Promise.resolve(null));
                      }

                      const [liMsg, ceMsg] = await Promise.all(msgPromises);
                      contact.linkedinMessage = liMsg;
                      contact.coldEmail = ceMsg ? JSON.stringify(ceMsg) : "";
                    });
                    await Promise.all(batchPromises);
                    sendEvent({ step: 6, status: "running", message: `Wrote messages for ${Math.min(i + 3, newContactsRaw.length)} people...` });
                    await delay(300);
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
