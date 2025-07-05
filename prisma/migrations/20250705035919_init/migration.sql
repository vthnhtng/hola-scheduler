/*
  Warnings:

  - You are about to drop the column `university_id` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the `universities` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `course_id` to the `lecturer_statistics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_id` to the `schedule_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_id` to the `teams` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `teams` DROP FOREIGN KEY `teams_university_id_fkey`;

-- DropIndex
DROP INDEX `teams_university_id_fkey` ON `teams`;

-- AlterTable
ALTER TABLE `lecturer_statistics` ADD COLUMN `course_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `schedule_files` ADD COLUMN `course_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `teams` DROP COLUMN `university_id`,
    ADD COLUMN `course_id` INTEGER NOT NULL;

-- DropTable
DROP TABLE `universities`;

-- CreateTable
CREATE TABLE `courses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `status` ENUM('Done', 'Processing', 'Undone') NOT NULL,

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `teams_course_id_fkey` ON `teams`(`course_id`);

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `schedule_files` ADD CONSTRAINT `schedule_files_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lecturer_statistics` ADD CONSTRAINT `lecturer_statistics_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
