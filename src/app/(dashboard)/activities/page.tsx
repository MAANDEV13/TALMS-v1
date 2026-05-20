'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('All');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadActivities = useCallback(async () => {
    try {
      const res = await fetch('/api/data?table=activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Auto-refresh every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(loadActivities, 10000);
    return () => clearInterval(interval);
  }, [loadActivities]);

  // Format time in GMT+3
  const formatGMT3 = (dateStr: string) => {
    if (!dateStr) return { time: '', date: '' };
    try {
      const d = new Date(dateStr);
      return {
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' }),
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Africa/Nairobi' })
      };
    } catch {
      return { time: dateStr, date: '' };
    }
  };

  const filteredActivities = activities.filter(a => {
    const searchMatch = 
      (a.user || a.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <div className="flex items-center gap-3">
          <button
            onClick={loadActivities}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 gap-3 items-center shadow-xl shadow-slate-900/10">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <p className="text-sm font-bold text-blue-100 uppercase tracking-widest">Audit Mode Active</p>
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span>Live — auto-refreshing every 10s • Last update: {lastRefresh.toLocaleTimeString('en-US', { timeZone: 'Africa/Nairobi' })}</span>
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
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <div className="space-y-4">
                      <RefreshCw className="w-8 h-8 text-blue-400 mx-auto animate-spin" />
                      <p className="text-slate-400 font-medium">Loading audit logs...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredActivities.map((log) => {
                const ts = formatGMT3(log.created_at);
                return (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                        <User className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{log.user || log.user_name}</p>
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
                        {ts.time || log.time}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{ts.date || log.date}</p>
                    </div>
                  </td>
                </tr>
              )})}
              {!loading && filteredActivities.length === 0 && (
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
