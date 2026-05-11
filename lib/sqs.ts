import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const queueUrl = process.env.AWS_SQS_QUEUE_URL || "";
const region = process.env.AWS_REGION || "eu-north-1";

export const sqsClient = new SQSClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Pushes a campaign dispatch job to the AWS SQS Queue
 */
export async function pushToCampaignQueue(
  campaignId: string,
): Promise<string | undefined> {
  if (!queueUrl) {
    console.error("AWS SQS Queue URL is not defined in environment variables.");
    return undefined;
  }

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify({
      campaignId,
      timestamp: new Date().toISOString(),
    }),
  });

  const response = await sqsClient.send(command);
  return response.MessageId;
}
