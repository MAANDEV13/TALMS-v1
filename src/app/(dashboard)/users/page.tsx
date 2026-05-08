'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  Mail,
  Filter,
  CheckCircle2,
  XCircle,
  Key,
  Send,
  Loader2
} from 'lucide-react';

export default function UserManagementPage() {
  const [showAddUser, setShowAddUser] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sending, setSending] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'officer',
    region: ''
  });

  const somalilandRegions = [
    'Maroodi Jeex',
    'Togdheer',
    'Sanaag',
    'Awdal',
    'Sool',
    'Gabiley',
    'Saaxil'
  ];

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/data?table=users');
        if (res.ok) {
          const data = await res.json();
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch { /* ignore */ }
    }
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setInviteStatus(null);

    try {
      const res = await fetch('/api/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setInviteStatus({ type: 'success', message: `Invitation sent to ${formData.email} successfully!` });
        setFormData({ name: '', email: '', role: 'officer', region: '' });
        setTimeout(() => {
          setShowAddUser(false);
          setInviteStatus(null);
        }, 3000);
      } else {
        setInviteStatus({ type: 'error', message: data.error || 'Failed to send invitation' });
      }
    } catch {
      setInviteStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage system users, roles, and access permissions.</p>
        </div>
        <button 
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add New User</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 outline-none"
            >
              <option value="All">All Roles</option>
              <option value="officer">Officer</option>
              <option value="regional_director">Regional Officer</option>
              <option value="director">Director</option>
              <option value="general_director">General Director</option>
              <option value="minister">Minister</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.filter(u => {
                const s = searchTerm.toLowerCase();
                const matchesSearch = (u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s);
                const matchesRole = filterRole === 'All' || u.role === filterRole;
                return matchesSearch && matchesRole;
              }).map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize w-fit">
                        <Shield className="w-3 h-3 text-blue-500" />
                        {user.role.replace('_', ' ')}
                      </span>
                      {user.region && (
                        <span className="text-[10px] font-bold text-slate-400 ml-1">
                          Region: {user.region}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Send Invitation</h3>
                <p className="text-sm text-slate-500 mt-1">Invite a user via email to join TALMS.</p>
              </div>
              <button onClick={() => { setShowAddUser(false); setInviteStatus(null); }} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form className="p-8 space-y-5" onSubmit={handleCreateUser}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. Abdirahman Yusuf" 
                  required 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="name@agency.gov" 
                  required 
                />
              </div>

              {inviteStatus && (
                <div className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-2 ${inviteStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {inviteStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {inviteStatus.message}
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-xs font-bold text-blue-700">📧 An invitation email will be sent. The user will set their own password when accepting.</p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">User Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value, region: e.target.value === 'regional_director' ? somalilandRegions[0] : ''})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none"
                >
                  <option value="officer">Officer</option>
                  <option value="regional_director">Regional Officer</option>
                  <option value="director">Director</option>
                  <option value="general_director">General Director</option>
                  <option value="minister">Minister</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formData.role === 'regional_director' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-blue-600">Assigned Region</label>
                  <select 
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/50 focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-blue-900"
                    required
                  >
                    {somalilandRegions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={sending}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
