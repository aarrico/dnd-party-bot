-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELED');

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_message_id" TEXT NOT NULL,
    "session_name" TEXT NOT NULL,
    "session_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" TEXT NOT NULL,
    "user_channel_id" TEXT NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_member" (
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "party_member_pkey" PRIMARY KEY ("session_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_session_message_id_key" ON "session"("session_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_user_channel_id_key" ON "user"("user_channel_id");

-- AddForeignKey
ALTER TABLE "party_member" ADD CONSTRAINT "party_member_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_member" ADD CONSTRAINT "party_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
