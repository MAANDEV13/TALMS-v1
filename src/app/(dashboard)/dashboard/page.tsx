'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowRight
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    expiring: 0
  });

  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

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

        setStats({
          total: filteredAgencies.length,
          pending: filteredApps.filter((a: any) => (a.status || '').includes('Review')).length,
          approved: filteredApps.filter((a: any) => a.status === 'Approved by General Director').length,
          expiring: filteredAgencies.filter((a: any) => a.status === 'Expired').length
        });

        const formattedApps = filteredApps.slice(0, 6).map((app: any) => ({
          name: app.agency,
          type: app.type,
          status: app.status,
          statusColor: app.status_color || app.statusColor,
          date: app.date
        }));
        setRecentApps(formattedApps);

    // Get logs
    setRecentLogs(logs.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    }
    loadData();
  }, [user]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Overview</h1>
          <p className="text-slate-500 mt-1">Somaliland Travel Agency License Management System.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Licenses" 
          value={stats.total.toLocaleString()} 
          icon={FileText} 
          trend={{ value: '12%', positive: true }}
          color="blue"
        />
        <StatCard 
          label="Pending Review" 
          value={stats.pending} 
          icon={Clock} 
          trend={{ value: '5%', positive: false }}
          color="amber"
        />
        <StatCard 
          label="Approved Today" 
          value={stats.approved} 
          icon={CheckCircle2} 
          trend={{ value: '24%', positive: true }}
          color="green"
        />
        <StatCard 
          label="Expiring Soon" 
          value={stats.expiring} 
          icon={AlertCircle} 
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
            <Link href="/licenses" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agency Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentApps.slice(0, 6).map((app, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{app.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{app.type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        app.statusColor === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        app.statusColor === 'green' ? 'bg-green-50 text-green-700 border-green-100' :
                        app.statusColor === 'red' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-700 border-slate-100'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{app.date}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-blue-600 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Activity for admin and directors */}
        {user?.role !== 'officer' && user?.role !== 'regional_director' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900">System Activity</h2>
            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {recentLogs.length > 0 ? recentLogs.map((activity, i) => (
                <div key={i} className="relative pl-8 group">
                  <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-1 ${
                    activity.action.includes('Approved') ? 'bg-green-500 ring-green-100' :
                    activity.action.includes('Issue') ? 'bg-red-500 ring-red-100' :
                    'bg-blue-500 ring-blue-100'
                  }`}></div>
                  <p className="text-sm text-slate-600 leading-snug">
                    <span className="font-bold text-slate-900">{activity.user}</span> {activity.action} <span className="font-semibold text-blue-600">{activity.target}</span>
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
