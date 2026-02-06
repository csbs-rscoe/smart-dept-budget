'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface AccountNames {
    acbs: string;
    innovision: string;
    infrastructure: string;
}

const DEFAULT_NAMES: AccountNames = {
    acbs: 'ACBS',
    innovision: 'Innovision',
    infrastructure: 'Infrastructure',
};

interface AccountNamesContextType {
    accountNames: AccountNames;
    isLoading: boolean;
    refreshAccountNames: () => Promise<void>;
    updateAccountNames: (names: AccountNames) => Promise<boolean>;
}

const AccountNamesContext = createContext<AccountNamesContextType | undefined>(undefined);

export function AccountNamesProvider({ children }: { children: ReactNode }) {
    const [accountNames, setAccountNames] = useState<AccountNames>(DEFAULT_NAMES);
    const [isLoading, setIsLoading] = useState(true);

    const refreshAccountNames = useCallback(async () => {
        try {
            const response = await fetch('/api/settings', { credentials: 'include' });
            const result = await response.json();

            if (result.success && result.map) {
                setAccountNames({
                    acbs: result.map['account_name_acbs'] || DEFAULT_NAMES.acbs,
                    innovision: result.map['account_name_innovision'] || DEFAULT_NAMES.innovision,
                    infrastructure: result.map['account_name_infrastructure'] || DEFAULT_NAMES.infrastructure,
                });
            }
        } catch (error) {
            console.error('Failed to fetch account names:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateAccountNames = useCallback(async (names: AccountNames): Promise<boolean> => {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    settings: [
                        { key: 'account_name_acbs', value: names.acbs },
                        { key: 'account_name_innovision', value: names.innovision },
                        { key: 'account_name_infrastructure', value: names.infrastructure },
                    ],
                }),
            });

            const result = await response.json();
            if (result.success) {
                setAccountNames(names);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to update account names:', error);
            return false;
        }
    }, []);

    useEffect(() => {
        refreshAccountNames();
    }, [refreshAccountNames]);

    return (
        <AccountNamesContext.Provider
            value={{
                accountNames,
                isLoading,
                refreshAccountNames,
                updateAccountNames,
            }}
        >
            {children}
        </AccountNamesContext.Provider>
    );
}

export function useAccountNames() {
    const context = useContext(AccountNamesContext);
    if (!context) {
        throw new Error('useAccountNames must be used within AccountNamesProvider');
    }
    return context;
}
