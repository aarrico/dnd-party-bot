/*
  Warnings:

  - You are about to drop the column `active` on the `campaign` table. All the data in the column will be lost.
  - You are about to drop the column `guild_id` on the `campaign` table. All the data in the column will be lost.
  - You are about to drop the `guild` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `guild_member` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."campaign" DROP CONSTRAINT "campaign_guild_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."guild_member" DROP CONSTRAINT "guild_member_guild_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."guild_member" DROP CONSTRAINT "guild_member_user_id_fkey";

-- DropIndex
DROP INDEX "public"."one_active_campaign_per_guild_index";

-- AlterTable
ALTER TABLE "public"."campaign" DROP COLUMN "active",
DROP COLUMN "guild_id";

-- DropTable
DROP TABLE "public"."guild";

-- DropTable
DROP TABLE "public"."guild_member";

-- CreateTable
CREATE TABLE "public"."campaign_member" (
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_member_pkey" PRIMARY KEY ("campaign_id","user_id")
);

-- AddForeignKey
ALTER TABLE "public"."campaign_member" ADD CONSTRAINT "campaign_member_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_member" ADD CONSTRAINT "campaign_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
