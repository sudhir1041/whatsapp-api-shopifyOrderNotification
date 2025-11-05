-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "WhatsAppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "facebookUrl" TEXT,
    "phoneId" TEXT,
    "accessToken" TEXT,
    "orderTemplateName" TEXT,
    "fulfillmentTemplateName" TEXT,
    "helloWorldTemplateName" TEXT,
    "abandonedCartTemplateName" TEXT,
    "welcomeSeriesTemplateName" TEXT,
    "templateLanguage" TEXT,
    "abandonmentDelayHours" INTEGER DEFAULT 1,
    "enableAbandonmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "maxReminders" INTEGER DEFAULT 3,
    "reminderIntervalHours" INTEGER DEFAULT 24,
    "hasButton" BOOLEAN NOT NULL DEFAULT false,
    "emailApiKey" TEXT,
    "fromEmail" TEXT,
    "smsAccountSid" TEXT,
    "smsAuthToken" TEXT,
    "testPhoneNumber" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "enableEmailAutomation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "lineItems" TEXT NOT NULL,
    "totalPrice" TEXT,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSettings_shop_key" ON "WhatsAppSettings"("shop");
CREATE UNIQUE INDEX "Cart_cartId_shop_key" ON "Cart"("cartId", "shop");