// import generateSchedulesForTeams from '../app/scheduler/generator.ts';
import { generateSchedulesForTeams } from '../app/scheduler/generator.ts';
import prisma from '../lib/prisma.ts';

console.log('generateSchedulesForTeams:', generateSchedulesForTeams);

async function main() {
  console.log('Bắt đầu tạo lịch học...');

  const teams = await prisma.team.findMany({
    where: { program: 'DH' }
  });

  if (teams.length === 0) {
    console.log('Không có lớp học nào để tạo lịch');
    return;
  }

  const schedules = await generateSchedulesForTeams(teams);
  console.log('Tạo lịch học thành công:', schedules);
}

main()
  .catch(e => {
    console.error('Lỗi phát sinh trong quá trình tạo lịch học:');
    console.dir(e, { depth: null }); // log đầy đủ object error
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });