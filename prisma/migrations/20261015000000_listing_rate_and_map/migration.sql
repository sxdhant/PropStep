-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "pricePerSqft" INTEGER,
ADD COLUMN     "mapUrl" TEXT,
ADD COLUMN     "mapEmbed" TEXT,
ADD COLUMN     "notes" JSONB;
