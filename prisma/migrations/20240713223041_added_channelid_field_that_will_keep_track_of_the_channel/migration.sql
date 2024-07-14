/*
  Warnings:

  - You are about to drop the column `session_date` on the `session` table. All the data in the column will be lost.
  - You are about to drop the column `session_message_id` on the `session` table. All the data in the column will be lost.
  - You are about to drop the column `session_name` on the `session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[message_id]` on the table `session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[channel_id]` on the table `session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `channel_id` to the `session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message_id` to the `session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `session` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "session_session_message_id_key";

-- AlterTable
ALTER TABLE "session" DROP COLUMN "session_date",
DROP COLUMN "session_message_id",
DROP COLUMN "session_name",
ADD COLUMN     "channel_id" TEXT NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "message_id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "session_message_id_key" ON "session"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_channel_id_key" ON "session"("channel_id");
