import { hashPassword, createBasicAuthHeader } from '../lib/auth';

console.log('=== Test Authentication System ===\n');

// Test password hashing
console.log('1. Testing password hashing:');
const password = 'test123';
const hashedPassword = hashPassword(password);
console.log(`Password: ${password}`);
console.log(`Hashed: ${hashedPassword}`);
console.log(`Hash length: ${hashedPassword.length} characters\n`);

// Test Basic Auth header creation
console.log('2. Testing Basic Auth header creation:');
const username = 'testuser';
const testPassword = 'testpass';
const authHeader = createBasicAuthHeader(username, testPassword);
console.log(`Username: ${username}`);
console.log(`Password: ${testPassword}`);
console.log(`Auth Header: ${authHeader}\n`);

// Test different credentials
console.log('3. Testing different user credentials:');
const users = [
  { username: 'scheduler', password: 'scheduler123' },
  { username: 'viewer', password: 'viewer123' },
  { username: 'admin', password: 'admin123' },
];

users.forEach(user => {
  const header = createBasicAuthHeader(user.username, user.password);
  console.log(`${user.username}: ${header}`);
});

console.log('\n=== Test completed ===');
console.log('\nTo test the system:');
console.log('1. Run: npm run create-users');
console.log('2. Start the app: npm run dev');
console.log('3. Go to: http://localhost:3000/login');
console.log('4. Use credentials from the list above'); 