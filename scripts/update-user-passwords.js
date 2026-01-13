

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'database.sqlite');
const PASSWORD = 'password123';
const SALT_ROUNDS = 10;

async function updatePasswords() {
  console.log('\n=== User Password Hash Updater ===\n');
  console.log(`Database: ${DB_PATH}\n`);

  // Generate hash
  const hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  console.log(`Generated hash for "${PASSWORD}":\n  ${hash}\n`);

  // Open database
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('✗ Error opening database:', err.message);
      process.exit(1);
    }
  });

  // Update all users to use the same password hash
  db.run(
    `UPDATE users SET passwordHash = ?`,
    [hash],
    function(err) {
      if (err) {
        console.error('✗ Error updating passwords:', err.message);
        db.close();
        process.exit(1);
      }

      console.log(`✓ Updated ${this.changes} user(s) with new password hash\n`);

      // Verify the update
      db.all(
        `SELECT id, email, role, passwordHash FROM users ORDER BY email`,
        [],
        (err, rows) => {
          if (err) {
            console.error('✗ Error reading users:', err.message);
          } else {
            console.log('Current users in database:\n');
            rows.forEach(row => {
              const hashPreview = row.passwordHash.substring(0, 20) + '...';
              console.log(`  - ${row.email.padEnd(25)} | Role: ${row.role.padEnd(6)} | Hash: ${hashPreview}`);
            });
            console.log('\n✓ All users can now log in with password: "password123"\n');
          }

          db.close();
        }
      );
    }
  );
}

updatePasswords().catch(err => {
  console.error('✗ Unexpected error:', err);
  process.exit(1);
});
