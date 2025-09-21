-- AlterTable
ALTER TABLE "public"."session" ADD COLUMN     "status" "public"."SessionStatus" NOT NULL DEFAULT 'SCHEDULED';
