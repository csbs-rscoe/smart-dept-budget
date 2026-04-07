'use client';
import { useAuth } from '../../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileSidebar from './MobileSidebar';
import AccountTabs from './AccountTabs';
import { useSidebar } from '../../context/SidebarContext';

function CollapseToggle() {
  const { isCollapsed, toggle } = useSidebar();
  return (
    <button
      onClick={toggle}
      className="hidden md:flex absolute left-[256px] top-[58px] bg-white border border-slate-200 rounded-full w-7 h-7 items-center justify-center shadow-md hover:bg-slate-50 hover:shadow-lg z-[9999] transition-all"
      style={{ left: isCollapsed ? '64px' : '256px', transform: 'translateX(-50%)' }}
    >
      <svg
        className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brandNavy border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Login page doesn't need shell
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 relative">
      <CollapseToggle />
      <Sidebar />
      <MobileSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <AccountTabs />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}