'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password, rememberMe);
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brandNavy to-brandPrimary p-12 flex-col justify-between">
        <div>
          <img src="/logo.jpg" alt="RSCOE Logo" className="w-16 h-16 rounded-xl object-cover mb-6" />
          <h1 className="text-3xl font-bold text-white mb-2">JSPM&apos;s Rajarshi Shahu</h1>
          <h2 className="text-2xl font-bold text-white/90 mb-1">College of Engineering</h2>
          <p className="text-white/70 text-lg">Department of Computer Science & Business Systems</p>
        </div>
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-3">CSBS Budget Management</h3>
            <ul className="space-y-2 text-white/80 text-sm">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Real-time budget tracking & analytics
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Category-wise expense management
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Receipt verification & audit trails
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                NBA/NAAC compliant reporting
              </li>
            </ul>
          </div>
          <p className="text-white/50 text-xs">
            © 2026 JSPM&apos;s RSCOE. Department of CSBS Budget Suite
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.jpg" alt="RSCOE Logo" className="w-16 h-16 rounded-xl object-cover mx-auto mb-4" />
            <h1 className="text-xl font-bold text-brandNavy">JSPM&apos;s RSCOE</h1>
            <p className="text-sm text-slate-500">CSBS Department</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-slate-500 mt-1">Sign in to access the budget portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@rscoe.edu.in"
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Remember me
                </label>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Sign In
              </Button>
            </form>


          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Login by authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}