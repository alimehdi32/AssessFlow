'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, FileText, BookOpen, Sparkles } from 'lucide-react';

const mobileNav = [
  { href: '/dashboard', label: 'Home', icon: LayoutGrid },
  { href: '/assignments', label: 'Assignments', icon: FileText },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/toolkit', label: 'AI Toolkit', icon: Sparkles },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E1E2E] flex items-center justify-around px-2 py-2">
      {mobileNav.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5"
          >
            <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
            <span
              className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
