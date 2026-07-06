-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "dmdId" TEXT;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_dmdId_fkey" FOREIGN KEY ("dmdId") REFERENCES "Deal"("dmdId") ON DELETE SET NULL ON UPDATE CASCADE;
