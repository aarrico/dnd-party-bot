/*
  Warnings:

  - You are about to drop the column `party_message_id` on the `session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[guildId]` on the table `campaign` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guildId` to the `campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "campaign" ADD COLUMN     "guildId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "session" DROP COLUMN "party_message_id";

-- CreateIndex
CREATE UNIQUE INDEX "campaign_guildId_key" ON "campaign"("guildId");
