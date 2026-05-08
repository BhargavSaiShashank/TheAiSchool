-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "from_email" TEXT,
    "ses_config_set" TEXT,
    "aws_region" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactList_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "org_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "custom_fields" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contact_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactListMember" (
    "contact_id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "subscribed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("contact_id", "list_id"),
    CONSTRAINT "ContactListMember_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContactListMember_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "ContactList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rules" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Segment_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "blocks" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Template_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preview_text" TEXT,
    "from_name" TEXT NOT NULL,
    "from_email" TEXT NOT NULL,
    "reply_to" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "template_id" TEXT,
    "scheduled_at" DATETIME,
    "timezone" TEXT,
    "recipients_config" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Campaign_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampaignSend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaign_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "ses_message_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sent_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignSend_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CampaignSend_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contact_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "occurred_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "user_agent" TEXT,
    "metadata" TEXT,
    CONSTRAINT "EmailEvent_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailEvent_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SuppressionList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "org_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "suppressed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "manually_added" BOOLEAN NOT NULL DEFAULT false,
    "audit_log" TEXT,
    CONSTRAINT "SuppressionList_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "list_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "added" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "errored" INTEGER NOT NULL DEFAULT 0,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportJob_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "ContactList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_org_id_idx" ON "User"("org_id");

-- CreateIndex
CREATE INDEX "ContactList_org_id_idx" ON "ContactList"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_org_id_idx" ON "Contact"("org_id");

-- CreateIndex
CREATE INDEX "Contact_status_idx" ON "Contact"("status");

-- CreateIndex
CREATE INDEX "ContactListMember_contact_id_idx" ON "ContactListMember"("contact_id");

-- CreateIndex
CREATE INDEX "ContactListMember_list_id_idx" ON "ContactListMember"("list_id");

-- CreateIndex
CREATE INDEX "Segment_org_id_idx" ON "Segment"("org_id");

-- CreateIndex
CREATE INDEX "Template_org_id_idx" ON "Template"("org_id");

-- CreateIndex
CREATE INDEX "Campaign_org_id_idx" ON "Campaign"("org_id");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "CampaignSend_campaign_id_idx" ON "CampaignSend"("campaign_id");

-- CreateIndex
CREATE INDEX "CampaignSend_contact_id_idx" ON "CampaignSend"("contact_id");

-- CreateIndex
CREATE INDEX "CampaignSend_status_idx" ON "CampaignSend"("status");

-- CreateIndex
CREATE INDEX "EmailEvent_contact_id_idx" ON "EmailEvent"("contact_id");

-- CreateIndex
CREATE INDEX "EmailEvent_campaign_id_idx" ON "EmailEvent"("campaign_id");

-- CreateIndex
CREATE INDEX "EmailEvent_event_type_idx" ON "EmailEvent"("event_type");

-- CreateIndex
CREATE UNIQUE INDEX "SuppressionList_email_key" ON "SuppressionList"("email");

-- CreateIndex
CREATE INDEX "SuppressionList_org_id_idx" ON "SuppressionList"("org_id");

-- CreateIndex
CREATE INDEX "SuppressionList_email_idx" ON "SuppressionList"("email");

-- CreateIndex
CREATE INDEX "ImportJob_list_id_idx" ON "ImportJob"("list_id");
