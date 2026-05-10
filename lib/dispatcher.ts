import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { prisma } from "@/lib/prisma";

interface DispatchConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  senderEmail: string;
}

/**
 * Perform full enterprise-scale dispatch orchestration.
 * Used by local IIFEs, queue workers, or serverless tasks uniformly.
 */
export async function processCampaignDispatch(campaignId: string, config: DispatchConfig) {
  console.log(`[Dispatcher] Starting execution for campaign: ${campaignId}`);
  
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { org: true }
    });

    if (!campaign) throw new Error("Campaign not found");

    // Get all target contacts for the org (or list specific filtered contacts)
    // Note: Future improvement - query by specific list_id instead of entire org
    const contacts = await prisma.contact.findMany({
      where: { 
        org_id: campaign.org_id,
        status: { not: "bounced" } // Skip bad records immediately
      },
    });

    let templateHtml: string | null = null;
    if (campaign.template_id) {
      const dbTemplate = await prisma.template.findUnique({
        where: { id: campaign.template_id },
      });
      if (dbTemplate) templateHtml = dbTemplate.html;
    }

    const sesClient = new SESClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    // --- EXECUTION STRATEGY: Chunked Concurrency ---
    // SES permits parallel calls up to rate limit. We will process in batches of 10 to avoid timeouts.
    const BATCH_SIZE = 10;
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);

      console.log(`[Dispatcher] Sending batch ${Math.floor(i / BATCH_SIZE) + 1}. Offset: ${i}/${contacts.length}`);

      // Fire off all 10 commands simultaneously to massively speed up delivery!
      await Promise.all(
        batch.map(async (contact) => {
          try {
            // Parse dynamic content tags
            let htmlBody = templateHtml || `<div><h2>${campaign.subject}</h2><p>Hello {{first_name}}, this is a test campaign.</p></div>`;
            
            htmlBody = htmlBody
              .replace(/\{\{first_name\}\}/g, contact.first_name || "Subscriber")
              .replace(/\{\{last_name\}\}/g, contact.last_name || "")
              .replace(/\{\{email\}\}/g, contact.email);

            const sendCmd = new SendEmailCommand({
              Source: config.senderEmail,
              Destination: { ToAddresses: [contact.email] },
              Message: {
                Subject: { Data: campaign.subject, Charset: "UTF-8" },
                Body: { Html: { Data: htmlBody, Charset: "UTF-8" } },
              },
            });

            const result = await sesClient.send(sendCmd);

            // Safely log event out of band
            await prisma.campaignSend.updateMany({
              where: { campaign_id: campaignId, contact_id: contact.id },
              data: { ses_message_id: result.MessageId, status: "delivered" },
            });

          } catch (sesErr: any) {
            console.error(`[Dispatcher] Batch send err for ${contact.email}:`, sesErr.message);
          }
        })
      );

      // Subtle throttle delay between batch blocks to respect AWS SES standard rate limits (approx 1 sec)
      if (i + BATCH_SIZE < contacts.length) {
        await new Promise((resolve) => setTimeout(resolve, 800)); 
      }
    }

    // Update final master status
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "sent" }
    });

    console.log(`[Dispatcher] SUCCESSFULLY completed dispatch for campaign: ${campaignId}`);

  } catch (err: any) {
    console.error(`[Dispatcher] FATAL EXECUTION ERROR for campaign ${campaignId}:`, err.message);
  }
}
