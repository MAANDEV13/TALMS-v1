'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Bell, 
  LogOut,
  Building2,
  FileCheck
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth, UserRole } from '@/context/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItem {
  icon: any;
  label: string;
  href: string;
  roles?: UserRole[];
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileText, label: 'Applications', href: '/licenses', roles: ['admin', 'officer'] },
  { icon: Building2, label: 'Agencies', href: '/agencies' },
  { icon: FileCheck, label: 'Approvals', href: '/approvals', roles: ['officer', 'director', 'general_director'] },
  { icon: Users, label: 'User Management', href: '/users', roles: ['admin'] },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredItems = sidebarItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50 transition-all duration-300">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-blue-400 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          <span>TALMS</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
          Travel Authority
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
              pathname.startsWith(item.href)
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              pathname.startsWith(item.href) ? "text-white" : "text-slate-500 group-hover:text-blue-400"
            )} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        {user && (
          <div className="px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-tighter">Current Role</p>
            <p className="text-sm font-semibold text-white mt-0.5 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        )}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
