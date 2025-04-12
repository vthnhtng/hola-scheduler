SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS Lecturer_Specialization;
DROP TABLE IF EXISTS Location_Subject;
DROP TABLE IF EXISTS Curriculum_Subject;
DROP TABLE IF EXISTS Subject;
DROP TABLE IF EXISTS Team;
DROP TABLE IF EXISTS Schedule;
DROP TABLE IF EXISTS Lecturer;
DROP TABLE IF EXISTS Location;
DROP TABLE IF EXISTS AppUser;
DROP TABLE IF EXISTS Curriculum;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================
-- Table: AppUser
-- ========================
CREATE TABLE AppUser (
    id INT NOT NULL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('scheduler', 'viewer'),
    email VARCHAR(100)
);

-- ========================
-- Table: Curriculum
-- ========================
CREATE TABLE Curriculum (
    id INT NOT NULL PRIMARY KEY,
    program ENUM('DH', 'CD') NOT NULL
);

-- ========================
-- Table: Subject
-- ========================
CREATE TABLE Subject (
    id INT NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('CT', 'QS') NOT NULL,
    prerequisite_id INT,
    FOREIGN KEY (prerequisite_id) REFERENCES Subject(id)
);

-- ========================
-- Table: Curriculum_Subject
-- ========================
CREATE TABLE Curriculum_Subject (
    curriculum_id INT NOT NULL,
    subject_id INT NOT NULL,
    PRIMARY KEY (curriculum_id, subject_id),
    FOREIGN KEY (curriculum_id) REFERENCES Curriculum(id),
    FOREIGN KEY (subject_id) REFERENCES Subject(id)
);

-- ========================
-- Table: Lecturer
-- ========================
CREATE TABLE Lecturer (
    id INT NOT NULL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    faculty ENUM('CT', 'QS') NOT NULL,
    max_sessions_per_week INT NOT NULL
);

-- ========================
-- Table: Location
-- ========================
CREATE TABLE Location (
    id INT NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL
);

-- ========================
-- Table: Team
-- ========================
CREATE TABLE Team (
    id INT NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    program ENUM('DH', 'CD') NOT NULL,
    team_leader_id INT NOT NULL,
    FOREIGN KEY (team_leader_id) REFERENCES Lecturer(id)
);

-- ========================
-- Table: Schedule
-- ========================
CREATE TABLE Schedule (
    id VARCHAR(17) NOT NULL PRIMARY KEY,
    file_path VARCHAR(50) NOT NULL UNIQUE
);

-- ========================
-- Table: Location_Subject
-- ========================
CREATE TABLE Location_Subject (
    location_id INT NOT NULL,
    subject_id INT NOT NULL,
    PRIMARY KEY (location_id, subject_id),
    FOREIGN KEY (location_id) REFERENCES Location(id),
    FOREIGN KEY (subject_id) REFERENCES Subject(id)
);

-- ========================
-- Table: Lecturer_Specialization
-- ========================
CREATE TABLE Lecturer_Specialization (
    lecturer_id INT NOT NULL,
    subject_id INT NOT NULL,
    PRIMARY KEY (lecturer_id, subject_id),
    FOREIGN KEY (lecturer_id) REFERENCES Lecturer(id),
    FOREIGN KEY (subject_id) REFERENCES Subject(id)
);
