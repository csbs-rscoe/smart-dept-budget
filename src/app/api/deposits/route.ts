import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List deposits with optional filters
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'hod') {
            return NextResponse.json({ success: false, error: 'HOD access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const fromMonth = searchParams.get('from_month');
        const fromYear = searchParams.get('from_year');
        const toMonth = searchParams.get('to_month');
        const toYear = searchParams.get('to_year');
        const semesterId = searchParams.get('semester_id');

        let deposits: any[] = [];
        let totalExpenses = 0;
        let corpusAmount = 0;

        // Build date filter
        if (semesterId) {
            // Semester-based filter
            const semester = await sql`
                SELECT start_date, end_date FROM semesters WHERE id = ${parseInt(semesterId)}
            `;
            if (semester.length > 0) {
                deposits = await sql`
                    SELECT d.*, u.name as created_by_name
                    FROM deposits d
                    LEFT JOIN users u ON u.id = d.created_by
                    WHERE d.deposit_date >= ${semester[0].start_date}
                      AND d.deposit_date <= ${semester[0].end_date}
                    ORDER BY d.deposit_date DESC, d.created_at DESC
                `;

                // Get expenses in the same period
                const expResult = await sql`
                    SELECT COALESCE(SUM(amount), 0) as total
                    FROM expenses_new
                    WHERE account_type = 'acbs'
                      AND status = 'approved'
                      AND expense_date >= ${semester[0].start_date}
                      AND expense_date <= ${semester[0].end_date}
                `;
                totalExpenses = Number(expResult[0]?.total || 0);
            } else {
                deposits = [];
            }
        } else if (fromMonth && fromYear && toMonth && toYear) {
            // Month/Year range filter
            const fromDate = `${fromYear}-${fromMonth.padStart(2, '0')}-01`;
            const toLastDay = new Date(parseInt(toYear), parseInt(toMonth), 0).getDate();
            const toDate = `${toYear}-${toMonth.padStart(2, '0')}-${toLastDay}`;

            deposits = await sql`
                SELECT d.*, u.name as created_by_name
                FROM deposits d
                LEFT JOIN users u ON u.id = d.created_by
                WHERE d.deposit_date >= ${fromDate}
                  AND d.deposit_date <= ${toDate}
                ORDER BY d.deposit_date DESC, d.created_at DESC
            `;

            // Get expenses in the same period
            const expResult = await sql`
                SELECT COALESCE(SUM(amount), 0) as total
                FROM expenses_new
                WHERE account_type = 'acbs'
                  AND status = 'approved'
                  AND expense_date >= ${fromDate}
                  AND expense_date <= ${toDate}
            `;
            totalExpenses = Number(expResult[0]?.total || 0);
        } else {
            // No filter - get all
            deposits = await sql`
                SELECT d.*, u.name as created_by_name
                FROM deposits d
                LEFT JOIN users u ON u.id = d.created_by
                ORDER BY d.deposit_date DESC, d.created_at DESC
            `;

            // Get all approved expenses
            const expResult = await sql`
                SELECT COALESCE(SUM(amount), 0) as total
                FROM expenses_new
                WHERE account_type = 'acbs'
                  AND status = 'approved'
            `;
            totalExpenses = Number(expResult[0]?.total || 0);
        }

        // Get corpus amount
        const corpusResult = await sql`
            SELECT value FROM app_settings WHERE key = 'acbs_corpus_amount'
        `;
        corpusAmount = parseFloat(corpusResult[0]?.value || '0');

        // Calculate total deposits
        const totalDeposits = deposits.reduce((sum: number, d: any) => sum + Number(d.amount), 0);

        return NextResponse.json({
            success: true,
            data: {
                deposits: deposits.map((d: any) => ({
                    id: d.id,
                    amount: Number(d.amount),
                    description: d.description,
                    deposit_date: d.deposit_date,
                    created_by_name: d.created_by_name,
                    created_at: d.created_at,
                })),
                summary: {
                    totalDeposits,
                    totalExpenses,
                    corpusAmount,
                    remainingBalance: corpusAmount - totalExpenses,
                },
            },
        });
    } catch (error: any) {
        console.error('Deposits GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch deposits' }, { status: 500 });
    }
}

// POST - Add a new deposit
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'hod') {
            return NextResponse.json({ success: false, error: 'HOD access required' }, { status: 403 });
        }

        const body = await request.json();
        const { amount, description, deposit_date } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Valid deposit amount is required' }, { status: 400 });
        }

        // Insert the deposit
        const result = await sql`
            INSERT INTO deposits (amount, description, deposit_date, created_by)
            VALUES (${amount}, ${description || null}, ${deposit_date || new Date().toISOString().split('T')[0]}, ${user.id})
            RETURNING *
        `;

        // Update corpus amount (increment by deposit amount)
        await sql`
            UPDATE app_settings
            SET value = (CAST(value AS DECIMAL) + ${amount})::TEXT
            WHERE key = 'acbs_corpus_amount'
        `;

        // Update last updated timestamp
        await sql`
            UPDATE app_settings
            SET value = ${new Date().toISOString()}
            WHERE key = 'acbs_corpus_last_updated'
        `;

        return NextResponse.json({
            success: true,
            data: result[0],
            message: 'Deposit added successfully',
        });
    } catch (error: any) {
        console.error('Deposits POST error:', error);
        return NextResponse.json({ success: false, error: 'Failed to add deposit' }, { status: 500 });
    }
}
