'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BookOpen, Plus, FolderOpen } from 'lucide-react';

export default function LibraryPage() {
  return (
    <DashboardLayout title="My Library">
      <div className="p-4 lg:p-6">
        <div className="flex items-start gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">My Library</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Store and organize your educational resources.
            </p>
          </div>
        </div>

        <div className="border-2 border-[#7C3AED] rounded-2xl bg-white flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
            <FolderOpen size={28} className="text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Your library is empty</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
            Save your assignments, resources, and materials here for easy access later.
          </p>
          <button className="flex items-center gap-2 bg-[#1E1E2E] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#2D2D40] transition-colors">
            <Plus size={14} /> Add Resource
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
