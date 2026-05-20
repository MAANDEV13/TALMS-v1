'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  Download,
  AlertTriangle,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// Excel export helper
function exportToExcel(data: any[], headers: string[], filename: string) {
  const escapeCell = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escapeCell).join(','), ...data.map(row => row.map(escapeCell).join(','))].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type ListTab = 'recent' | 'registered' | 'expiring' | 'expired';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, expiring: 0 });
  const [allAgencies, setAllAgencies] = useState<any[]>([]);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<ListTab>('recent');

  useEffect(() => {
    async function loadData() {
      try {
        const [appsRes, agenciesRes, logsRes] = await Promise.all([
          fetch('/api/data?table=applications'),
          fetch('/api/data?table=agencies'),
          fetch('/api/data?table=activities'),
        ]);
        const apps = appsRes.ok ? await appsRes.json() : [];
        const agencies = agenciesRes.ok ? await agenciesRes.json() : [];
        const logs = logsRes.ok ? await logsRes.json() : [];

        let filteredApps = apps;
        let filteredAgencies = agencies;

        if (user?.role === 'regional_director' && user.region) {
          filteredApps = apps.filter((a: any) => a.region === user.region);
          filteredAgencies = agencies.filter((a: any) => a.region === user.region);
        }

        // Count expiring (within 30 days)
        const now = new Date();
        const expiringCount = filteredAgencies.filter((a: any) => {
          const exp = a.expiry_date || a.expiryDate;
          if (!exp) return false;
          const d = new Date(exp);
          const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
          return diff > 0 && diff <= 30;
        }).length;

        const expiredCount = filteredAgencies.filter((a: any) => {
          const exp = a.expiry_date || a.expiryDate;
          if (!exp) return false;
          return new Date(exp).getTime() < now.getTime();
        }).length;

        setStats({
          total: filteredAgencies.length,
          pending: filteredApps.filter((a: any) => (a.status || '').includes('Review') || (a.status || '').includes('Pending')).length,
          approved: filteredApps.filter((a: any) => a.status === 'Approved by General Director').length,
          expiring: expiringCount + expiredCount
        });

        setAllAgencies(filteredAgencies);

        setRecentApps(filteredApps.slice(0, 6).map((app: any) => ({
          name: app.agency,
          type: app.type,
          status: app.status,
          statusColor: app.status_color || app.statusColor,
          date: app.date
        })));

        setRecentLogs(logs.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    }
    loadData();
  }, [user]);

  // Computed lists
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  const registeredLastMonth = allAgencies.filter((a: any) => {
    const created = a.created_at ? new Date(a.created_at) : null;
    return created && created >= oneMonthAgo;
  });

  const expiringSoon = allAgencies.filter((a: any) => {
    const exp = a.expiry_date || a.expiryDate;
    if (!exp) return false;
    const d = new Date(exp);
    const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
    return diff > 0 && diff <= 60;
  }).sort((a: any, b: any) => new Date(a.expiry_date || a.expiryDate).getTime() - new Date(b.expiry_date || b.expiryDate).getTime());

  const expiredAgencies = allAgencies.filter((a: any) => {
    const exp = a.expiry_date || a.expiryDate;
    if (!exp) return false;
    return new Date(exp).getTime() < now.getTime();
  }).sort((a: any, b: any) => new Date(b.expiry_date || b.expiryDate).getTime() - new Date(a.expiry_date || a.expiryDate).getTime());

  const getDaysLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
    if (diff > 0) return `${diff}d left`;
    return `${Math.abs(diff)}d overdue`;
  };

  const handleExport = (list: any[], type: string) => {
    const headers = ['License ID', 'Agency Name', 'Region', 'City', 'Status', 'Contact Person', 'Phone', 'Issue Date', 'Expiry Date', 'Registered By'];
    const rows = list.map((a: any) => [
      a.license_id || a.licenseId || '', a.name || '', a.region || '', a.city || '',
      a.status || '', a.contact_person || a.contactPerson || '', a.phone || '',
      a.issue_date || a.issueDate || '', a.expiry_date || a.expiryDate || '',
      a.registered_by || a.registeredBy || ''
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToExcel(rows, headers, `talms-${type}-${dateStr}`);
    // Log export
    fetch('/api/data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'activities', action: 'log', data: { user: user?.name || 'User', action: `Exported ${list.length} ${type} agencies`, target: 'Dashboard Export' } })
    });
  };

  const tabs: { key: ListTab; label: string; count: number; icon: any; color: string }[] = [
    { key: 'recent', label: 'Recent Applications', count: recentApps.length, icon: FileText, color: 'blue' },
    { key: 'registered', label: 'Registered Last Month', count: registeredLastMonth.length, icon: Building2, color: 'green' },
    { key: 'expiring', label: 'Expiring Soon', count: expiringSoon.length, icon: AlertTriangle, color: 'amber' },
    { key: 'expired', label: 'Expired Licenses', count: expiredAgencies.length, icon: AlertCircle, color: 'red' },
  ];

  const renderAgencyTable = (list: any[], type: string, showExpiry: boolean) => (
    <div>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">{tabs.find(t => t.key === activeTab)?.label}</h2>
          <span className="text-xs font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{list.length}</span>
        </div>
        {list.length > 0 && (
          <button
            onClick={() => handleExport(list, type)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all active:scale-95 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">License ID</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Agency Name</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Region</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              {showExpiry && <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry</th>}
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.length > 0 ? list.map((a: any) => (
              <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-3">
                  <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">{a.license_id || a.licenseId || 'N/A'}</span>
                </td>
                <td className="px-6 py-3">
                  <span className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{a.name}</span>
                </td>
                <td className="px-6 py-3 text-sm text-slate-600">{a.region || '—'}</td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    a.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                  }`}>{a.status}</span>
                </td>
                {showExpiry && (
                  <td className="px-6 py-3">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{a.expiry_date || a.expiryDate || 'N/A'}</p>
                      {(a.expiry_date || a.expiryDate) && (
                        <span className={`text-[10px] font-black ${
                          new Date(a.expiry_date || a.expiryDate) < now ? 'text-red-600' : 'text-amber-600'
                        }`}>{getDaysLabel(a.expiry_date || a.expiryDate)}</span>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-6 py-3 text-right">
                  <Link href={`/agencies/${a.id}`} className="text-slate-400 hover:text-blue-600 transition-colors">
                    <ArrowRight className="w-4 h-4 inline" />
                  </Link>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={showExpiry ? 6 : 5} className="px-6 py-12 text-center text-slate-400 text-sm font-medium italic">No agencies found in this category.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Overview</h1>
          <p className="text-slate-500 mt-1">Somaliland Travel Agency License Management System.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Licenses" value={stats.total.toLocaleString()} icon={FileText} trend={{ value: `${registeredLastMonth.length} new`, positive: true }} color="blue" />
        <StatCard label="Pending Review" value={stats.pending} icon={Clock} color="amber" />
        <StatCard label="Fully Approved" value={stats.approved} icon={CheckCircle2} color="green" />
        <StatCard label="Expiring / Expired" value={stats.expiring} icon={AlertCircle} color="red" />
      </div>

      {/* Tabbed Agency Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
                  activeTab === tab.key
                    ? `border-${tab.color === 'amber' ? 'amber' : tab.color}-600 text-${tab.color === 'amber' ? 'amber' : tab.color}-600 bg-${tab.color === 'amber' ? 'amber' : tab.color}-50/30`
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-black ${
                  activeTab === tab.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'recent' && (
            <div>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
                <Link href="/licenses" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                  View all <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Agency Name</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentApps.map((app, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-3"><span className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{app.name}</span></td>
                        <td className="px-6 py-3 text-sm text-slate-600">{app.type}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            app.statusColor === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            app.statusColor === 'green' ? 'bg-green-50 text-green-700 border-green-100' :
                            app.statusColor === 'red' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-700 border-slate-100'
                          }`}>{app.status}</span>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-500">{app.date}</td>
                      </tr>
                    ))}
                    {recentApps.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm italic">No recent applications.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'registered' && renderAgencyTable(registeredLastMonth, 'registered-last-month', false)}
          {activeTab === 'expiring' && renderAgencyTable(expiringSoon, 'expiring-soon', true)}
          {activeTab === 'expired' && renderAgencyTable(expiredAgencies, 'expired-licenses', true)}
        </div>

        {/* System Activity for admin and directors */}
        {user?.role !== 'officer' && user?.role !== 'regional_director' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900">System Activity</h2>
            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {recentLogs.length > 0 ? recentLogs.map((activity, i) => (
                <div key={i} className="relative pl-8 group">
                  <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-1 ${
                    (activity.action || '').includes('Approved') ? 'bg-green-500 ring-green-100' :
                    (activity.action || '').includes('Issue') || (activity.action || '').includes('Delete') ? 'bg-red-500 ring-red-100' :
                    'bg-blue-500 ring-blue-100'
                  }`}></div>
                  <p className="text-sm text-slate-600 leading-snug">
                    <span className="font-bold text-slate-900">{activity.user || activity.user_name}</span> {activity.action} <span className="font-semibold text-blue-600">{activity.target}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{activity.time} • {activity.date}</p>
                </div>
              )) : (
                <p className="text-center text-slate-400 text-sm py-10 font-medium italic">No recent activity found.</p>
              )}
            </div>
            <Link href="/activities" className="block w-full py-2.5 text-center text-sm font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-all">
              View All Audit Logs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
