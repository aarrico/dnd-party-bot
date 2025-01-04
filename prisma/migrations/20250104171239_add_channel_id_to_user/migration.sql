/*
  Warnings:

  - You are about to drop the column `username` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[channelId]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `channelId` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "username",
ADD COLUMN     "channelId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_channelId_key" ON "user"("channelId");
