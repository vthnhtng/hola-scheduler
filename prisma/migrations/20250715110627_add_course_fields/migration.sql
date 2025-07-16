/*
  Warnings:

  - Added the required column `endDate` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `courses` ADD COLUMN `endDate` DATETIME(3) NOT NULL,
    ADD COLUMN `school` VARCHAR(100) NULL,
    ADD COLUMN `startDate` DATETIME(3) NOT NULL;
