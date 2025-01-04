/*
  Warnings:

  - Added the required column `type` to the `role` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('GAME_MASTER', 'TANK', 'SUPPORT', 'RANGE_DPS', 'MELEE_DPS', 'FACE', 'CONTROL');

-- AlterTable
ALTER TABLE "role" ADD COLUMN     "type" "RoleType" NOT NULL;
