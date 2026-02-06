import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get all settings or specific setting by key
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const key = url.searchParams.get('key');

        if (key) {
            const result = await sql`SELECT * FROM app_settings WHERE key = ${key}`;
            return NextResponse.json({
                success: true,
                data: result[0] || null
            });
        }

        // Get all settings
        const result = await sql`SELECT * FROM app_settings ORDER BY key`;

        // Convert to key-value object for easier consumption
        const settingsMap: Record<string, string> = {};
        result.forEach((row: any) => {
            settingsMap[row.key] = row.value;
        });

        return NextResponse.json({
            success: true,
            data: result,
            map: settingsMap
        });
    } catch (error: any) {
        console.error('Settings GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

// Update settings (admin only)
export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ success: false, error: 'Key and value are required' }, { status: 400 });
        }

        const result = await sql`
      UPDATE app_settings 
      SET value = ${value}, updated_at = NOW()
      WHERE key = ${key}
      RETURNING *
    `;

        if (result.length === 0) {
            return NextResponse.json({ success: false, error: 'Setting not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result[0] });
    } catch (error: any) {
        console.error('Settings PUT error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update setting' },
            { status: 500 }
        );
    }
}

// Bulk update multiple settings (admin only)
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { settings } = body; // Array of { key, value }

        if (!settings || !Array.isArray(settings)) {
            return NextResponse.json({ success: false, error: 'Settings array is required' }, { status: 400 });
        }

        for (const setting of settings) {
            if (setting.key && setting.value !== undefined) {
                await sql`
          UPDATE app_settings 
          SET value = ${setting.value}, updated_at = NOW()
          WHERE key = ${setting.key}
        `;
            }
        }

        // Return updated settings
        const result = await sql`SELECT * FROM app_settings ORDER BY key`;
        const settingsMap: Record<string, string> = {};
        result.forEach((row: any) => {
            settingsMap[row.key] = row.value;
        });

        return NextResponse.json({
            success: true,
            data: result,
            map: settingsMap
        });
    } catch (error: any) {
        console.error('Settings POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
