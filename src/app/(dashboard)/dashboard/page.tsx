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

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 1284,
    pending: 42,
    approved: 18,
    expiring: 12
  });

  const [recentApps, setRecentApps] = useState<any[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('talms_applications') || '[]');
    const defaults = [
      { name: 'Hargeisa Sky Travels', type: 'New', status: 'Under Review', statusColor: 'amber', date: 'Oct 24, 2023' },
      { name: 'Berbera Maritime Tours', type: 'Renewal', status: 'Approved', statusColor: 'green', date: 'Oct 23, 2023' },
      { name: 'Borama International', type: 'New', status: 'Needs Revision', statusColor: 'red', date: 'Oct 22, 2023' },
    ];
    
    // Map saved to match the display structure
    const formattedSaved = saved.map((app: any) => ({
      name: app.agency,
      type: app.type,
      status: app.status,
      statusColor: app.statusColor,
      date: app.date
    }));

    setRecentApps([...formattedSaved, ...defaults]);
    
    // Update stats slightly based on new apps
    if (saved.length > 0) {
      setStats(prev => ({
        ...prev,
        total: prev.total + saved.length,
        pending: prev.pending + saved.length
      }));
    }
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Overview</h1>
          <p className="text-slate-500 mt-1">Somaliland Travel Agency License Management System.</p>
        </div>
        <Link 
          href="/licenses/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Application</span>
        </Link>
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Somaliland Activity</h2>
          <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {[
              { user: 'Ahmed Salan', action: 'approved application in', target: 'Hargeisa', time: '2 mins ago', color: 'green' },
              { user: 'Mustafa Guleid', action: 'flagged review for', target: 'Berbera Agency', time: '1 hour ago', color: 'amber' },
              { user: 'Admin User', action: 'updated license rules for', target: 'Borama', time: '3 hours ago', color: 'blue' },
              { user: 'General Director', action: 'finalized approval for', target: 'Burao Co.', time: '5 hours ago', color: 'purple' },
            ].map((activity, i) => (
              <div key={i} className="relative pl-8 group">
                <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-1 ${
                  activity.color === 'green' ? 'bg-green-500 ring-green-100' :
                  activity.color === 'amber' ? 'bg-amber-500 ring-amber-100' :
                  activity.color === 'blue' ? 'bg-blue-500 ring-blue-100' : 'bg-purple-500 ring-purple-100'
                }`}></div>
                <p className="text-sm text-slate-600 leading-snug">
                  <span className="font-bold text-slate-900">{activity.user}</span> {activity.action} <span className="font-semibold text-blue-600">{activity.target}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
              </div>
            ))}
          </div>
          <button className="w-full py-2.5 text-sm font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-all">
            View Regional Reports
          </button>
        </div>
      </div>
    </div>
  );
}
