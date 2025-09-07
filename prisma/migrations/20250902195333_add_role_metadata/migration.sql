-- AlterTable
ALTER TABLE "public"."role" ADD COLUMN     "description" TEXT,
ADD COLUMN     "display_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "image_path" TEXT NOT NULL DEFAULT '';
