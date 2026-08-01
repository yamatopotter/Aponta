-- CreateTable
CREATE TABLE "RhidConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "apiBaseUrl" TEXT,
    "integrationEmail" TEXT,
    "integrationPasswordEnc" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RhidConfig_pkey" PRIMARY KEY ("id")
);
