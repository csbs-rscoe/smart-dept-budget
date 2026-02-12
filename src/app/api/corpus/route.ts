import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface CorpusData {
    amount: number;
    bankName: string;
    accountNumber: string;
    lastUpdated: string;
}

// GET - Fetch current ACBS corpus details
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all corpus-related settings
        const result = await sql`
            SELECT key, value 
            FROM app_settings 
            WHERE key LIKE 'acbs_corpus%'
        `;

        const corpus: CorpusData = {
            amount: 0,
            bankName: '',
            accountNumber: '',
            lastUpdated: '',
        };

        result.forEach((row: any) => {
            switch (row.key) {
                case 'acbs_corpus_amount':
                    corpus.amount = parseFloat(row.value) || 0;
                    break;
                case 'acbs_corpus_bank_name':
                    corpus.bankName = row.value || '';
                    break;
                case 'acbs_corpus_account_number':
                    corpus.accountNumber = row.value || '';
                    break;
                case 'acbs_corpus_last_updated':
                    corpus.lastUpdated = row.value || '';
                    break;
            }
        });

        // Also get total budgets for ACBS to calculate unallocated
        const budgetTotal = await sql`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM budgets
            WHERE account_type = 'acbs'
            AND status = 'active'
        `;

        // Get total approved expenses for ACBS
        const expenseTotal = await sql`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expenses_new
            WHERE account_type = 'acbs'
            AND status = 'approved'
        `;

        const totalBudgets = Number(budgetTotal[0]?.total || 0);
        const unallocated = corpus.amount - totalBudgets;
        const totalExpenses = Number(expenseTotal[0]?.total || 0);
        const remainingBalance = corpus.amount - totalExpenses;

        return NextResponse.json({
            success: true,
            data: {
                ...corpus,
                totalBudgets,
                unallocated,
                totalExpenses,
                remainingBalance,
                isConfigured: corpus.amount > 0,
            },
        });
    } catch (error: any) {
        console.error('Corpus GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch corpus' },
            { status: 500 }
        );
    }
}

// POST - Create/Update ACBS corpus (HOD only)
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
        const { amount, bankName, accountNumber } = body;

        if (amount === undefined || amount < 0) {
            return NextResponse.json({ success: false, error: 'Valid corpus amount is required' }, { status: 400 });
        }

        const now = new Date().toISOString();

        // Update all corpus settings using upsert
        const settings = [
            { key: 'acbs_corpus_amount', value: amount.toString() },
            { key: 'acbs_corpus_bank_name', value: bankName || '' },
            { key: 'acbs_corpus_account_number', value: accountNumber || '' },
            { key: 'acbs_corpus_last_updated', value: now },
        ];

        for (const setting of settings) {
            await sql`
                INSERT INTO app_settings (key, value, updated_at)
                VALUES (${setting.key}, ${setting.value}, NOW())
                ON CONFLICT (key) 
                DO UPDATE SET value = ${setting.value}, updated_at = NOW()
            `;
        }

        // Fetch total budgets to return complete data
        const budgetTotal = await sql`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM budgets
            WHERE account_type = 'acbs'
            AND status = 'active'
        `;

        const totalBudgets = Number(budgetTotal[0]?.total || 0);

        return NextResponse.json({
            success: true,
            data: {
                amount: parseFloat(amount),
                bankName: bankName || '',
                accountNumber: accountNumber || '',
                lastUpdated: now,
                totalBudgets,
                unallocated: parseFloat(amount) - totalBudgets,
                isConfigured: true,
            },
        });
    } catch (error: any) {
        console.error('Corpus POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save corpus' },
            { status: 500 }
        );
    }
}
