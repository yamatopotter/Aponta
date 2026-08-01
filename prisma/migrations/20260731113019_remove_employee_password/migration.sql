/*
  Warnings:

  - You are about to drop the column `mustChangePassword` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "mustChangePassword",
DROP COLUMN "passwordHash";
