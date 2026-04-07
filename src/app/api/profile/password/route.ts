import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser, verifyPassword, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Change user password
export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { oldPassword, newPassword } = body;

        // Validate input
        if (!oldPassword || !newPassword) {
            return NextResponse.json({ 
                success: false, 
                error: 'Old password and new password are required' 
            }, { status: 400 });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return NextResponse.json({ 
                success: false, 
                error: 'Password must be at least 8 characters' 
            }, { status: 400 });
        }

        if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return NextResponse.json({ 
                success: false, 
                error: 'Password must contain uppercase, lowercase, and number' 
            }, { status: 400 });
        }

        // Get current user's password hash from database
        const users = await sql`
            SELECT password_hash FROM users WHERE id = ${user.id}
        `;

        if (users.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'User not found' 
            }, { status: 404 });
        }

        // Verify old password
        const isValidPassword = await verifyPassword(oldPassword, users[0].password_hash);
        
        if (!isValidPassword) {
            return NextResponse.json({ 
                success: false, 
                error: 'Old password is incorrect' 
            }, { status: 400 });
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password in database
        await sql`
            UPDATE users 
            SET password_hash = ${newPasswordHash}, updated_at = NOW()
            WHERE id = ${user.id}
        `;

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (err) {
        console.error('Password change error:', err);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to change password' 
        }, { status: 500 });
    }
}
