/*
  Warnings:

  - You are about to drop the column `guildId` on the `campaign` table. All the data in the column will be lost.
  - Added the required column `guild_id` to the `campaign` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "campaign_guildId_key";

-- AlterTable
ALTER TABLE "campaign" DROP COLUMN "guildId",
ADD COLUMN     "guild_id" TEXT NOT NULL;
