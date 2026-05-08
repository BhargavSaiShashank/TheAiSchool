import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, html } = body;

    if (!to || !subject) {
      return NextResponse.json({ error: "Recipient and subject are required" }, { status: 400 });
    }

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || "eu-north-1";
    const senderEmail = process.env.AWS_SENDER_EMAIL;

    if (!accessKeyId || !secretAccessKey || !senderEmail) {
      return NextResponse.json(
        { error: "AWS credentials or sender email are not fully configured in .env" },
        { status: 500 }
      );
    }

    const sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const sendEmailCommand = new SendEmailCommand({
      Source: senderEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: html || `
              <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px;">
                <h2 style="color: #111;">Test Dispatch Successful! 🚀</h2>
                <p>Hello,</p>
                <p>This is a real-time, live email sent from your newly integrated AWS SES SMTP provider on <strong>PulseSend</strong>!</p>
                <p>Your API keys, sending identities, and database tables are now fully working and production ready.</p>
                <div style="margin-top: 24px; padding-top: 16px; border-t: 1px solid #eee; font-size: 12px; color: #666;">
                  Sent via PulseSend Client Admin Console.
                </div>
              </div>
            `,
          },
        },
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
