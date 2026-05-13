import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { prisma } from "@/lib/prisma";

interface DispatchConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  senderEmail: string;
}

/**
 * Perform full enterprise-scale dispatch orchestration with audience targeting and tracking injection.
 */
export async function processCampaignDispatch(
  campaignId: string,
  config: DispatchConfig,
) {
  console.log(`[Dispatcher] Initializing activation logic for campaign: ${campaignId}`);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-ai-school-pearl.vercel.app";

  try {
    // 1. Acquire current Campaign context and validation guard
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      console.error(`[Dispatcher] FATAL: Campaign ${campaignId} not recognized.`);
      return;
    }
    
    if (["paused", "cancelled"].includes(campaign.status)) {
       console.log(`[Dispatcher] Campaign state is '${campaign.status}'. Dispatch aborting safely.`);
       return;
    }

    // 2. Extract dynamically structured target mapping configuration
    let selectedLists: string[] = [];
    let excludedLists: string[] = [];

    try {
       if (campaign.recipients_config) {
         const configParsed = JSON.parse(campaign.recipients_config);
         selectedLists = configParsed.selectedLists || [];
         excludedLists = configParsed.excludedLists || [];
       }
    } catch (e) {
       console.warn("[Dispatcher] Failed to parse recipients_config JSON. Defaulting to broad scope fallback.");
    }

    // 3. Build absolute target query matching specific organizational cohorts
    const queryConditions: any = {
      org_id: campaign.org_id,
      status: "active", // Strict isolation: NEVER target bounced, complained, or unsubscribed contacts!
    };

    // Narrow target boundary based on explicit list inclusions
    if (selectedLists.length > 0) {
      queryConditions.lists = {
        some: {
          list_id: { in: selectedLists }
        }
      };
    }

    // Hard gate enforcement for absolute suppression matching
    if (excludedLists.length > 0) {
       const negativeConstraint = {
         lists: {
           some: {
             list_id: { in: excludedLists }
           }
         }
       };
       
       // Handle existing where syntax properly for combinations
       if (queryConditions.NOT) {
          queryConditions.AND = [ { NOT: negativeConstraint } ];
       } else {
          queryConditions.NOT = negativeConstraint;
       }
    }

    // Fetch targeted recipients
    const contacts = await prisma.contact.findMany({
      where: queryConditions,
    });

    console.log(`[Dispatcher] Identified ${contacts.length} targeted dynamic recipients for dispatch.`);

    if (contacts.length === 0) {
       console.log(`[Dispatcher] Empty audience cohort detected. Resolving cycle early.`);
       await prisma.campaign.update({ where: { id: campaignId }, data: { status: "sent" } });
       return;
    }

    // 4. Bulk seed baseline placeholder states in Database so UI registers real counts
    const existingSends = await prisma.campaignSend.findMany({
       where: { campaign_id: campaignId },
       select: { contact_id: true }
    });
    
    const existingContactIds = new Set(existingSends.map(s => s.contact_id));
    const newSeeds = contacts
      .filter(c => !existingContactIds.has(c.id))
      .map(c => ({
         campaign_id: campaignId,
         contact_id: c.id,
         status: "pending"
      }));

    if (newSeeds.length > 0) {
       await prisma.campaignSend.createMany({ data: newSeeds, skipDuplicates: true });
       console.log(`[Dispatcher] Instantiated ${newSeeds.length} CampaignSend tracking shells.`);
    }

    // Set actual transient running state
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "sending" },
    });

    // 5. Template Acquisition Pre-Flight
    let templateHtml: string | null = null;
    if (campaign.template_id) {
      const dbTemplate = await prisma.template.findUnique({
        where: { id: campaign.template_id },
      });
      if (dbTemplate) templateHtml = dbTemplate.html;
    }

    const sesClient = new SESv2Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    const BATCH_SIZE = 10;
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      
      // 🔥 ACTIVE MONITOR: Check dynamic state changes between batch execution bounds
      const stateMonitor = await prisma.campaign.findUnique({
         where: { id: campaignId },
         select: { status: true }
      });
      
      if (stateMonitor?.status === "paused" || stateMonitor?.status === "cancelled") {
         console.log(`[Dispatcher] INTERCEPT: Detected external change to ${stateMonitor.status}. Halted at iteration ${i}.`);
         break;
      }

      const batch = contacts.slice(i, i + BATCH_SIZE);
      console.log(`[Dispatcher] Batch Processing: ${i} -> ${Math.min(i + BATCH_SIZE, contacts.length)} / ${contacts.length}`);

      await Promise.all(
        batch.map(async (contact) => {
          try {
            let htmlBody =
              templateHtml ||
              `<div><h2>${campaign.subject}</h2><p>Hello {{first_name}}, this is an automated dispatch.</p></div>`;

            // Inject Basic Personalization Hooks
            htmlBody = htmlBody
              .replace(/\{\{first_name\}\}/gi, contact.first_name || "Subscriber")
              .replace(/\{\{last_name\}\}/gi, contact.last_name || "")
              .replace(/\{\{email\}\}/gi, contact.email);

            // ✅ TRACKING ENGINE 1: Dynamic Unsubscribe Mapping
            const unsubLink = `${baseUrl}/unsubscribe?uid=${contact.id}_${campaignId}`;

            // ✅ TRACKING ENGINE 2: Embedded Transparent Tracking Pixel injection
            const pixelId = `${contact.id}_${campaignId}`;
            const openTracker = `<img src="${baseUrl}/track/open?uid=${pixelId}" width="1" height="1" alt="" style="display:none!important;" />`;
            
            const unsubHtml = `<div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; font-family: sans-serif; font-size: 12px; color: #888;">
              <p>You are receiving this email because you are subscribed to our updates.</p>
              <p><a href="${unsubLink}" style="color: #888; text-decoration: underline;">Unsubscribe from this list</a></p>
            </div>`;

            if (htmlBody.includes("</body>")) {
               htmlBody = htmlBody.replace("</body>", `${unsubHtml}${openTracker}</body>`);
            } else {
               htmlBody = htmlBody + unsubHtml + openTracker;
            }

            // ✅ TRACKING ENGINE 3: Absolute Anchor Tag Rewriter (Click Wrapper)
            const clickBase = `${baseUrl}/track/click?uid=${pixelId}&url=`;
            htmlBody = htmlBody.replace(/href="([^"]*)"/gi, (match, foundUrl) => {
               // Guard conditions against tracking loops and relative system links
               if (!foundUrl || !foundUrl.startsWith("http")) return match;
               if (foundUrl.includes("/unsubscribe")) return match; 
               
               try {
                  return `href="${clickBase}${encodeURIComponent(foundUrl)}"`;
               } catch {
                  return match;
               }
            });

            // Fire the payload via AWS SES v2 pipeline
            const sendCmd = new SendEmailCommand({
              FromEmailAddress: config.senderEmail,
              Destination: { ToAddresses: [contact.email] },
              Content: {
                Simple: {
                  Subject: { Data: campaign.subject, Charset: "UTF-8" },
                  Body: { Html: { Data: htmlBody, Charset: "UTF-8" } },
                  // ✅ RFC & GOOGLE COMPLIANCE HEADERS
                  Headers: [
                    { Name: "List-Unsubscribe", Value: `<${unsubLink}>` },
                    { Name: "List-Unsubscribe-Post", Value: "List-Unsubscribe=One-Click" },
                  ],
                },
              },
              // Optional integration point for AWS Managed Configuration Sets
              // ConfigurationSetName: process.env.AWS_SES_CONFIG_SET || undefined,
            });

            const result = await sesClient.send(sendCmd);

            // Register verified execution feedback to physical database
            await prisma.campaignSend.updateMany({
              where: { campaign_id: campaignId, contact_id: contact.id },
              data: { 
                ses_message_id: result.MessageId, 
                status: "delivered",
                sent_at: new Date() 
              },
            });
            
            // Optional: Seed absolute baseline EmailEvent of "sent" for zero-loss auditing
            await prisma.emailEvent.create({
               data: {
                  contact_id: contact.id,
                  campaign_id: campaignId,
                  event_type: "sent",
               }
            });

          } catch (sesErr: any) {
            console.error(`[Dispatcher] Node Dispatch Error (${contact.email}):`, sesErr.message);
            await prisma.campaignSend.updateMany({
              where: { campaign_id: campaignId, contact_id: contact.id },
              data: { status: "failed" },
            });
          }
        }),
      );

      // Regulate loop cadence to maintain clean network topology standing
      if (i + BATCH_SIZE < contacts.length) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    // Final cycle determination
    const finalStatusCheck = await prisma.campaign.findUnique({ where: { id: campaignId } });
    
    if (finalStatusCheck?.status === "sending") {
       await prisma.campaign.update({
         where: { id: campaignId },
         data: { status: "sent" },
       });
       console.log(`[Dispatcher] ✅ ALL CYCLES SUCCESS. Final state committed: SENT.`);
    } else {
       console.log(`[Dispatcher] Cycle terminated via manual external status: ${finalStatusCheck?.status}`);
    }

  } catch (err: any) {
    console.error(`[Dispatcher] FATAL EXECUTION LOCK:`, err.message);
  }
}

