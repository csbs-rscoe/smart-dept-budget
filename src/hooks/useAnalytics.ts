'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentFiscalYear } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export interface RecentActivity {
  id: number;
  type: 'budget' | 'expense';
  activity_type: string;
  name: string;
  amount: number;
  date: string;
  status: string;
  category_name?: string;
  budget_name?: string;
}

export interface UpcomingEvent {
  id: number;
  type: 'budget' | 'breakdown';
  event_type: string;
  name: string;
  amount: number;
  date: string;
  expense_name?: string;
}

export interface AnalyticsData {
  fiscalYear: string;
  summary: {
    totalBudget: number;
    totalSpent: number;
    pendingAmount: number;
    remaining: number;
    utilization: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    budgetCount: number;
    corpus: {
      amount: number;
      bankName: string;
      lastUpdated: string;
      totalBudgets: number;
      unallocated: number;
    } | null;
  };
  monthlyTrend: Array<{ month: string; total: number }>;
  categoryBreakdown: Array<{ category: string; total: number }>;
  recentActivity: RecentActivity[];
  upcomingEvents: UpcomingEvent[];
  recentExpenses: Array<{
    id: number;
    name: string;
    amount: number;
    expense_date: string;
    status: string;
    category_name: string;
  }>;
}

export function useAnalytics(fiscalYear?: string) {
  const { effectiveAccountType } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevAccountType = useRef<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fy = fiscalYear || getCurrentFiscalYear();
      const response = await fetch(`/api/analytics?fiscal_year=${fy}&account_type=${effectiveAccountType}`, {
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fiscalYear, effectiveAccountType]);

  useEffect(() => {
    // Refetch when account type changes
    if (prevAccountType.current !== effectiveAccountType) {
      prevAccountType.current = effectiveAccountType;
      fetchAnalytics();
    }
  }, [effectiveAccountType, fetchAnalytics]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    data,
    isLoading,
    error,
    refresh: fetchAnalytics,
  };
}