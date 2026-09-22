/*
  Warnings:

  - A unique constraint covering the columns `[domain]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN "domain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "Company"("domain");
