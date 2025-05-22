import { PrismaClient, Program, Category, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Users
  await prisma.appUser.createMany({
    data: [
      { id: 1, username: 'admin', password: 'admin123', fullName: 'Nguyen Van A', role: Role.scheduler, email: 'admin@example.com' },
      { id: 2, username: 'viewer1', password: 'pass123', fullName: 'Tran Thi B', role: Role.viewer, email: 'viewer1@example.com' },
    ],
    skipDuplicates: true,
  });

  // Universities
  await prisma.university.createMany({
    data: [
      { id: 1, name: 'Đại học Bách Khoa', status: 'Undone' },
      { id: 3, name: 'Đại học Sư phạm', status: 'Undone' },
    ],
    skipDuplicates: true,
  });

  // Curriculums
  await prisma.curriculum.createMany({
    data: [
      { id: 1, program: Program.DH },
      { id: 2, program: Program.CD },
    ],
    skipDuplicates: true,
  });

  // Subjects
  await prisma.subject.createMany({
    data: [
      { id: 1, name: 'Hoc phan CT1', category: Category.CT },
      { id: 2, name: 'Hoc phan CT2', category: Category.CT },
      { id: 3, name: 'Hoc phan CT3', category: Category.CT, prerequisiteId: 2 },
      { id: 4, name: 'Hoc phan CT4', category: Category.CT, prerequisiteId: 3 },
      { id: 5, name: 'Hoc phan CT5', category: Category.CT },
      { id: 6, name: 'Hoc phan CT6', category: Category.CT },
      { id: 7, name: 'Hoc phan CT7', category: Category.CT, prerequisiteId: 6 },
      { id: 8, name: 'Hoc phan CT8', category: Category.CT, prerequisiteId: 7 },
      { id: 9, name: 'Hoc phan CT9', category: Category.CT },
      { id: 10, name: 'Hoc phan CT10', category: Category.CT, prerequisiteId: 9 },
      { id: 11, name: 'Hoc phan QS1', category: Category.QS },
      { id: 12, name: 'Hoc phan QS2', category: Category.QS },
      { id: 13, name: 'Hoc phan QS3', category: Category.QS, prerequisiteId: 12 },
      { id: 14, name: 'Hoc phan QS4', category: Category.QS, prerequisiteId: 13 },
      { id: 15, name: 'Hoc phan QS5', category: Category.QS },
      { id: 16, name: 'Hoc phan QS6', category: Category.QS },
      { id: 17, name: 'Hoc phan QS7', category: Category.QS, prerequisiteId: 16 },
      { id: 18, name: 'Hoc phan QS8', category: Category.QS },
      { id: 19, name: 'Hoc phan QS9', category: Category.QS, prerequisiteId: 17 },
      { id: 20, name: 'Hoc phan QS10', category: Category.QS, prerequisiteId: 19 },
    ],
    skipDuplicates: true,
  });

  // Lecturers
  await prisma.lecturer.createMany({
    data: [
      { id: 1, fullName: 'Le Van C', faculty: Category.CT, maxSessionsPerWeek: 10 },
      { id: 2, fullName: 'Pham Thi D', faculty: Category.CT, maxSessionsPerWeek: 8 },
      { id: 3, fullName: 'Nguyen Van E', faculty: Category.CT, maxSessionsPerWeek: 12 },
      { id: 4, fullName: 'Le Thi F', faculty: Category.CT, maxSessionsPerWeek: 10 },
      { id: 5, fullName: 'Tran Thi G', faculty: Category.CT, maxSessionsPerWeek: 8 },
      { id: 6, fullName: 'Nguyen Thi H', faculty: Category.QS, maxSessionsPerWeek: 12 },
      { id: 7, fullName: 'Phan Van I', faculty: Category.QS, maxSessionsPerWeek: 12 },
      { id: 8, fullName: 'Do Van J', faculty: Category.QS, maxSessionsPerWeek: 10 },
      { id: 9, fullName: 'Dang Thi K', faculty: Category.QS, maxSessionsPerWeek: 8 },
      { id: 10, fullName: 'Ta Van L', faculty: Category.QS, maxSessionsPerWeek: 12 },
    ],
    skipDuplicates: true,
  });

  // Locations
  await prisma.location.createMany({
    data: [
      { id: 1, name: 'Phong A101', capacity: 1 },
      { id: 2, name: 'Phong A102', capacity: 1 },
      { id: 3, name: 'Phong A103', capacity: 1 },
      { id: 4, name: 'Phong B101', capacity: 1 },
      { id: 5, name: 'Phong B202', capacity: 1 },
      { id: 6, name: 'Phong B103', capacity: 1 },
      { id: 7, name: 'Phong C301', capacity: 1 },
      { id: 8, name: 'Phong C302', capacity: 1 },
      { id: 9, name: 'Phong C303', capacity: 1 },
      { id: 10, name: 'Doi sau truong', capacity: 3 },
      { id: 11, name: 'Doi truoc truong', capacity: 3 },
      { id: 12, name: 'San the duc', capacity: 5 },
      { id: 13, name: 'Thao truong', capacity: 5 },
    ],
    skipDuplicates: true,
  });

  // Teams (updated with universityId and teamLeaderId)
  await prisma.team.createMany({
    data: [
      { id: 1, name: 'Team1', program: Program.DH, universityId: 1, teamLeaderId: 1 },
      { id: 2, name: 'Team2', program: Program.DH, universityId: 1, teamLeaderId: 2 },
      { id: 3, name: 'Team3', program: Program.DH, universityId: 2, teamLeaderId: 3 },
      { id: 4, name: 'Team4', program: Program.DH, universityId: 2, teamLeaderId: 4 },
      { id: 5, name: 'Team5', program: Program.DH, universityId: 3, teamLeaderId: 5 },
      { id: 6, name: 'Team6', program: Program.DH, universityId: 3, teamLeaderId: 6 },
      { id: 7, name: 'Team7', program: Program.DH, universityId: 1, teamLeaderId: 7 },
      { id: 8, name: 'Team8', program: Program.DH, universityId: 2, teamLeaderId: 8 },
      { id: 9, name: 'Team9', program: Program.DH, universityId: 3, teamLeaderId: 9 },
      { id: 10, name: 'Team10', program: Program.DH, universityId: 1, teamLeaderId: 10 },
    ],
    skipDuplicates: true,
  });

  // Schedule Files
  await prisma.scheduleFile.createMany({
    data: [
      { id: 1, filePath: 'path/schedule1.csv' },
      { id: 2, filePath: 'path/schedule2.csv' },
      { id: 3, filePath: 'path/schedule3.csv' },
    ],
    skipDuplicates: true,
  });

  // Holidays
  await prisma.holiday.createMany({
    data: [
      { id: 1, date: '2025-01-01' }, // Tết Dương lịch
      { id: 2, date: '2025-02-10' }, // Tết Nguyên đán
      { id: 3, date: '2025-04-18' }, // Giỗ tổ Hùng Vương
      { id: 4, date: '2025-04-30' }, // Ngày Giải phóng
      { id: 5, date: '2025-05-01' }, // Quốc tế Lao động
      { id: 6, date: '2025-09-02' }, // Quốc khánh
    ],
    skipDuplicates: true,
  });

  // Lecturer Statistics
  await prisma.lecturerStatistic.createMany({
    data: [
      { id: 1, lecturerId: 1, fromDate: '2025-01-01', toDate: '2025-01-31', numberOfSessions: 8 },
      { id: 2, lecturerId: 2, fromDate: '2025-01-01', toDate: '2025-01-31', numberOfSessions: 6 },
      { id: 3, lecturerId: 3, fromDate: '2025-01-01', toDate: '2025-01-31', numberOfSessions: 10 },
      { id: 4, lecturerId: 1, fromDate: '2025-02-01', toDate: '2025-02-28', numberOfSessions: 7 },
      { id: 5, lecturerId: 6, fromDate: '2025-01-01', toDate: '2025-01-31', numberOfSessions: 9 },
    ],
    skipDuplicates: true,
  });

  // Location Subjects
  await prisma.locationSubject.createMany({
    data: [
      { locationId: 1, subjectId: 1 },
      { locationId: 2, subjectId: 1 },
      { locationId: 3, subjectId: 1 },
      { locationId: 4, subjectId: 1 },
      { locationId: 5, subjectId: 1 },
      { locationId: 6, subjectId: 1 },
      { locationId: 7, subjectId: 1 },
      { locationId: 8, subjectId: 1 },
      { locationId: 9, subjectId: 1 },
      { locationId: 1, subjectId: 2 },
      { locationId: 2, subjectId: 2 },
      { locationId: 3, subjectId: 2 },
      { locationId: 4, subjectId: 2 },
      { locationId: 5, subjectId: 2 },
      { locationId: 6, subjectId: 2 },
      { locationId: 7, subjectId: 2 },
      { locationId: 8, subjectId: 2 },
      { locationId: 9, subjectId: 2 },
      { locationId: 13, subjectId: 20 },
    ],
    skipDuplicates: true,
  });

  // Lecturer Specializations
  await prisma.lecturerSpecialization.createMany({
    data: [
      { lecturerId: 1, subjectId: 1 },
      { lecturerId: 3, subjectId: 1 },
      { lecturerId: 4, subjectId: 1 },
      { lecturerId: 5, subjectId: 1 },
      { lecturerId: 1, subjectId: 2 },
      { lecturerId: 3, subjectId: 2 },
      { lecturerId: 4, subjectId: 2 },
      { lecturerId: 5, subjectId: 2 },
      { lecturerId: 1, subjectId: 3 },
      { lecturerId: 4, subjectId: 3 },
      { lecturerId: 10, subjectId: 20 },
    ],
    skipDuplicates: true,
  });

  // Curriculum Subjects
  await prisma.curriculumSubject.createMany({
    data: [
      { curriculumId: 1, subjectId: 1 },
      { curriculumId: 1, subjectId: 2 },
      { curriculumId: 1, subjectId: 3 },
      { curriculumId: 1, subjectId: 4 },
      { curriculumId: 1, subjectId: 5 },
      { curriculumId: 1, subjectId: 6 },
      { curriculumId: 1, subjectId: 7 },
      { curriculumId: 1, subjectId: 8 },
      { curriculumId: 1, subjectId: 9 },
      { curriculumId: 1, subjectId: 10 },
      { curriculumId: 1, subjectId: 11 },
      { curriculumId: 1, subjectId: 12 },
      { curriculumId: 1, subjectId: 13 },
      { curriculumId: 1, subjectId: 14 },
      { curriculumId: 1, subjectId: 15 },
      { curriculumId: 1, subjectId: 16 },
      { curriculumId: 1, subjectId: 17 },
      { curriculumId: 1, subjectId: 18 },
      { curriculumId: 1, subjectId: 19 },
      { curriculumId: 1, subjectId: 20 },
      { curriculumId: 2, subjectId: 1 },
      { curriculumId: 2, subjectId: 2 },
      { curriculumId: 2, subjectId: 3 },
      { curriculumId: 2, subjectId: 4 },
      { curriculumId: 2, subjectId: 6 },
      { curriculumId: 2, subjectId: 8 },
      { curriculumId: 2, subjectId: 9 },
      { curriculumId: 2, subjectId: 10 },
      { curriculumId: 2, subjectId: 11 },
      { curriculumId: 2, subjectId: 12 },
      { curriculumId: 2, subjectId: 13 },
      { curriculumId: 2, subjectId: 14 },
      { curriculumId: 2, subjectId: 16 },
      { curriculumId: 2, subjectId: 18 },
      { curriculumId: 2, subjectId: 19 },
      { curriculumId: 2, subjectId: 20 },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });