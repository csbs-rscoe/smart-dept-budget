import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser, canPerformAction } from '@/lib/auth';
import { formatCurrency, formatDate, getCurrentFiscalYear } from '@/lib/utils';
import { generateBudgetReportExcel, generateExpenseReportExcel } from '@/lib/excel';
import { generateBudgetReportPDF, generateExpenseReportPDF } from '@/lib/pdf-report';

export const dynamic = 'force-dynamic';

const COLLEGE_NAME = "JSPM's Rajarshi Shahu College of Engineering";

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, format = 'excel', from_month, to_month, from_year, to_year, year, account_type } = body;
    const reportFromYear = from_year || year || new Date().getFullYear().toString();
    const reportToYear = to_year || reportFromYear;

    // Determine effective account type for filtering
    const effectiveAccountType = user.role === 'staff' && user.account_type
      ? user.account_type
      : (account_type || 'acbs');

    // Build date range
    const fromDate = from_month ? new Date(parseInt(reportFromYear), parseInt(from_month) - 1, 1) : null;
    const toDate = to_month ? new Date(parseInt(reportToYear), parseInt(to_month), 0) : null;

    // Build date range string for display
    let dateRangeStr = `Year ${reportFromYear}${reportFromYear !== reportToYear ? ' - ' + reportToYear : ''}`;
    if (from_month && to_month) {
      if (from_month === to_month && reportFromYear === reportToYear) {
        dateRangeStr = `${MONTH_NAMES[parseInt(from_month) - 1]} ${reportFromYear}`;
      } else if (reportFromYear === reportToYear) {
        dateRangeStr = `${MONTH_NAMES[parseInt(from_month) - 1]} - ${MONTH_NAMES[parseInt(to_month) - 1]} ${reportFromYear}`;
      } else {
        dateRangeStr = `${MONTH_NAMES[parseInt(from_month) - 1]} ${reportFromYear} - ${MONTH_NAMES[parseInt(to_month) - 1]} ${reportToYear}`;
      }
    }

    // Fetch department name
    const deptResult = await sql`SELECT name FROM departments WHERE id = ${user.department_id}`;
    const departmentName = deptResult.length > 0 ? deptResult[0].name : 'Department';

    const reportOptions = {
      collegeName: COLLEGE_NAME,
      departmentName: `Department: ${departmentName}`,
      dateRange: dateRangeStr,
      generatedBy: user.name,
      generatedAt: formatDate(new Date(), 'dd MMM yyyy HH:mm'),
    };

    // Fetch ACBS corpus for remaining balance in reports
    let corpusAmount: number | undefined;
    if (effectiveAccountType === 'acbs') {
      const corpusResult = await sql`SELECT value FROM app_settings WHERE key = 'acbs_corpus_amount'`;
      const amt = parseFloat(corpusResult[0]?.value || '0');
      if (amt > 0) corpusAmount = amt;
    }

    let filename = '';
    let contentType = '';
    let buffer: Buffer;

    if (type === 'budget') {
      // Fetch budget data
      let data: any[];
      if (fromDate && toDate) {
        data = await sql`
          SELECT 
            b.budget_date,
            b.name,
            c.name as category_name,
            b.amount,
            b.source,
            b.payment_method,
            b.status
          FROM budgets b
          LEFT JOIN categories c ON c.id = b.category_id
          WHERE b.department_id = ${user.department_id}
            AND b.account_type = ${effectiveAccountType}
            AND b.budget_date >= ${fromDate.toISOString().split('T')[0]}
            AND b.budget_date <= ${toDate.toISOString().split('T')[0]}
          ORDER BY b.budget_date DESC
        `;
      } else {
        data = await sql`
          SELECT 
            b.budget_date,
            b.name,
            c.name as category_name,
            b.amount,
            b.source,
            b.payment_method,
            b.status
          FROM budgets b
          LEFT JOIN categories c ON c.id = b.category_id
          WHERE b.department_id = ${user.department_id}
            AND b.account_type = ${effectiveAccountType}
            AND EXTRACT(YEAR FROM b.budget_date) = ${parseInt(reportFromYear)}
          ORDER BY b.budget_date DESC
        `;
      }

      const options = { ...reportOptions, title: 'Budget Report' };

      if (format === 'excel') {
        buffer = await generateBudgetReportExcel(data, options, corpusAmount);
        filename = `budget-report-${reportFromYear}${reportFromYear !== reportToYear ? '-' + reportToYear : ''}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        buffer = await generateBudgetReportPDF(data, options, corpusAmount);
        filename = `budget-report-${reportFromYear}${reportFromYear !== reportToYear ? '-' + reportToYear : ''}.pdf`;
        contentType = 'application/pdf';
      }
    } else if (type === 'expense') {
      // Fetch expense data with budget info
      let data: any[];
      if (fromDate && toDate) {
        data = await sql`
          SELECT 
            e.expense_date,
            e.name,
            e.amount,
            b.name as budget_name,
            c.name as category_name,
            e.spender,
            e.payment_method,
            e.status
          FROM expenses_new e
          LEFT JOIN budgets b ON b.id = e.budget_id
          LEFT JOIN categories c ON c.id = e.category_id
          WHERE e.department_id = ${user.department_id}
            AND e.account_type = ${effectiveAccountType}
            AND e.expense_date >= ${fromDate.toISOString().split('T')[0]}
            AND e.expense_date <= ${toDate.toISOString().split('T')[0]}
          ORDER BY e.expense_date DESC
        `;
      } else {
        data = await sql`
          SELECT 
            e.expense_date,
            e.name,
            e.amount,
            b.name as budget_name,
            c.name as category_name,
            e.spender,
            e.payment_method,
            e.status
          FROM expenses_new e
          LEFT JOIN budgets b ON b.id = e.budget_id
          LEFT JOIN categories c ON c.id = e.category_id
          WHERE e.department_id = ${user.department_id}
            AND e.account_type = ${effectiveAccountType}
            AND EXTRACT(YEAR FROM e.expense_date) = ${parseInt(reportFromYear)}
          ORDER BY e.expense_date DESC
        `;
      }

      const options = { ...reportOptions, title: 'Expense Report' };

      if (format === 'excel') {
        buffer = await generateExpenseReportExcel(data, options, corpusAmount);
        filename = `expense-report-${reportFromYear}${reportFromYear !== reportToYear ? '-' + reportToYear : ''}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        buffer = await generateExpenseReportPDF(data, options, corpusAmount);
        filename = `expense-report-${reportFromYear}${reportFromYear !== reportToYear ? '-' + reportToYear : ''}.pdf`;
        contentType = 'application/pdf';
      }
    } else {
      return NextResponse.json(
        { success: false, error: `Unknown report type: ${type}` },
        { status: 400 }
      );
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('Report download error:', error);
    return NextResponse.json(
      { success: false, error: 'Report generation failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}