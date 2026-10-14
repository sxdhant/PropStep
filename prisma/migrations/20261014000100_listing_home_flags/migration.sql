-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "hotSelling" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "handpicked" BOOLEAN NOT NULL DEFAULT false;
