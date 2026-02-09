'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAccountNames } from '@/context/AccountNamesContext';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Semester {
    id: number;
    name: string;
    semester_number: number;
    academic_year: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    created_at: string;
}

interface CorpusData {
    amount: number;
    bankName: string;
    accountNumber: string;
    lastUpdated: string;
    totalBudgets: number;
    unallocated: number;
    isConfigured: boolean;
}

export default function MiscellaneousPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { accountNames, updateAccountNames, refreshAccountNames } = useAccountNames();
    const router = useRouter();
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

    // Account Names Modal State
    const [isAccountNamesModalOpen, setIsAccountNamesModalOpen] = useState(false);
    const [accountNamesForm, setAccountNamesForm] = useState({
        acbs: '',
        innovision: '',
        infrastructure: '',
    });
    const [isSavingAccountNames, setIsSavingAccountNames] = useState(false);

    const [formData, setFormData] = useState({
        semester_number: '1',
        academic_year: '',
        start_date: '',
        end_date: '',
        is_active: false,
    });

    // ACBS Corpus State
    const [corpus, setCorpus] = useState<CorpusData | null>(null);
    const [isCorpusModalOpen, setIsCorpusModalOpen] = useState(false);
    const [isSavingCorpus, setIsSavingCorpus] = useState(false);
    const [corpusForm, setCorpusForm] = useState({
        amount: '',
        bankName: '',
        accountNumber: '',
    });

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && user && user.role !== 'admin') {
            router.push('/');
        }
    }, [user, authLoading, router]);

    const fetchSemesters = async () => {
        setIsFetching(true);
        try {
            const response = await fetch('/api/semesters', { credentials: 'include' });
            const result = await response.json();
            if (result.success) {
                setSemesters(result.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch semesters:', err);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchSemesters();
            fetchCorpus();
        }
    }, [user]);

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

    const resetForm = () => {
        setFormData({
            semester_number: '1',
            academic_year: '',
            start_date: '',
            end_date: '',
            is_active: false,
        });
        setEditingSemester(null);
    };

    const openAddModal = () => {
        resetForm();
        // Set default academic year based on current date
        const now = new Date();
        const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
        setFormData(prev => ({
            ...prev,
            academic_year: `${year}-${(year + 1).toString().slice(2)}`,
        }));
        setIsModalOpen(true);
    };

    const openEditModal = (semester: Semester) => {
        setEditingSemester(semester);
        setFormData({
            semester_number: semester.semester_number.toString(),
            academic_year: semester.academic_year,
            start_date: semester.start_date.split('T')[0],
            end_date: semester.end_date.split('T')[0],
            is_active: semester.is_active,
        });
        setIsModalOpen(true);
    };

    const openAccountNamesModal = () => {
        setAccountNamesForm({
            acbs: accountNames.acbs,
            innovision: accountNames.innovision,
            infrastructure: accountNames.infrastructure,
        });
        setIsAccountNamesModalOpen(true);
    };

    const handleSaveAccountNames = async () => {
        if (!accountNamesForm.acbs || !accountNamesForm.innovision || !accountNamesForm.infrastructure) {
            alert('All account names are required');
            return;
        }

        setIsSavingAccountNames(true);
        try {
            const success = await updateAccountNames(accountNamesForm);
            if (success) {
                setIsAccountNamesModalOpen(false);
                await refreshAccountNames();
            } else {
                alert('Failed to save account names');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            setIsSavingAccountNames(false);
        }
    };

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
                setCorpus(result.data);
            } else {
                alert(result.error || 'Failed to save corpus');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            setIsSavingCorpus(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.academic_year || !formData.start_date || !formData.end_date) return;

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                semester_number: parseInt(formData.semester_number),
                ...(editingSemester && { id: editingSemester.id }),
            };

            const response = await fetch('/api/semesters', {
                method: editingSemester ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (result.success) {
                setIsModalOpen(false);
                resetForm();
                fetchSemesters();
            } else {
                alert(result.error || 'Failed to save semester');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this semester?')) return;

        try {
            const response = await fetch(`/api/semesters?id=${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const result = await response.json();
            if (result.success) {
                fetchSemesters();
            } else {
                alert(result.error || 'Failed to delete semester');
            }
        } catch (err) {
            alert('Network error');
        }
    };

    const handleSetActive = async (semester: Semester) => {
        try {
            const response = await fetch('/api/semesters', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id: semester.id, is_active: true }),
            });
            const result = await response.json();
            if (result.success) {
                fetchSemesters();
            }
        } catch (err) {
            console.error('Failed to set active:', err);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-brandNavy border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500">Access denied. Admin only.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Miscellaneous Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">System configuration for administrators</p>
                </div>
            </div>

            {/* Account Names Section */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Account Names</h2>
                        <p className="text-sm text-slate-500">Rename the staff account display names</p>
                    </div>
                    <Button onClick={openAccountNamesModal}>Edit Account Names</Button>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">ACBS Account</p>
                            <p className="font-medium text-slate-900">{accountNames.acbs}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Innovision Account</p>
                            <p className="font-medium text-slate-900">{accountNames.innovision}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Infrastructure Account</p>
                            <p className="font-medium text-slate-900">{accountNames.infrastructure}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACBS Bank Account Section */}
            <div className="rounded-xl border border-blue-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-blue-200 flex items-center justify-between bg-blue-50">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">ACBS Bank Account</h2>
                        <p className="text-sm text-slate-500">Configure the corpus (total bank balance) for ACBS account</p>
                    </div>
                    <Button onClick={openCorpusModal}>
                        {corpus?.isConfigured ? 'Edit Corpus' : 'Setup ACBS Bank Account'}
                    </Button>
                </div>
                <div className="p-4">
                    {corpus?.isConfigured ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">Bank Name</p>
                                    <p className="font-medium text-slate-900">{corpus.bankName || 'Not specified'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">Account Number</p>
                                    <p className="font-medium text-slate-900">{corpus.accountNumber || 'Not specified'}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <p className="text-xs text-green-600 mb-1">Total Corpus</p>
                                    <p className="font-bold text-green-700 text-lg">{formatCurrency(corpus.amount)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">Total Budgets Allocated</p>
                                    <p className="font-semibold text-slate-700">{formatCurrency(corpus.totalBudgets)}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${corpus.unallocated >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                    <p className={`text-xs mb-1 ${corpus.unallocated >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Unallocated Amount</p>
                                    <p className={`font-semibold ${corpus.unallocated >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(corpus.unallocated)}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                                    <p className="font-medium text-slate-700">{corpus.lastUpdated ? formatDate(corpus.lastUpdated, 'dd MMM yyyy, HH:mm') : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-500">
                            <p>No corpus configured. Click &quot;Setup ACBS Bank Account&quot; to set the total bank balance for ACBS.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Semester Management Section */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Semester Configuration</h2>
                        <p className="text-sm text-slate-500">Define academic semesters with date ranges</p>
                    </div>
                    <Button onClick={openAddModal}>+ Add Semester</Button>
                </div>

                {isFetching ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="w-6 h-6 border-3 border-brandNavy border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : semesters.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No semesters configured. Add your first semester to get started.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Semester</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Academic Year</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Start Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">End Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {semesters.map((semester) => (
                                    <tr key={semester.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-slate-900">Semester {semester.semester_number}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{semester.academic_year}</td>
                                        <td className="px-4 py-3 text-slate-600">{formatDate(semester.start_date, 'dd MMM yyyy')}</td>
                                        <td className="px-4 py-3 text-slate-600">{formatDate(semester.end_date, 'dd MMM yyyy')}</td>
                                        <td className="px-4 py-3">
                                            {semester.is_active ? (
                                                <Badge variant="success">Active</Badge>
                                            ) : (
                                                <button
                                                    onClick={() => handleSetActive(semester)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    Set as Active
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(semester)}
                                                    className="p-1.5 text-slate-500 hover:text-brandNavy hover:bg-slate-100 rounded"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(semester.id)}
                                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Semester Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={editingSemester ? 'Edit Semester' : 'Add Semester'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Semester Number *</label>
                            <select
                                value={formData.semester_number}
                                onChange={(e) => setFormData({ ...formData, semester_number: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                required
                            >
                                <option value="1">Semester 1</option>
                                <option value="2">Semester 2</option>
                            </select>
                        </div>
                        <Input
                            label="Academic Year *"
                            value={formData.academic_year}
                            onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                            placeholder="e.g., 2025-26"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date *"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                        />
                        <Input
                            label="End Date *"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-brandNavy focus:ring-brandNavy"
                        />
                        <label htmlFor="is_active" className="text-sm text-slate-700">
                            Set as active semester (only one can be active)
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isSubmitting}>
                            {editingSemester ? 'Update' : 'Add'} Semester
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Account Names Modal */}
            <Modal
                isOpen={isAccountNamesModalOpen}
                onClose={() => setIsAccountNamesModalOpen(false)}
                title="Edit Account Names"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Change the display names for staff accounts. These names will be shown across the entire application.
                    </p>

                    <Input
                        label="ACBS Account Name *"
                        value={accountNamesForm.acbs}
                        onChange={(e) => setAccountNamesForm({ ...accountNamesForm, acbs: e.target.value })}
                        placeholder="e.g., ACBS"
                    />

                    <Input
                        label="Innovision Account Name *"
                        value={accountNamesForm.innovision}
                        onChange={(e) => setAccountNamesForm({ ...accountNamesForm, innovision: e.target.value })}
                        placeholder="e.g., Innovision"
                    />

                    <Input
                        label="Infrastructure Account Name *"
                        value={accountNamesForm.infrastructure}
                        onChange={(e) => setAccountNamesForm({ ...accountNamesForm, infrastructure: e.target.value })}
                        placeholder="e.g., Infrastructure"
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsAccountNamesModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveAccountNames} isLoading={isSavingAccountNames}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ACBS Corpus Modal */}
            <Modal
                isOpen={isCorpusModalOpen}
                onClose={() => setIsCorpusModalOpen(false)}
                title="Setup ACBS Bank Account"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Configure the corpus (total bank balance) for the ACBS account. This amount will be used to track budget allocations.
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
        </div>
    );
}
