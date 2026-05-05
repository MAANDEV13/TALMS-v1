'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Building2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { MOCK_DB } from '@/lib/mockDb';
import { useAuth } from '@/context/AuthContext';

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [filterAction, setFilterAction] = useState('All');

  useEffect(() => {
    MOCK_DB.init();
    setActivities(MOCK_DB.get('activities') || []);
  }, []);

  const filteredActivities = activities.filter(a => {
    const searchMatch = 
      (a.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.target || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const actionMatch = filterAction === 'All' || (a.action || '').toLowerCase().includes(filterAction.toLowerCase());
    
    return searchMatch && actionMatch;
  });

  if (user?.role !== 'admin' && user?.role !== 'general_director') {
    return <div className="p-20 text-center text-slate-500 font-bold">Unauthorized. Access restricted to Admin and General Director.</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Audit Logs</h1>
          <p className="text-slate-500 mt-1">Chronological record of all administrative actions and security events.</p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 gap-3 items-center shadow-xl shadow-slate-900/10">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <p className="text-sm font-bold text-blue-100 uppercase tracking-widest">Audit Mode Active</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search logs by user, action or agency..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 outline-none"
            >
              <option value="All">All Activities</option>
              <option value="Approved">Approved</option>
              <option value="Submitted">Submitted</option>
              <option value="Issued">Issued</option>
              <option value="Updated">Updated</option>
              <option value="Deleted">Deleted</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Administrator</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action Taken</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredActivities.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                        <User className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{log.user}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Authorized Session</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-700">{log.action}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{log.target}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-slate-900 font-black text-sm">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {log.time}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{log.date}</p>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredActivities.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <div className="space-y-4">
                      <History className="w-12 h-12 text-slate-200 mx-auto" />
                      <p className="text-slate-400 font-medium italic">No activity matching your search was found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Audit Compliance Notice</h4>
          <p className="text-xs text-blue-700 font-medium leading-relaxed mt-1">
            This activity log is an immutable record used for internal ministerial auditing. It tracks all high-level modifications to the travel agency registry and ensures absolute accountability for departmental decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
