import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const dbResult = await sql`SELECT current_database(), current_user, inet_server_addr() as server`;
        
        // Check which users exist
        const users = await sql`SELECT email, name, role FROM users ORDER BY email`;
        
        // Masked DATABASE_URL
        const raw = process.env.DATABASE_URL || 'NOT SET';
        const masked = raw.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
        
        return NextResponse.json({ 
            database: dbResult,
            masked_url: masked,
            user_count: users.length,
            users: users
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message });
    }
}
