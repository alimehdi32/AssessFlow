'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, Plus } from 'lucide-react';

export default function GroupsPage() {
  return (
    <DashboardLayout title="My Groups">
      <div className="p-4 lg:p-6">
        <div className="flex items-start gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">My Groups</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Organize your students into groups for better management.
            </p>
          </div>
        </div>

        <div className="border-2 border-[#7C3AED] rounded-2xl bg-white flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
            <Users size={28} className="text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No groups yet</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
            Create groups to organize your students and assign work more efficiently.
          </p>
          <button className="flex items-center gap-2 bg-[#1E1E2E] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#2D2D40] transition-colors">
            <Plus size={14} /> Create Group
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
