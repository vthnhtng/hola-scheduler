-- CreateTable
CREATE TABLE `Subject` (
    `subject_id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject_name` VARCHAR(191) NOT NULL,
    `category` ENUM('CT', 'QS') NOT NULL,

    PRIMARY KEY (`subject_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubjectPrerequisites` (
    `subject_id` INTEGER NOT NULL,
    `prerequisite_id` INTEGER NOT NULL,

    PRIMARY KEY (`subject_id`, `prerequisite_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Curriculum` (
    `curriculum_id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject_id` INTEGER NOT NULL,
    `program` ENUM('DH', 'CD') NOT NULL,

    PRIMARY KEY (`curriculum_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Teams` (
    `team_id` INTEGER NOT NULL AUTO_INCREMENT,
    `team_name` VARCHAR(191) NOT NULL,
    `program` ENUM('DH', 'CD') NOT NULL,
    `team_leader_id` INTEGER NOT NULL,

    PRIMARY KEY (`team_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Location` (
    `location_id` INTEGER NOT NULL AUTO_INCREMENT,
    `location_name` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL,

    PRIMARY KEY (`location_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LocationSubjects` (
    `location_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,

    PRIMARY KEY (`location_id`, `subject_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lecturers` (
    `lecturer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(191) NOT NULL,
    `faculty` ENUM('CT', 'QS') NOT NULL,
    `max_sessions_per_week` INTEGER NOT NULL,

    PRIMARY KEY (`lecturer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LecturerSpecializations` (
    `lecturer_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,

    PRIMARY KEY (`lecturer_id`, `subject_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SubjectPrerequisites` ADD CONSTRAINT `SubjectPrerequisites_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`subject_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubjectPrerequisites` ADD CONSTRAINT `SubjectPrerequisites_prerequisite_id_fkey` FOREIGN KEY (`prerequisite_id`) REFERENCES `Subject`(`subject_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Curriculum` ADD CONSTRAINT `Curriculum_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`subject_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocationSubjects` ADD CONSTRAINT `LocationSubjects_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `Location`(`location_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocationSubjects` ADD CONSTRAINT `LocationSubjects_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`subject_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LecturerSpecializations` ADD CONSTRAINT `LecturerSpecializations_lecturer_id_fkey` FOREIGN KEY (`lecturer_id`) REFERENCES `Lecturers`(`lecturer_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LecturerSpecializations` ADD CONSTRAINT `LecturerSpecializations_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`subject_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
