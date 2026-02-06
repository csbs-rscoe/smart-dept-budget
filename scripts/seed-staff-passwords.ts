// Seed script to update staff account passwords
// Run with: npx ts-node scripts/seed-staff-passwords.ts

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

const staffAccounts = [
    { email: 'acbs@rscoe.edu.in', password: 'ACBS@123' },
    { email: 'innovision@rscoe.edu.in', password: 'Innovision@123' },
    { email: 'staff@rscoe.edu.in', password: 'Staff@123' },
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
