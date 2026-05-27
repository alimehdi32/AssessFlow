'use client';
import { Bell, ChevronDown, ArrowLeft, LayoutGrid, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export default function Header({
  title = 'Assignment',
  showBack,
  backHref = '/assignments',
}: HeaderProps) {
  const { user } = useAuthStore();
  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          {showBack && (
            <Link href={backHref} className="text-gray-400 hover:text-gray-600 mr-1">
              <ArrowLeft size={18} />
            </Link>
          )}
          <LayoutGrid size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600 font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
            <Bell size={18} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-gray-600">
                {user?.name?.charAt(0) || 'J'}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700">{user?.name || 'John Doe'}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#E8501A] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">V</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">VedaAI</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-1.5">
            <Bell size={18} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-gray-600">
              {user?.name?.charAt(0) || 'J'}
            </span>
          </div>
          <Menu size={18} className="text-gray-600" />
        </div>
      </header>
    </>
  );
}
