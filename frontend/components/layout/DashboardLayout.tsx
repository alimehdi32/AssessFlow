'use client';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Header from './Header';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  assignmentCount?: number;
}

export default function DashboardLayout({
  children,
  title,
  showBack,
  backHref,
  assignmentCount,
}: Props) {
  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <Sidebar assignmentCount={assignmentCount} />
      <div className="flex-1 lg:ml-[200px] flex flex-col min-h-screen">
        <Header title={title} showBack={showBack} backHref={backHref} />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
