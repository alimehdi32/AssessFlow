'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { LogOut, User, School, Bell, Shield, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

const settingsGroups = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Profile Information', description: 'Update your name and email' },
      { icon: School, label: 'School Details', description: 'Manage your school information' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        icon: Bell,
        label: 'Notifications',
        description: 'Configure email and push notifications',
      },
    ],
  },
  {
    title: 'Security',
    items: [
      { icon: Shield, label: 'Change Password', description: 'Update your account password' },
    ],
  },
];

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <div className="flex items-start gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Settings</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage your account and preferences.</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-800 font-bold text-xl">
                {user?.name?.charAt(0) || 'J'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{user?.name || 'Teacher'}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email || 'teacher@school.com'}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user?.schoolName || 'Delhi Public School'} ·{' '}
                {user?.schoolCity || 'Bokaro Steel City'}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
              {group.title}
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
              {group.items.map(({ icon: Icon, label, description }, idx) => (
                <button
                  key={label}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left ${
                    idx < group.items.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{description}</p>
                  </div>
                  <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors mt-2"
        >
          <LogOut size={16} />
          Sign Out
        </button>

        <p className="text-center text-xs text-gray-300 mt-5">VedaAI v1.0.0</p>
      </div>
    </DashboardLayout>
  );
}
