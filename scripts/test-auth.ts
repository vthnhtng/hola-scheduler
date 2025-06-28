import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyBasicAuth, createBasicAuthHeader } from '../lib/auth';

const prisma = new PrismaClient();

async function testAuthentication() {
  try {
    console.log('🧪 Testing Authentication with Prisma Schema...\n');

    // Test 1: Tạo user test
    const testUsername = 'testuser';
    const testPassword = 'testpass123';
    
    console.log('1. Creating test user...');
    
    // Hash password
    const hashedPassword = await hashPassword(testPassword);
    console.log(`   Password hash: ${hashedPassword}`);

    // Tạo user trong database
    const user = await prisma.appUser.upsert({
      where: { username: testUsername },
      update: {
        password: hashedPassword,
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'scheduler'
      },
      create: {
        username: testUsername,
        password: hashedPassword,
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'scheduler'
      }
    });

    console.log(`   ✅ User created: ${user.username} (ID: ${user.id})`);

    // Test 2: Verify authentication
    console.log('\n2. Testing authentication...');
    
    const authHeader = createBasicAuthHeader(testUsername, testPassword);
    console.log(`   Auth header: ${authHeader}`);

    const authUser = await verifyBasicAuth(authHeader);
    
    if (authUser) {
      console.log(`   ✅ Authentication successful!`);
      console.log(`   User: ${authUser.username}`);
      console.log(`   Role: ${authUser.role}`);
      console.log(`   Full Name: ${authUser.fullName}`);
    } else {
      console.log('   ❌ Authentication failed!');
    }

    // Test 3: Test wrong password
    console.log('\n3. Testing wrong password...');
    
    const wrongAuthHeader = createBasicAuthHeader(testUsername, 'wrongpassword');
    const wrongAuthUser = await verifyBasicAuth(wrongAuthHeader);
    
    if (!wrongAuthUser) {
      console.log('   ✅ Correctly rejected wrong password');
    } else {
      console.log('   ❌ Wrong password was accepted!');
    }

    // Test 4: Test non-existent user
    console.log('\n4. Testing non-existent user...');
    
    const nonExistentAuthHeader = createBasicAuthHeader('nonexistent', testPassword);
    const nonExistentUser = await verifyBasicAuth(nonExistentAuthHeader);
    
    if (!nonExistentUser) {
      console.log('   ✅ Correctly rejected non-existent user');
    } else {
      console.log('   ❌ Non-existent user was accepted!');
    }

    // Test 5: Check database schema compatibility
    console.log('\n5. Checking database schema...');
    
    const dbUser = await prisma.appUser.findUnique({
      where: { username: testUsername }
    });

    if (dbUser) {
      console.log('   ✅ Database schema is compatible');
      console.log(`   Fields: id=${dbUser.id}, username=${dbUser.username}, role=${dbUser.role}`);
    } else {
      console.log('   ❌ Database schema issue');
    }

    console.log('\n🎉 Authentication test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuthentication(); 