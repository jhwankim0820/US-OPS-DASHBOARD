/*
  Warnings:

  - You are about to drop the column `amount` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `stage` on the `Deal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dmdId]` on the table `Deal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dmdId` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `formFactor` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin` to the `Shipment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Deal" DROP COLUMN "amount",
DROP COLUMN "company",
DROP COLUMN "stage",
ADD COLUMN     "cards" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "customer" TEXT NOT NULL,
ADD COLUMN     "dmdId" TEXT NOT NULL,
ADD COLUMN     "formFactor" TEXT NOT NULL,
ADD COLUMN     "region" TEXT NOT NULL,
ADD COLUMN     "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "servers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "origin" TEXT NOT NULL,
ADD COLUMN     "trackingNo" TEXT,
ALTER COLUMN "eta" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Deal_dmdId_key" ON "Deal"("dmdId");
