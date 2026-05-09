import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const sqs = sqsClient;

/**
 * Pushes a campaign dispatch payload onto the AWS SQS Queue
 */
export async function pushToCampaignQueue(payload: {
  campaignId: string;
  recipientEmail: string;
  subject: string;
  htmlContent: string;
}): Promise<string> {
  const queueUrl = process.env.AWS_SQS_QUEUE_URL || "";
  if (!queueUrl) {
    throw new Error("AWS_SQS_QUEUE_URL environment variable is missing.");
  }

  const response = await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(payload),
    })
  );

  return response.MessageId || "";
}

/**
 * Polls AWS SQS for pending campaign dispatches and returns them.
 */
export async function pollCampaignQueue(): Promise<{
  receiptHandle: string;
  body: any;
} | null> {
  const queueUrl = process.env.AWS_SQS_QUEUE_URL || "";
  if (!queueUrl) return null;

  const response = await sqsClient.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 5, // Enable long-polling
    })
  );

  if (response.Messages && response.Messages.length > 0) {
    const message = response.Messages[0];
    return {
      receiptHandle: message.ReceiptHandle || "",
      body: message.Body ? JSON.parse(message.Body) : null,
    };
  }

  return null;
}

/**
 * Deletes a fully processed message from AWS SQS
 */
export async function deleteFromCampaignQueue(receiptHandle: string): Promise<void> {
  const queueUrl = process.env.AWS_SQS_QUEUE_URL || "";
  if (!queueUrl) return;

  await sqsClient.send(
    new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    })
  );
}
