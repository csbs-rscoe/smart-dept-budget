'use client';

import { useAuth } from '@/context/AuthContext';

type AccountType = 'acbs' | 'innovision' | 'infrastructure';

const ACCOUNT_TABS: { id: AccountType; label: string; description: string }[] = [
    { id: 'acbs', label: 'ACBS', description: 'Association of Computer Business Systems' },
    { id: 'innovision', label: 'Innovision', description: 'Annual Flagship Event' },
    { id: 'infrastructure', label: 'Infrastructure', description: 'Infrastructure Account' },
];

export default function AccountTabs() {
    const { user, selectedAccount, setSelectedAccount } = useAuth();

    // Only show tabs for HOD and Admin roles
    if (!user || user.role === 'staff') {
        return null;
    }

    return (
        <div className="bg-white border-b border-slate-200 px-4 py-2">
            <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500 mr-3">Account:</span>
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    {ACCOUNT_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedAccount(tab.id)}
                            title={tab.description}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${selectedAccount === tab.id
                                    ? 'bg-brandNavy text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
