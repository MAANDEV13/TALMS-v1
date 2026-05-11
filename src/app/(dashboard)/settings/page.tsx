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
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MOCK_DB } from '@/lib/mockDb';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { user } = useAuth();

  // Password change state
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleChangePassword = async () => {
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setShowPasswordPanel(false), 2000);
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const settingsGroups = [
    {
      title: 'Personal',
      items: [
        { icon: User, label: 'Profile Information', desc: 'Update your name, email and bio', color: 'blue', action: undefined },
        { icon: Lock, label: 'Password & Security', desc: 'Change your password', color: 'amber', action: () => setShowPasswordPanel(!showPasswordPanel) },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: Bell, label: 'Notifications', desc: 'Configure how you receive alerts', color: 'green', action: undefined },
        { icon: Shield, label: 'Permissions', desc: 'View your assigned role permissions', color: 'purple', action: undefined },
        { icon: Globe, label: 'Language & Region', desc: 'Set your preferred language', color: 'slate', action: undefined },
      ]
    }
  ];

  const [settings, setSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showCertPreview, setShowCertPreview] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/data?table=settings');
        if (res.ok) {
          const data = await res.json();
          const s = typeof data === 'object' && !Array.isArray(data) ? data : {};
          setSettings(s);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'settings',
            action: 'save',
            data: { key, value }
          })
        });
      }
      setMessage('Settings updated successfully!');
    } catch (err) {
      setMessage('Failed to update settings.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
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
                  <div 
                    key={iIdx} 
                    onClick={item.action}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                      item.label === 'Password & Security' && showPasswordPanel 
                        ? 'border-amber-200 bg-amber-50/30' 
                        : 'border-slate-50 hover:border-blue-100 hover:bg-blue-50/30'
                    }`}
                  >
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
                    <ChevronRight className={`w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-all ${
                      item.label === 'Password & Security' && showPasswordPanel ? 'rotate-90 text-amber-500' : ''
                    }`} />
                  </div>
                ))}
              </div>

              {/* Inline Change Password Panel */}
              {gIdx === 0 && showPasswordPanel && (
                <div className="ml-14 p-6 bg-white rounded-2xl border border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Change Password</h4>
                  </div>

                  {passwordMessage && (
                    <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-1 duration-200 ${
                      passwordMessage.type === 'success' 
                        ? 'bg-green-50 border border-green-100 text-green-700' 
                        : 'bg-red-50 border border-red-100 text-red-700'
                    }`}>
                      {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                      {passwordMessage.text}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium text-slate-900"
                        placeholder="Enter current password"
                      />
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">New Password</label>
                    <div className="relative">
                      <input 
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium text-slate-900"
                        placeholder="Min 6 characters"
                      />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">Confirm New Password</label>
                    <input 
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium text-slate-900"
                      placeholder="Re-enter new password"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => { setShowPasswordPanel(false); setPasswordMessage(null); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); }}
                      className="flex-1 py-2.5 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={passwordLoading}
                      className="flex-[2] py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                    </button>
                  </div>
                </div>
              )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-tighter">New Registration ($)</label>
                    <input 
                      type="number" 
                      value={settings.registrationFee ?? 200}
                      onChange={(e) => setSettings({...settings, registrationFee: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Application Charge (New) ($)</label>
                    <input 
                      type="number" 
                      value={settings.registrationAppFee ?? 50}
                      onChange={(e) => setSettings({...settings, registrationAppFee: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Renewal Fee ($)</label>
                    <input 
                      type="number" 
                      value={settings.renewalFee ?? 100}
                      onChange={(e) => setSettings({...settings, renewalFee: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-amber-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Application Charge (Renewal) ($)</label>
                    <input 
                      type="number" 
                      value={settings.renewalAppFee ?? 50}
                      onChange={(e) => setSettings({...settings, renewalAppFee: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Certificate Configuration Panel — Item 5 */}
              <div className="space-y-4 col-span-full pt-4 border-t border-slate-100/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Certificate Template Configuration
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCertPreview(true)}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Certificate
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">Certificate Header</label>
                    <textarea 
                      value={settings.certHeader || ''}
                      onChange={(e) => setSettings({...settings, certHeader: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm min-h-[80px] leading-relaxed text-slate-900"
                      placeholder="e.g. REPUBLIC OF SOMALILAND — MINISTRY OF CIVIL AVIATION & AIRPORT DEVELOPMENT"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">Body Section 1</label>
                      <textarea 
                        value={settings.certBody1 || settings.certAuthText || ''}
                        onChange={(e) => setSettings({...settings, certBody1: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm min-h-[100px] leading-relaxed text-slate-900"
                        placeholder="First body content / authorization text"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">Body Section 2</label>
                      <textarea 
                        value={settings.certBody2 || settings.certSuspensionText || ''}
                        onChange={(e) => setSettings({...settings, certBody2: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm min-h-[100px] leading-relaxed text-slate-900"
                        placeholder="Second body content / suspension/revocation notice"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">Signature Name</label>
                      <input 
                        type="text" 
                        value={settings.certSignatureName || settings.dgName || ''}
                        onChange={(e) => setSettings({...settings, certSignatureName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold text-slate-900"
                        placeholder="e.g. Eng. Abdiwali Jama"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">Signature Title</label>
                      <input 
                        type="text" 
                        value={settings.certSignatureTitle || settings.dgTitle || ''}
                        onChange={(e) => setSettings({...settings, certSignatureTitle: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold text-slate-900"
                        placeholder="e.g. Director General of MOCAAD"
                      />
                    </div>
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

      {/* Certificate Preview Modal */}
      {showCertPreview && settings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Certificate Preview
              </h2>
              <button onClick={() => setShowCertPreview(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                Close
              </button>
            </div>
            <div className="p-8 space-y-6">
              {/* Simulated Certificate */}
              <div className="border-2 border-slate-200 rounded-2xl p-8 bg-gradient-to-b from-white to-slate-50 space-y-6 text-center">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Certificate Preview</p>
                  <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-relaxed whitespace-pre-line">
                    {settings.certHeader || 'REPUBLIC OF SOMALILAND — MINISTRY OF CIVIL AVIATION'}
                  </h3>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="text-left space-y-4">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {settings.certBody1 || settings.certAuthText || 'Authorization text will appear here...'}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    {settings.certBody2 || settings.certSuspensionText || 'Suspension/revocation notice will appear here...'}
                  </p>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="pt-4 space-y-1">
                  <div className="w-32 h-px bg-slate-400 mx-auto" />
                  <p className="text-sm font-black text-slate-900">
                    {settings.certSignatureName || settings.dgName || 'Signature Name'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {settings.certSignatureTitle || settings.dgTitle || 'Title'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
