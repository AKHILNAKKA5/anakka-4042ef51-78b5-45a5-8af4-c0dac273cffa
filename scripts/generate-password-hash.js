

const bcrypt = require('bcrypt');

const password = process.argv[2] || 'password123';
const saltRounds = 10;

console.log('\n=== Password Hash Generator ===\n');
console.log(`Generating bcrypt hash for: "${password}"`);
console.log(`Salt rounds: ${saltRounds}\n`);

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('✓ Hash generated successfully!\n');
    console.log('Copy this hash for your database:\n');
    console.log(`  ${hash}\n`);
    console.log('IMPORTANT: Use this EXACT hash when seeding users to ensure');
    console.log('bcrypt.compare() works correctly during login.\n');
    console.log('Example SQL UPDATE statement:\n');
    console.log(`  UPDATE users SET passwordHash = '${hash}' WHERE email = 'admin@example.com';\n`);
  })
  .catch(err => {
    console.error('✗ Error generating hash:', err);
    process.exit(1);
  });
