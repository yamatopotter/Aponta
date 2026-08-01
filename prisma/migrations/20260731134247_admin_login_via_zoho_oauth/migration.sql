-- AlterTable: username/passwordHash agora são opcionais (conta pode logar só via Zoho OAuth)
ALTER TABLE "AdminUser" ALTER COLUMN "username" DROP NOT NULL;
ALTER TABLE "AdminUser" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "AdminUser" ADD COLUMN "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
