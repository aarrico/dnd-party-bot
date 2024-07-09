-- DropForeignKey
ALTER TABLE "party_member" DROP CONSTRAINT "party_member_session_id_fkey";

-- DropForeignKey
ALTER TABLE "party_member" DROP CONSTRAINT "party_member_user_id_fkey";

-- AddForeignKey
ALTER TABLE "party_member" ADD CONSTRAINT "party_member_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_member" ADD CONSTRAINT "party_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
