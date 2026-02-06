'use client';

import { useAuth } from '@/context/AuthContext';
import { useAccountNames } from '@/context/AccountNamesContext';

type AccountType = 'acbs' | 'innovision' | 'infrastructure';

export default function AccountTabs() {
    const { user, selectedAccount, setSelectedAccount } = useAuth();
    const { accountNames } = useAccountNames();

    // Only show tabs for HOD and Admin roles
    if (!user || user.role === 'staff') {
        return null;
    }

    const ACCOUNT_TABS: { id: AccountType; label: string }[] = [
        { id: 'acbs', label: accountNames.acbs },
        { id: 'innovision', label: accountNames.innovision },
        { id: 'infrastructure', label: accountNames.infrastructure },
    ];

    return (
        <div className="bg-white border-b border-slate-200 px-4 py-2">
            <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500 mr-3">Account:</span>
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    {ACCOUNT_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedAccount(tab.id)}
                            title={`Switch to ${tab.label} account`}
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

