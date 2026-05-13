import { NextRequest, NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { enforceRole } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    await enforceRole(req, ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]);
    const body = await req.json();
    const { to, subject, html } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Recipient and subject are required" },
        { status: 400 },
      );
    }

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || "eu-north-1";
    const senderEmail = process.env.AWS_SENDER_EMAIL;

    if (!accessKeyId || !secretAccessKey || !senderEmail) {
      return NextResponse.json(
        {
          error:
            "AWS credentials or sender email are not fully configured in .env",
        },
        { status: 500 },
      );
    }

    const sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const dummyUnsubLink = `${baseUrl}/unsubscribe?uid=demo-contact-id_demo-campaign-id`;
        
        let finalHtml = html || `
          <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #111;">Test Dispatch Successful! 🚀</h2>
            <p>Hello,</p>
            <p>This is a real-time, live email sent from your newly integrated AWS SES SMTP provider on <strong>PulseSend</strong>!</p>
            <p>Your API keys, sending identities, and database tables are now fully working and production ready.</p>
          </div>
        `;

        // Fix unclickable relative unsubscribe links hardcoded in templates for test sends
        finalHtml = finalHtml
          .replace(/\{\{uid\}\}/gi, "demo-contact-id_demo-campaign-id")
          .replace(/href="\/unsubscribe/gi, `href="${baseUrl}/unsubscribe`);

        const unsubHtml = `
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; font-family: sans-serif; font-size: 12px; color: #888;">
            <p>You are receiving this email because you are subscribed to our updates.</p>
            <p><a href="${dummyUnsubLink}" style="color: #888; text-decoration: underline;">Unsubscribe from this list</a></p>
          </div>
        `;

        if (finalHtml.includes("</body>")) {
           finalHtml = finalHtml.replace("</body>", `${unsubHtml}</body>`);
        } else {
           finalHtml = finalHtml + unsubHtml;
        }

        const sendEmailCommand = new SendEmailCommand({
          Source: senderEmail,
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: { Html: { Data: finalHtml, Charset: "UTF-8" } },
          },
        });

    const result = await sesClient.send(sendEmailCommand);

    return NextResponse.json({
      success: true,
      messageId: result.MessageId,
    });
  } catch (error: any) {
    console.error("AWS SES SEND ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
