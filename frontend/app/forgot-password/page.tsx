'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Failed to send reset email. Please check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 w-full max-w-sm p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-[#E8501A] rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base">V</span>
          </div>
          <span className="font-bold text-xl text-gray-900">VedaAI</span>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h2 className="font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 mb-6">
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-[#E8501A] font-medium hover:underline"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2.5 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@school.com"
                  className="input-field"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-[#1E1E2E] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#2D2D40] transition-colors disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1 mt-5 text-xs text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={13} /> Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
