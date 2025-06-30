import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function createDefaultUsers() {
  try {
    console.log('Creating default users...');

    // Create scheduler user
    const schedulerUser = await prisma.appUser.upsert({
      where: { username: 'scheduler' },
      update: {},
      create: {
        username: 'scheduler',
        password: hashPassword('scheduler123'),
        fullName: 'Scheduler User',
        email: 'scheduler@example.com',
        role: 'scheduler',
      },
    });

    console.log('Created scheduler user:', schedulerUser.username);

    // Create viewer user
    const viewerUser = await prisma.appUser.upsert({
      where: { username: 'viewer' },
      update: {},
      create: {
        username: 'viewer',
        password: hashPassword('viewer123'),
        fullName: 'Viewer User',
        email: 'viewer@example.com',
        role: 'viewer',
      },
    });

    console.log('Created viewer user:', viewerUser.username);

    // Create admin user
    const adminUser = await prisma.appUser.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashPassword('admin123'),
        fullName: 'Administrator',
        email: 'admin@example.com',
        role: 'scheduler',
      },
    });

    console.log('Created admin user:', adminUser.username);

    console.log('\nDefault users created successfully!');
    console.log('\nLogin credentials:');
    console.log('Scheduler: username=scheduler, password=scheduler123');
    console.log('Viewer: username=viewer, password=viewer123');
    console.log('Admin: username=admin, password=admin123');

  } catch (error) {
    console.error('Error creating default users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultUsers(); 