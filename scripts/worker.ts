import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { sqsClient } from "../lib/sqs";
import { processCampaignDispatch } from "../lib/dispatcher";
// Load env variables automatically in Node 20+ using --env-file=.env flag or via production environment injects.

const QUEUE_URL = process.env.AWS_SQS_QUEUE_URL;

async function runDaemon() {
  console.log("🟢 Starting PulseSend Enterprise Queue Worker...");
  console.log(`📡 Watching AWS SQS: ${QUEUE_URL}`);

  if (!QUEUE_URL) {
    console.error(
      "🔴 ERROR: AWS_SQS_QUEUE_URL is not defined. Worker exiting.",
    );
    process.exit(1);
  }

  const config = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "eu-north-1",
    senderEmail: process.env.AWS_SENDER_EMAIL || "dommetishashank@gmail.com",
  };

  while (true) {
    try {
      // LONG POLLING: Efficiently waits up to 20 seconds for messages instead of spamming AWS!
      const receiveCmd = new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
      });

      const data = await sqsClient.send(receiveCmd);

      if (data.Messages && data.Messages.length > 0) {
        for (const msg of data.Messages) {
          console.log(`📥 Job Received. MessageID: ${msg.MessageId}`);

          try {
            const payload = JSON.parse(msg.Body || "{}");
            const campaignId = payload.campaignId;

            if (campaignId) {
              console.log(`🚀 Executing Campaign Dispatch Task: ${campaignId}`);

              // Execute full isolated heavy lifting
              await processCampaignDispatch(campaignId, config);

              console.log("✅ Task Complete. Deleting from queue...");

              // Safety: Only remove from queue if processed cleanly
              await sqsClient.send(
                new DeleteMessageCommand({
                  QueueUrl: QUEUE_URL,
                  ReceiptHandle: msg.ReceiptHandle!,
                }),
              );
            }
          } catch (parseErr: any) {
            console.error(
              "❌ Malformed queue payload skipped:",
              parseErr.message,
            );
          }
        }
      }
    } catch (pollErr: any) {
      console.error("⚠️ Loop Exception (will retry):", pollErr.message);
      // Prevent infinite CPU spin on tight loops if offline
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
}

runDaemon();
