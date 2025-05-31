-- AlterTable
ALTER TABLE `universities` MODIFY `status` ENUM('Done', 'Processing', 'Undone') NOT NULL;
