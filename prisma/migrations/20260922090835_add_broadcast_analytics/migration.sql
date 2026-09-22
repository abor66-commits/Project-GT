-- CreateTable
CREATE TABLE "BroadcastCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "tag_name" TEXT NOT NULL,
    "template_id" TEXT,
    "sender_id" TEXT NOT NULL,
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "open_count" INTEGER NOT NULL DEFAULT 0,
    "unique_open_count" INTEGER NOT NULL DEFAULT 0,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "unique_click_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "content_snapshot" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "BroadcastCampaign_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BroadcastRecipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaign_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "error_message" TEXT,
    "tracking_token" TEXT NOT NULL,
    "opened_at" DATETIME,
    "last_opened_at" DATETIME,
    "open_count" INTEGER NOT NULL DEFAULT 0,
    "clicked_at" DATETIME,
    "last_clicked_at" DATETIME,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "last_clicked_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BroadcastRecipient_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "BroadcastCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BroadcastCampaign_sender_id_idx" ON "BroadcastCampaign"("sender_id");

-- CreateIndex
CREATE INDEX "BroadcastCampaign_tag_name_idx" ON "BroadcastCampaign"("tag_name");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastRecipient_tracking_token_key" ON "BroadcastRecipient"("tracking_token");

-- CreateIndex
CREATE INDEX "BroadcastRecipient_tracking_token_idx" ON "BroadcastRecipient"("tracking_token");

-- CreateIndex
CREATE INDEX "BroadcastRecipient_campaign_id_idx" ON "BroadcastRecipient"("campaign_id");

-- CreateIndex
CREATE INDEX "BroadcastRecipient_email_idx" ON "BroadcastRecipient"("email");
