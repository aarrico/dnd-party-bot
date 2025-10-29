-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."RoleType" AS ENUM ('GAME_MASTER', 'TANK', 'SUPPORT', 'RANGE_DPS', 'MELEE_DPS', 'FACE', 'CONTROL');

-- CreateTable
CREATE TABLE "public"."campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "party_message_id" TEXT NOT NULL,
    "event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_member" (
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_member_pkey" PRIMARY KEY ("campaign_id","user_id")
);

-- CreateTable
CREATE TABLE "public"."party_member" (
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" "public"."RoleType" NOT NULL,

    CONSTRAINT "party_member_pkey" PRIMARY KEY ("session_id","user_id")
);

-- CreateTable
CREATE TABLE "public"."role" (
    "id" "public"."RoleType" NOT NULL,
    "emoji_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL DEFAULT '',
    "image_path" TEXT NOT NULL DEFAULT '',
    "description" TEXT,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_name_key" ON "public"."campaign"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_channelId_key" ON "public"."user"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "public"."user"("username");

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_member" ADD CONSTRAINT "campaign_member_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_member" ADD CONSTRAINT "campaign_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."party_member" ADD CONSTRAINT "party_member_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."party_member" ADD CONSTRAINT "party_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."party_member" ADD CONSTRAINT "party_member_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed roles
INSERT INTO "public"."role" ("id", "emoji_id", "display_name", "image_path", "description") VALUES
  ('GAME_MASTER', '👑', 'Game Master', '', 'The Dungeon Master who runs the game'),
  ('TANK', '🛡️', 'Tank', '', 'Frontline defender with high HP and armor'),
  ('SUPPORT', '💚', 'Support', '', 'Healer and buffer who keeps the party alive'),
  ('RANGE_DPS', '🏹', 'Range DPS', '', 'Ranged damage dealer'),
  ('MELEE_DPS', '⚔️', 'Melee DPS', '', 'Melee damage dealer'),
  ('FACE', '🎭', 'Face', '', 'Social character skilled in persuasion and deception'),
  ('CONTROL', '🧙', 'Control', '', 'Spellcaster who controls the battlefield')
ON CONFLICT ("id") DO NOTHING;
