-- CreateTable
CREATE TABLE `session_unavailable` (
    `sessionId` VARCHAR(50) NOT NULL,
    `unavailableLecturers` JSON NOT NULL,
    `unavailableLocations` JSON NOT NULL,

    PRIMARY KEY (`sessionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
