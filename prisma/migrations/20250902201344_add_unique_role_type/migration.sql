/*
  Warnings:

  - A unique constraint covering the columns `[type]` on the table `role` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "role_type_key" ON "public"."role"("type");
