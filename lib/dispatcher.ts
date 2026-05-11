import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { prisma } from "@/lib/prisma";

interface DispatchConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  senderEmail: string;
}

/**
 * Perform full enterprise-scale dispatch orchestration.
 */
export async function processCampaignDispatch(
  campaignId: string,
  config: DispatchConfig,
) {
  console.log(`[Dispatcher] Starting execution for campaign: ${campaignId}`);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://the-ai-school-pearl.vercel.app";

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error("Campaign not found");

    const contacts = await prisma.contact.findMany({
      where: {
        org_id: campaign.org_id,
        status: { not: "bounced" },
      },
    });

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
      const batch = contacts.slice(i, i + BATCH_SIZE);

      console.log(
        `[Dispatcher] Sending batch ${Math.floor(i / BATCH_SIZE) + 1}. Offset: ${i}/${contacts.length}`,
      );

      await Promise.all(
        batch.map(async (contact) => {
          try {
            let htmlBody =
              templateHtml ||
              `<div><h2>${campaign.subject}</h2><p>Hello {{first_name}}, this is a campaign.</p></div>`;

            htmlBody = htmlBody
              .replace(
                /\{\{first_name\}\}/g,
                contact.first_name || "Subscriber",
              )
              .replace(/\{\{last_name\}\}/g, contact.last_name || "")
              .replace(/\{\{email\}\}/g, contact.email);

            // Dynamic Unsubscribe links based on compliance standards
            const unsubLink = `${baseUrl}/unsubscribe?cid=${campaignId}&eid=${contact.id}`;

            const sendCmd = new SendEmailCommand({
              FromEmailAddress: config.senderEmail,
              Destination: { ToAddresses: [contact.email] },
              Content: {
                Simple: {
                  Subject: { Data: campaign.subject, Charset: "UTF-8" },
                  Body: { Html: { Data: htmlBody, Charset: "UTF-8" } },
                  // ✅ REGULATORY COMPLIANCE: Automated Gmail/Yahoo List-Unsubscribe Header Support
                  Headers: [
                    { Name: "List-Unsubscribe", Value: `<${unsubLink}>` },
                    {
                      Name: "List-Unsubscribe-Post",
                      Value: "List-Unsubscribe=One-Click",
                    },
                  ],
                },
              },
            });

            const result = await sesClient.send(sendCmd);

            // Safely log event out of band
            await prisma.campaignSend.updateMany({
              where: { campaign_id: campaignId, contact_id: contact.id },
              data: { ses_message_id: result.MessageId, status: "delivered" },
            });
          } catch (sesErr: any) {
            console.error(
              `[Dispatcher] Batch send err for ${contact.email}:`,
              sesErr.message,
            );
          }
        }),
      );

      // Subtle throttle delay between batch blocks to respect AWS SES standard rate limits (approx 1 sec)
      if (i + BATCH_SIZE < contacts.length) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    // Update final master status
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "sent" },
    });

    console.log(
      `[Dispatcher] SUCCESSFULLY completed dispatch for campaign: ${campaignId}`,
    );
  } catch (err: any) {
    console.error(
      `[Dispatcher] FATAL EXECUTION ERROR for campaign ${campaignId}:`,
      err.message,
    );
  }
}
