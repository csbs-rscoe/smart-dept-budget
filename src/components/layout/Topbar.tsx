'use client';
import { useState } from 'react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
  const { toggleMobile } = useSidebar();
  const { user, refreshUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const openEditModal = () => {
    setEditName(user?.name || '');
    setError('');
    setIsEditModalOpen(true);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) {
      setError('Name is required');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshUser();
        setIsEditModalOpen(false);
      } else {
        setError(data.error || 'Failed to update name');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button onClick={toggleMobile} className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Department Budget Management</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Enterprise Expense Analytics & Reporting System</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={openEditModal}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-brandNavy/5 rounded-lg hover:bg-brandNavy/10 transition-colors group"
              title="Click to edit profile"
            >
              <div className="w-6 h-6 rounded-full bg-brandNavy flex items-center justify-center">
                <span className="text-xs font-bold text-white">{user.name[0]}</span>
              </div>
              <span className="text-sm font-medium text-brandNavy">{user.name}</span>
              <svg className="w-3 h-3 text-slate-400 group-hover:text-brandNavy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Edit Profile</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brandNavy focus:border-brandNavy"
                placeholder="Enter your name"
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
            <div className="text-xs text-slate-500 mb-4">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
              {user?.account_type && <p><strong>Account:</strong> {user.account_type.toUpperCase()}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brandNavy rounded-lg hover:bg-brandNavy/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}