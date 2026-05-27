'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { FileText, Users, BookOpen, Sparkles, Plus, TrendingUp, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const quickLinks = [
  {
    href: '/create',
    icon: Plus,
    label: 'Create Assignment',
    description: 'Generate AI-powered question papers',
    color: 'bg-[#1E1E2E] text-white',
  },
  {
    href: '/assignments',
    icon: FileText,
    label: 'My Assignments',
    description: 'View and manage your assignments',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    href: '/groups',
    icon: Users,
    label: 'My Groups',
    description: 'Organize students into groups',
    color: 'bg-purple-50 text-purple-700',
  },
  {
    href: '/toolkit',
    icon: Sparkles,
    label: "AI Toolkit",
    description: 'Rubrics, lesson plans & more',
    color: 'bg-amber-50 text-amber-700',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <DashboardLayout title="Home">
      <div className="p-4 lg:p-6">
        {/* Welcome Banner */}
        <div className="bg-[#1E1E2E] rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Good morning 👋</p>
              <h1 className="text-xl font-bold mb-1">
                {user?.name ? `Hello, ${user.name.split(' ')[0]}!` : 'Welcome to VedaAI!'}
              </h1>
              <p className="text-xs text-gray-400">
                {user?.schoolName || 'Delhi Public School'} ·{' '}
                {user?.schoolCity || 'Bokaro Steel City'}
              </p>
            </div>
            <div className="w-10 h-10 bg-[#E8501A] rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">V</span>
            </div>
          </div>

          <div className="flex gap-4 mt-5">
            <div className="bg-white/10 rounded-xl px-4 py-3 flex-1 text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-gray-400 mt-0.5">Assignments</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 flex-1 text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-gray-400 mt-0.5">Groups</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 flex-1 text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-gray-400 mt-0.5">Students</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {quickLinks.map(({ href, icon: Icon, label, description, color }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-xl p-4 flex flex-col gap-2 hover:opacity-90 transition-opacity ${color}`}
            >
              <Icon size={20} />
              <div>
                <p className="text-sm font-bold leading-tight">{label}</p>
                <p className="text-xs opacity-70 mt-0.5 leading-tight">{description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <h2 className="text-sm font-bold text-gray-900 mb-3">Recent Activity</h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-8 text-center">
          <Clock size={28} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">No recent activity</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Create your first assignment to get started
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-[#1E1E2E] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#2D2D40] transition-colors"
          >
            <Plus size={12} /> Create Assignment
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
