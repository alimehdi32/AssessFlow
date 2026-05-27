'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, FileText, Sparkles, BookOpen, Settings, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navLinks = [
  { href: '/dashboard', label: 'Home', icon: LayoutGrid },
  { href: '/groups', label: 'My Groups', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: FileText, badge: true },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: Sparkles },
  { href: '/library', label: 'My Library', icon: BookOpen },
];

export default function Sidebar({ assignmentCount = 0 }: { assignmentCount?: number }) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <aside className="hidden lg:flex flex-col w-[200px] min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#E8501A] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-bold text-gray-900 text-base">VedaAI</span>
        </div>
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 w-full bg-[#1E1E2E] text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-[#2D2D40] transition-colors"
        >
          <Plus size={14} />
          Create Assignment
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon, badge }) => {
          const isActive =
            pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium'
              }`}
            >
              <Icon
                size={16}
                className={isActive ? 'text-gray-800 flex-shrink-0' : 'text-gray-400 flex-shrink-0'}
              />
              <span className="flex-1 text-xs leading-tight">{label}</span>
              {badge && assignmentCount > 0 && (
                <span className="text-[10px] bg-[#E8501A] text-white px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                  {assignmentCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all font-medium"
        >
          <Settings size={16} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs">Settings</span>
        </Link>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2.5 py-2.5 mt-2">
          <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            <span className="text-amber-800 font-bold text-xs">
              {user?.schoolName?.charAt(0) || 'D'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-gray-800 leading-tight truncate">
              {user?.schoolName || 'Delhi Public School'}
            </p>
            <p className="text-[10px] text-gray-500 leading-tight truncate">
              {user?.schoolCity || 'Bokaro Steel City'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
