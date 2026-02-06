// Seed script to update staff account passwords
// Run with: node scripts/seed-staff-passwords.js
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const sql = neon(process.env.DATABASE_URL);

const staffAccounts = [
    { email: 'acbs@rscoe.edu.in', password: 'ACBS@123' },
    { email: 'innovision@rscoe.edu.in', password: 'Innovision@123' },
    { email: 'staff@rscoe.edu.in', password: 'Staff@123' },  // Infrastructure account
];

async function seedPasswords() {
    console.log('Updating staff account passwords...');

    for (const account of staffAccounts) {
        const hash = await bcrypt.hash(account.password, 12);
        await sql`
      UPDATE users 
      SET password_hash = ${hash}
      WHERE email = ${account.email}
    `;
        console.log(`Updated password for ${account.email}`);
    }

    console.log('Done!');
}

seedPasswords().catch(console.error);
