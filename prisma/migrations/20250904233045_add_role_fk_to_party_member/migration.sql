/*
  Warnings:

  - You are about to drop the column `role` on the `party_member` table. All the data in the column will be lost.
  - The primary key for the `role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `role` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `role` table. All the data in the column will be lost.
  - Added the required column `role_id` to the `party_member` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `role` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "public"."role_type_key";

-- AlterTable
ALTER TABLE "public"."party_member" DROP COLUMN "role",
ADD COLUMN     "role_id" "public"."RoleType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."role" DROP CONSTRAINT "role_pkey",
DROP COLUMN "name",
DROP COLUMN "type",
DROP COLUMN "id",
ADD COLUMN     "id" "public"."RoleType" NOT NULL,
ADD CONSTRAINT "role_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "public"."party_member" ADD CONSTRAINT "party_member_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
