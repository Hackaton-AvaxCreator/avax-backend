/*
  Warnings:

  - Added the required column `type` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_content_id_fkey";

-- AlterTable
ALTER TABLE "content" ADD COLUMN     "contract_id" TEXT,
ADD COLUMN     "token_id" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "confirmed_at" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transaction_hash" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "content_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "last_stake_at" TIMESTAMP(3),
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "staked_amount" DECIMAL(18,8) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "content_ownership" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "purchase_price" DECIMAL(10,2) NOT NULL,
    "transaction_hash" TEXT,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_ownership_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_ownership" ADD CONSTRAINT "content_ownership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_ownership" ADD CONSTRAINT "content_ownership_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
