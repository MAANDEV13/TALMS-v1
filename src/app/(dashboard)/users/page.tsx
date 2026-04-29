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
  Key
} from 'lucide-react';
import { MOCK_DB } from '@/lib/mockDb';

export default function UserManagementPage() {
  const [showAddUser, setShowAddUser] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'officer'
  });

  useEffect(() => {
    setUsers(MOCK_DB.get('users'));
  }, []);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    MOCK_DB.addUser(formData);
    setUsers(MOCK_DB.get('users'));
    setShowAddUser(false);
    setFormData({ name: '', email: '', password: '', role: 'officer' });
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
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" />
              <span>Filter Role</span>
            </button>
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
              {users.map((user) => (
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                      <Shield className="w-3 h-3 text-blue-500" />
                      {user.role.replace('_', ' ')}
                    </span>
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
                <h3 className="text-xl font-bold text-slate-900">Add New User</h3>
                <p className="text-sm text-slate-500 mt-1">Grant system access and assign a role.</p>
              </div>
              <button onClick={() => setShowAddUser(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-blue-600">Initial Password</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" 
                    placeholder="Enter password" 
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">User Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none"
                >
                  <option value="officer">Officer</option>
                  <option value="director">Director</option>
                  <option value="general_director">General Director</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

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
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  Confirm & Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
