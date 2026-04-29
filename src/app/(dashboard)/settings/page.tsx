'use client';

import React from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Globe, 
  CreditCard,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  const settingsGroups = [
    {
      title: 'Personal',
      items: [
        { icon: User, label: 'Profile Information', desc: 'Update your name, email and bio', color: 'blue' },
        { icon: Lock, label: 'Password & Security', desc: 'Manage your password and 2FA', color: 'amber' },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: Bell, label: 'Notifications', desc: 'Configure how you receive alerts', color: 'green' },
        { icon: Shield, label: 'Permissions', desc: 'View your assigned role permissions', color: 'purple' },
        { icon: Globe, label: 'Language & Region', desc: 'Set your preferred language', color: 'slate' },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and system configuration.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center gap-6 bg-slate-50/50">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl font-bold shadow-xl shadow-blue-600/20 border-4 border-white">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-slate-500 font-medium">{user?.email}</p>
            <span className="inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-tight">
              {user?.role.replace('_', ' ')}
            </span>
          </div>
          <button className="ml-auto px-5 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
            Edit Profile
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {settingsGroups.map((group, gIdx) => (
            <div key={gIdx} className="p-8 space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{group.title} Settings</h3>
              <div className="space-y-3">
                {group.items.map((item, iIdx) => (
                  <div key={iIdx} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        item.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                        item.color === 'green' ? 'bg-green-100 text-green-600' :
                        item.color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-red-50/30 border-t border-slate-100">
          <button className="flex items-center gap-2 text-red-600 font-bold hover:underline">
            <LogOut className="w-4 h-4" />
            Sign out from all devices
          </button>
        </div>
      </div>
    </div>
  );
}
