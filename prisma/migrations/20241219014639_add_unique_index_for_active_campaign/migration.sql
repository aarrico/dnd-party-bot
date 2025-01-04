/*
  Warnings:

  - A unique constraint covering the columns `[guild_id,active]` on the table `campaign` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "one_active_campaign_per_guild_index" ON "campaign"("guild_id", "active");
