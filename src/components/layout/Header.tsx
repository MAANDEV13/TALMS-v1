'use client';

import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-64 z-40 flex items-center justify-between px-8">
      <div className="relative w-96">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
          placeholder="Search applications, agencies..."
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-all">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-none">{user?.name || 'Guest User'}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium capitalize">{user?.role.replace('_', ' ') || 'No Role'}</p>
          </div>
          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
