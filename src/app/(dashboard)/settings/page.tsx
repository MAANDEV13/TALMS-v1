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
  LogOut,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MOCK_DB } from '@/lib/mockDb';
import { useEffect, useState } from 'react';

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

  const [settings, setSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const s = await MOCK_DB.getSettingsAsync();
      if (s && typeof s === 'object' && !Array.isArray(s)) setSettings(s);
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await MOCK_DB.saveSettings(settings);
    setIsSaving(false);
    setMessage('Settings updated successfully!');
    setTimeout(() => setMessage(null), 3000);
  };

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

        {/* Admin Settings Section */}
        {user?.role === 'admin' && settings && (
          <div className="p-8 space-y-8 border-t border-slate-100 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Global System Configuration</h3>
                <p className="text-xs text-slate-500 font-medium">Administrator only access to financial and legal content.</p>
              </div>
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {message && (
              <div className="p-4 bg-green-100 border border-green-200 text-green-700 rounded-xl font-bold text-sm animate-in fade-in slide-in-from-top-2">
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Financial Settings */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Financial Fees
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-tighter">New Registration ($)</label>
                    <input 
                      type="number" 
                      value={settings.registrationFee}
                      onChange={(e) => setSettings({...settings, registrationFee: parseInt(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Renewal Fee ($)</label>
                    <input 
                      type="number" 
                      value={settings.renewalFee || 0}
                      onChange={(e) => setSettings({...settings, renewalFee: parseInt(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-amber-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Application Fee ($)</label>
                    <input 
                      type="number" 
                      value={settings.applicationFee}
                      onChange={(e) => setSettings({...settings, applicationFee: parseInt(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Certificate Data */}
              <div className="space-y-4 col-span-full pt-4 border-t border-slate-100/50">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  Certificate Data
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">Director General Name</label>
                      <input 
                        type="text" 
                        value={settings.dgName || ''}
                        onChange={(e) => setSettings({...settings, dgName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold text-slate-900"
                        placeholder="e.g. Eng. Abdiwali Jama"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">Director General Title</label>
                      <input 
                        type="text" 
                        value={settings.dgTitle || ''}
                        onChange={(e) => setSettings({...settings, dgTitle: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold text-slate-900"
                        placeholder="e.g. Director General of MOCAAD"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">Authorization Text</label>
                    <textarea 
                      value={settings.certAuthText || ''}
                      onChange={(e) => setSettings({...settings, certAuthText: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm min-h-[100px] leading-relaxed text-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">Suspension/Revocation Notice</label>
                    <textarea 
                      value={settings.certSuspensionText || ''}
                      onChange={(e) => setSettings({...settings, certSuspensionText: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm min-h-[80px] leading-relaxed text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        <div className="p-8 bg-slate-50/30 border-t border-slate-100">
          <button className="flex items-center gap-2 text-red-600 font-bold hover:underline">
            <LogOut className="w-4 h-4" />
            Sign out from all devices
          </button>
        </div>
      </div>
    </div>
  );
}
