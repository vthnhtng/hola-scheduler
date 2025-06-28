import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExistingUsers() {
  try {
    console.log('Checking existing users in database...\n');

    // Lấy tất cả users hiện có
    const existingUsers = await prisma.appUser.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        // Không lấy password vì lý do bảo mật
      },
      orderBy: {
        username: 'asc',
      },
    });

    if (existingUsers.length === 0) {
      console.log('No users found in database.');
      console.log('Creating default users...\n');

      // Tạo user scheduler
      const schedulerUser = await prisma.appUser.create({
        data: {
          username: 'scheduler',
          password: 'scheduler123', // Plain password
          fullName: 'Scheduler User',
          email: 'scheduler@example.com',
          role: 'scheduler',
        },
      });

      console.log('Created scheduler user:', schedulerUser.username);

      // Tạo user viewer
      const viewerUser = await prisma.appUser.create({
        data: {
          username: 'viewer',
          password: 'viewer123', // Plain password
          fullName: 'Viewer User',
          email: 'viewer@example.com',
          role: 'viewer',
        },
      });

      console.log('Created viewer user:', viewerUser.username);

      // Tạo admin user
      const adminUser = await prisma.appUser.create({
        data: {
          username: 'admin',
          password: 'admin123', // Plain password
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

    } else {
      console.log(`Found ${existingUsers.length} existing user(s):\n`);
      
      existingUsers.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Full Name: ${user.fullName || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });

      console.log('Available roles in database:');
      console.log('- scheduler: Full access including schedule generation');
      console.log('- viewer: Read-only access to data');
      console.log('\nNote: Use existing credentials to login.');
      console.log('If you need to reset passwords, use the admin panel or database directly.');
    }

  } catch (error) {
    console.error('Error checking/creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingUsers(); 