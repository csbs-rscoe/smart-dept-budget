import './globals.css';
import { ReactNode } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { SidebarProvider } from '../context/SidebarContext';
import { AccountNamesProvider } from '../context/AccountNamesContext';
import AppShell from '../components/layout/AppShell';

export const metadata = {
  title: 'CSBS | Budget',
  description: 'CSBS Department Budget Management & Expense Analytics System',
  icons: {
    icon: '/logo.jpg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AccountNamesProvider>
            <SidebarProvider>
              <AppShell>{children}</AppShell>
            </SidebarProvider>
          </AccountNamesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}