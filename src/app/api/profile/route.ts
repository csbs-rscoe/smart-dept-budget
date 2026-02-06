import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Update user profile (name)
export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        }

        const result = await sql`
      UPDATE users 
      SET name = ${name.trim()}, updated_at = NOW()
      WHERE id = ${user.id}
      RETURNING id, name, email, role, account_type
    `;

        if (result.length === 0) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: result[0],
            message: 'Profile updated successfully'
        });
    } catch (err) {
        console.error('Profile update error:', err);
        return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
    }
}

// Get current user profile
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                account_type: user.account_type,
            }
        });
    } catch (err) {
        console.error('Profile fetch error:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
    }
}
