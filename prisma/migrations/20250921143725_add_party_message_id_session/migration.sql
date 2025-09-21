/*
  Warnings:

  - Added the required column `party_message_id` to the `session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."session" ADD COLUMN     "party_message_id" TEXT NOT NULL;
