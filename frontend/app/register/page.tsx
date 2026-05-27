'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff } from 'lucide-react';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    schoolName: z.string().min(2, 'School name is required'),
    schoolCity: z.string().min(2, 'City is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const { confirmPassword: _, ...payload } = data;
      const res = await api.post('/auth/register', payload);
      setAuth(res.data.data.user, res.data.data.accessToken);
      router.push('/assignments');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 w-full max-w-sm p-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-[#E8501A] rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base">V</span>
          </div>
          <span className="font-bold text-xl text-gray-900">VedaAI</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-500 mb-5">Set up your teacher dashboard</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Full Name</label>
            <input
              {...register('name')}
              type="text"
              placeholder="Jane Smith"
              className="input-field"
              autoComplete="name"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="teacher@school.com"
              className="input-field"
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">School Name</label>
              <input
                {...register('schoolName')}
                type="text"
                placeholder="DPS Bokaro"
                className="input-field"
              />
              {errors.schoolName && (
                <p className="text-xs text-red-500 mt-1">{errors.schoolName.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">City</label>
              <input
                {...register('schoolCity')}
                type="text"
                placeholder="Mumbai"
                className="input-field"
              />
              {errors.schoolCity && (
                <p className="text-xs text-red-500 mt-1">{errors.schoolCity.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="input-field pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">
              Confirm Password
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className="input-field pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1E1E2E] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#2D2D40] transition-colors disabled:opacity-60 mt-1"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-[#E8501A] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
