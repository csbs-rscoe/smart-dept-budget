'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const MONTHS = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

interface CorpusData {
    amount: number;
    bankName: string;
    accountNumber: string;
    totalBudgets: number;
    unallocated: number;
    totalExpenses: number;
    remainingBalance: number;
    isConfigured: boolean;
    lastUpdated: string;
}

interface Deposit {
    id: number;
    amount: number;
    description: string | null;
    deposit_date: string;
    created_by_name: string | null;
    created_at: string;
}

interface Semester {
    id: number;
    name: string;
    semester_number: number;
    academic_year: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

interface DepositSummary {
    totalDeposits: number;
    totalExpenses: number;
    corpusAmount: number;
    remainingBalance: number;
}

export default function ACBSBankAccountPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // Corpus state
    const [corpus, setCorpus] = useState<CorpusData | null>(null);
    const [isCorpusModalOpen, setIsCorpusModalOpen] = useState(false);
    const [isSavingCorpus, setIsSavingCorpus] = useState(false);
    const [corpusForm, setCorpusForm] = useState({
        amount: '',
        bankName: '',
        accountNumber: '',
    });

    // Deposit state
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [summary, setSummary] = useState<DepositSummary | null>(null);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isSavingDeposit, setIsSavingDeposit] = useState(false);
    const [depositForm, setDepositForm] = useState({
        amount: '',
        description: '',
        deposit_date: new Date().toISOString().split('T')[0],
    });

    // Filter state
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'dateRange' | 'semester'>('all');
    const [fromMonth, setFromMonth] = useState('');
    const [fromYear, setFromYear] = useState('');
    const [toMonth, setToMonth] = useState('');
    const [toYear, setToYear] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Redirect if not HOD
    useEffect(() => {
        if (!authLoading && user && user.role !== 'hod') {
            router.push('/');
        }
    }, [user, authLoading, router]);

    // Fetch corpus data
    const fetchCorpus = async () => {
        try {
            const response = await fetch('/api/corpus', { credentials: 'include' });
            const result = await response.json();
            if (result.success) {
                setCorpus(result.data);
            }
        } catch (err) {
            console.error('Failed to fetch corpus:', err);
        }
    };

    // Fetch deposits with filters
    const fetchDeposits = async () => {
        setIsLoading(true);
        try {
            let url = '/api/deposits';
            const params = new URLSearchParams();

            if (filterType === 'semester' && selectedSemester) {
                params.set('semester_id', selectedSemester);
            } else if (filterType === 'dateRange' && fromMonth && fromYear && toMonth && toYear) {
                params.set('from_month', fromMonth);
                params.set('from_year', fromYear);
                params.set('to_month', toMonth);
                params.set('to_year', toYear);
            }

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url, { credentials: 'include' });
            const result = await response.json();
            if (result.success) {
                setDeposits(result.data.deposits);
                setSummary(result.data.summary);
            }
        } catch (err) {
            console.error('Failed to fetch deposits:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch semesters
    const fetchSemesters = async () => {
        try {
            const response = await fetch('/api/semesters', { credentials: 'include' });
            const result = await response.json();
            if (result.success) {
                setSemesters(result.data);
            }
        } catch (err) {
            console.error('Failed to fetch semesters:', err);
        }
    };

    useEffect(() => {
        if (user?.role === 'hod') {
            fetchCorpus();
            fetchDeposits();
            fetchSemesters();
        }
    }, [user]);

    // Corpus modal
    const openCorpusModal = () => {
        setCorpusForm({
            amount: corpus?.amount?.toString() || '',
            bankName: corpus?.bankName || '',
            accountNumber: corpus?.accountNumber || '',
        });
        setIsCorpusModalOpen(true);
    };

    const handleSaveCorpus = async () => {
        if (!corpusForm.amount || parseFloat(corpusForm.amount) <= 0) {
            alert('Please enter a valid corpus amount');
            return;
        }

        setIsSavingCorpus(true);
        try {
            const response = await fetch('/api/corpus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    amount: parseFloat(corpusForm.amount),
                    bankName: corpusForm.bankName,
                    accountNumber: corpusForm.accountNumber,
                }),
            });
            const result = await response.json();
            if (result.success) {
                setIsCorpusModalOpen(false);
                fetchCorpus();
                fetchDeposits();
            } else {
                alert(result.error || 'Failed to save corpus');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            setIsSavingCorpus(false);
        }
    };

    // Deposit modal
    const handleAddDeposit = async () => {
        if (!depositForm.amount || parseFloat(depositForm.amount) <= 0) {
            alert('Please enter a valid deposit amount');
            return;
        }

        setIsSavingDeposit(true);
        try {
            const response = await fetch('/api/deposits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    amount: parseFloat(depositForm.amount),
                    description: depositForm.description || null,
                    deposit_date: depositForm.deposit_date,
                }),
            });
            const result = await response.json();
            if (result.success) {
                setIsDepositModalOpen(false);
                setDepositForm({
                    amount: '',
                    description: '',
                    deposit_date: new Date().toISOString().split('T')[0],
                });
                fetchCorpus();
                fetchDeposits();
            } else {
                alert(result.error || 'Failed to add deposit');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            setIsSavingDeposit(false);
        }
    };

    // Apply filters
    const handleApplyFilter = () => {
        fetchDeposits();
    };

    const handleClearFilter = () => {
        setFilterType('all');
        setFromMonth('');
        setFromYear('');
        setToMonth('');
        setToYear('');
        setSelectedSemester('');
        // Fetch with no filter after state update
        setTimeout(() => fetchDeposits(), 0);
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-brandNavy border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'hod') {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500">Access denied. HOD only.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">ACBS Bank Account</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage corpus, deposits, and track balances</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={openCorpusModal} variant="ghost">
                        {corpus?.isConfigured ? 'Edit Corpus' : 'Setup Corpus'}
                    </Button>
                    <Button onClick={() => setIsDepositModalOpen(true)}>
                        + Add Deposit
                    </Button>
                </div>
            </div>

            {/* Corpus Info Card */}
            {corpus?.isConfigured ? (
                <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm overflow-hidden">
                    <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">{corpus.bankName || 'ACBS Bank Account'}</h2>
                                {corpus.accountNumber && (
                                    <p className="text-xs text-slate-500">A/C: {corpus.accountNumber}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-600 font-medium mb-1">Total Corpus</p>
                                <p className="text-xl font-bold text-blue-700">{formatCurrency(corpus.amount)}</p>
                            </div>
                            <div className="p-4 bg-white rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-500 font-medium mb-1">Total Expenses</p>
                                <p className="text-xl font-semibold text-slate-700">{formatCurrency(corpus.totalExpenses)}</p>
                            </div>
                            <div className={`p-4 rounded-lg border ${corpus.remainingBalance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                <p className={`text-xs font-medium mb-1 ${corpus.remainingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Remaining Balance</p>
                                <p className={`text-xl font-bold ${corpus.remainingBalance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {formatCurrency(corpus.remainingBalance)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-8 text-center">
                    <p className="text-slate-600 mb-4">No corpus configured yet. Set up the ACBS bank account to start tracking deposits and balances.</p>
                    <Button onClick={openCorpusModal}>Setup ACBS Bank Account</Button>
                </div>
            )}

            {/* Filters */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-semibold text-slate-900 mb-3">Filter Deposits</h3>
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Filter Type</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as 'all' | 'dateRange' | 'semester')}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                            >
                                <option value="all">All Deposits</option>
                                <option value="dateRange">Date Range</option>
                                <option value="semester">Semester</option>
                            </select>
                        </div>

                        {filterType === 'dateRange' && (
                            <>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">From Month</label>
                                    <select value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                        <option value="">Month</option>
                                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">From Year</label>
                                    <input type="number" value={fromYear} onChange={(e) => setFromYear(e.target.value)} placeholder="Year" className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-24 bg-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">To Month</label>
                                    <select value={toMonth} onChange={(e) => setToMonth(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                        <option value="">Month</option>
                                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">To Year</label>
                                    <input type="number" value={toYear} onChange={(e) => setToYear(e.target.value)} placeholder="Year" className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-24 bg-white" />
                                </div>
                            </>
                        )}

                        {filterType === 'semester' && (
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Semester</label>
                                <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                    <option value="">Select Semester</option>
                                    {semesters.map(s => (
                                        <option key={s.id} value={s.id.toString()}>
                                            {s.name} {s.is_active ? '(Active)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {filterType !== 'all' && (
                            <div className="flex gap-2">
                                <Button onClick={handleApplyFilter} size="sm">Apply</Button>
                                <Button onClick={handleClearFilter} variant="ghost" size="sm">Clear</Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Deposits Table */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="w-6 h-6 border-3 border-brandNavy border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : deposits.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No deposits found{filterType !== 'all' ? ' for the selected filter' : ''}. Click &quot;+ Add Deposit&quot; to add your first deposit.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 text-slate-600">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                                    <th className="px-4 py-3 text-left font-semibold">Description</th>
                                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                                    <th className="px-4 py-3 text-left font-semibold">Added By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {deposits.map((deposit, idx) => (
                                    <tr key={deposit.id} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                                        <td className="px-4 py-3 text-slate-600">
                                            {formatDate(deposit.deposit_date, 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-4 py-3 text-slate-900">
                                            {deposit.description || <span className="text-slate-400 italic">No description</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-green-700">
                                            +{formatCurrency(deposit.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {deposit.created_by_name || 'System'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Summary Row */}
                {summary && deposits.length > 0 && (
                    <div className="border-t-2 border-slate-300 bg-slate-50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">Deposits ({filterType !== 'all' ? 'Filtered' : 'Total'})</p>
                                <p className="text-lg font-bold text-green-700">{formatCurrency(summary.totalDeposits)}</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">Total Corpus</p>
                                <p className="text-lg font-bold text-blue-700">{formatCurrency(summary.corpusAmount)}</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">Total Expenses</p>
                                <p className="text-lg font-semibold text-slate-700">{formatCurrency(summary.totalExpenses)}</p>
                            </div>
                            <div className={`p-3 rounded-lg border ${summary.remainingBalance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                <p className={`text-xs mb-1 ${summary.remainingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Remaining Balance</p>
                                <p className={`text-lg font-bold ${summary.remainingBalance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {formatCurrency(summary.remainingBalance)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Corpus Modal */}
            <Modal
                isOpen={isCorpusModalOpen}
                onClose={() => setIsCorpusModalOpen(false)}
                title="Setup ACBS Bank Account"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Configure the corpus (total bank balance) for the ACBS account.
                    </p>

                    <Input
                        label="Bank Name"
                        value={corpusForm.bankName}
                        onChange={(e) => setCorpusForm({ ...corpusForm, bankName: e.target.value })}
                        placeholder="e.g., State Bank of India"
                    />

                    <Input
                        label="Account Number"
                        value={corpusForm.accountNumber}
                        onChange={(e) => setCorpusForm({ ...corpusForm, accountNumber: e.target.value })}
                        placeholder="e.g., 12345678901234"
                    />

                    <Input
                        label="Total Corpus Amount *"
                        type="number"
                        step="0.01"
                        value={corpusForm.amount}
                        onChange={(e) => setCorpusForm({ ...corpusForm, amount: e.target.value })}
                        placeholder="Enter total bank balance"
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsCorpusModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveCorpus} isLoading={isSavingCorpus}>
                            Save Corpus
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Add Deposit Modal */}
            <Modal
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
                title="Add Deposit"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Add a new deposit to the ACBS bank account. The corpus total will be incremented automatically.
                    </p>

                    <Input
                        label="Deposit Amount *"
                        type="number"
                        step="0.01"
                        value={depositForm.amount}
                        onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                        placeholder="Enter deposit amount"
                    />

                    <Input
                        label="Description"
                        value={depositForm.description}
                        onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })}
                        placeholder="e.g., College fund allocation for Q1"
                    />

                    <Input
                        label="Deposit Date *"
                        type="date"
                        value={depositForm.deposit_date}
                        onChange={(e) => setDepositForm({ ...depositForm, deposit_date: e.target.value })}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsDepositModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddDeposit} isLoading={isSavingDeposit}>
                            Add Deposit
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
