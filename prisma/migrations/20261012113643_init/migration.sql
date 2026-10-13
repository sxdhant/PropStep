-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advisor" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "languages" TEXT NOT NULL,
    "years" INTEGER NOT NULL,

    CONSTRAINT "Advisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locality" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "priceSqft" TEXT NOT NULL,
    "priceMid" INTEGER NOT NULL,
    "rent2bhk" TEXT NOT NULL,
    "yield" TEXT NOT NULL,
    "growth" TEXT NOT NULL,
    "metro" TEXT NOT NULL,
    "metroShort" TEXT NOT NULL,
    "trend" JSONB NOT NULL,
    "overview" JSONB NOT NULL,
    "bestFor" JSONB NOT NULL,
    "pros" JSONB NOT NULL,
    "cons" JSONB NOT NULL,
    "schools" JSONB NOT NULL,
    "hospitals" JSONB NOT NULL,
    "work" JSONB NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Locality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Bengaluru',

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intent" TEXT NOT NULL DEFAULT 'buy',
    "type" TEXT NOT NULL,
    "developer" TEXT,
    "project" TEXT,
    "bhk" INTEGER NOT NULL,
    "baths" INTEGER NOT NULL,
    "area" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "localityId" TEXT,
    "price" BIGINT NOT NULL,
    "priceLabel" TEXT NOT NULL,
    "floor" TEXT,
    "age" TEXT,
    "possession" TEXT,
    "rera" TEXT,
    "badge" TEXT,
    "advisorId" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "units" INTEGER,
    "configs" JSONB,
    "areaMin" INTEGER,
    "areaMax" INTEGER,
    "unitTypes" JSONB,
    "floorplan" TEXT,
    "connectingRoad" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "amenities" JSONB,
    "connectivity" JSONB,
    "images" JSONB NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meta" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "enquiryType" TEXT,
    "message" TEXT,
    "subject" TEXT,
    "page" TEXT,
    "listingId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "consentAt" TIMESTAMP(3) NOT NULL,
    "ipHash" TEXT,
    "idempotency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteVisit" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "listingId" TEXT,
    "date" DATE NOT NULL,
    "slot" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Advisor_key_key" ON "Advisor"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Locality_slug_key" ON "Locality"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Area_city_name_key" ON "Area"("city", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");

-- CreateIndex
CREATE INDEX "Listing_status_city_locality_idx" ON "Listing"("status", "city", "locality");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_idempotency_key" ON "Lead"("idempotency");

-- CreateIndex
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SiteVisit_leadId_key" ON "SiteVisit"("leadId");

-- CreateIndex
CREATE INDEX "SiteVisit_date_slot_idx" ON "SiteVisit"("date", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_token_key" ON "Subscriber"("token");

-- CreateIndex
CREATE INDEX "AuditLog_entity_createdAt_idx" ON "AuditLog"("entity", "createdAt");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisit" ADD CONSTRAINT "SiteVisit_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisit" ADD CONSTRAINT "SiteVisit_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
