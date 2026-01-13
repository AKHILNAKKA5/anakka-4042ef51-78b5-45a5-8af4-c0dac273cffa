
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

const users = [
  { email: 'admin@test.com', role: 'OWNER' },
  { email: 'admin2@test.com', role: 'ADMIN' },
  { email: 'viewer@test.com', role: 'VIEWER' }
];

async function testLogin(email, role) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: email,
      password: 'password123'
    });

    const token = response.data.access_token;
    console.log(`✓ ${role.padEnd(6)} (${email.padEnd(25)}) - Login successful`);
    console.log(`  Token: ${token.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.log(`✗ ${role.padEnd(6)} (${email.padEnd(25)}) - Login failed`);
    if (error.response) {
      console.log(`  Error: ${error.response.data.message}`);
    } else {
      console.log(`  Error: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('\n=== Authentication Test for All Roles ===\n');
  
  let allPassed = true;
  for (const user of users) {
    const passed = await testLogin(user.email, user.role);
    allPassed = allPassed && passed;
    console.log('');
  }

  console.log('=====================================\n');
  if (allPassed) {
    console.log('✓ All users authenticated successfully!\n');
  } else {
    console.log('✗ Some users failed to authenticate.\n');
    process.exit(1);
  }
}

runTests();
