'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  PieChart as PieChartIcon, 
  BarChart2, 
  MapPin, 
  AlertCircle,
  Download,
  Calendar,
  CheckCircle2,
  Users
} from 'lucide-react';
import { MOCK_DB } from '@/lib/mockDb';
import { useAuth } from '@/context/AuthContext';

export default function ReportsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState(0);

  const [regionalDensity, setRegionalDensity] = useState<any[]>([]);

  useEffect(() => {
    MOCK_DB.init();
    let agencies = MOCK_DB.get('agencies');
    let apps = MOCK_DB.get('applications');
    const fines = MOCK_DB.get('fines') || [];

    // Role-based data filtering
    // Regional directors only see their own region
    if (user?.role === 'regional_director' && user.region) {
      agencies = agencies.filter((a: any) => a.region === user.region);
      apps = apps.filter((a: any) => a.region === user.region);
    }

    // Officers see their assigned region if they have one
    if (user?.role === 'officer' && user.region) {
      agencies = agencies.filter((a: any) => a.region === user.region);
      apps = apps.filter((a: any) => a.region === user.region);
    }

    // Calculate revenue
    const fineRevenue = fines.reduce((acc: number, f: any) => acc + (parseFloat(f.amount) || 0), 0);
    const licenseRevenue = apps.filter((a: any) => a.status === 'Approved by General Director').length * 500;

    setStats({
      totalAgencies: agencies.length,
      activeAgencies: agencies.filter((a: any) => a.status === 'Active').length,
      expiredAgencies: agencies.filter((a: any) => a.status === 'Expired').length,
      pendingApps: apps.filter((a: any) => a.status.includes('Review')).length,
      newApps: apps.filter((a: any) => a.type === 'New').length,
      renewalApps: apps.filter((a: any) => a.type === 'Renewal').length,
      totalFines: fines.length,
    });
    setRevenue(licenseRevenue + fineRevenue);

    // Calculate regional density
    const regions = ['Maroodi Jeex', 'Togdheer', 'Awdal', 'Saaxil', 'Sool', 'Sanaag', 'Gabiley'];
    const allAgencies = MOCK_DB.get('agencies');
    const density = regions.map(r => ({
      region: r,
      count: allAgencies.filter((a: any) => a.region === r).length,
      color: r === 'Maroodi Jeex' ? 'blue' : r === 'Togdheer' ? 'indigo' : r === 'Gabiley' ? 'green' : 'slate'
    }));

    // For regional roles, highlight their own region
    if (user?.role === 'regional_director' && user.region) {
      setRegionalDensity(density.filter(d => d.region === user.region));
    } else {
      setRegionalDensity(density);
    }
  }, [user]);

  if (!stats) return <div className="p-20 text-center">Loading Reports...</div>;

  const isRegionalView = user?.role === 'regional_director' || (user?.role === 'officer' && user?.region);
  const totalApps = stats.newApps + stats.renewalApps;
  const newPct = totalApps > 0 ? Math.round((stats.newApps / totalApps) * 100) : 0;
  const renewalPct = totalApps > 0 ? Math.round((stats.renewalApps / totalApps) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isRegionalView ? `${user?.region || 'Regional'} Reports` : 'Ministerial Analytics'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRegionalView
              ? `Performance overview for the ${user?.region || ''} region.`
              : 'Strategic oversight and performance reporting for travel agency licensing.'}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
          <Download className="w-4 h-4" />
          Export PDF Report
        </button>
      </div>

      {/* Regional Officer Notice */}
      {isRegionalView && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-900 uppercase tracking-tight">Regional View Active</h4>
            <p className="text-xs text-blue-700 font-medium mt-0.5">
              You are viewing data filtered to <span className="font-black">{user?.region}</span> only. Main officers and directors can see all regions.
            </p>
          </div>
        </div>
      )}

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Registry', value: stats.totalAgencies, icon: Building2, color: 'blue', detail: 'Licensed Agencies' },
          { label: 'Total Revenue', value: `$${revenue.toLocaleString()}`, icon: DollarSign, color: 'green', detail: 'FY 2026 To Date' },
          { label: 'Active Licenses', value: stats.activeAgencies, icon: CheckCircle2, color: 'indigo', detail: 'Fully Compliant' },
          { label: 'Total Penalties', value: stats.totalFines, icon: AlertCircle, color: 'red', detail: 'Enforcement Actions' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group">
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
            <p className="text-xs text-slate-500 mt-2 font-medium">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Application Distribution */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              Application Type Distribution
            </h3>
            <Calendar className="w-5 h-5 text-slate-300" />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-600 uppercase tracking-wider">New Registrations</span>
                <span className="text-blue-600">{newPct}%</span>
              </div>
              <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${newPct}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-600 uppercase tracking-wider">Renewals</span>
                <span className="text-amber-600">{renewalPct}%</span>
              </div>
              <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${renewalPct}%` }}></div>
              </div>
            </div>
          </div>
          <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                The current trend shows a <span className="font-bold text-slate-900">12% increase</span> in new agency registrations compared to last quarter, indicating robust growth in the Somaliland travel sector.
              </p>
            </div>
          </div>
        </div>

        {/* Regional Performance (Mock Data) */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Regional Agency Density
            </h3>
            <PieChartIcon className="w-5 h-5 text-slate-300" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {regionalDensity.map((r, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-200 transition-all">
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{r.region}</span>
                <span className={`text-sm font-black text-${r.color}-600`}>{r.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
              <Users className="w-4 h-4" />
              {isRegionalView ? `Showing: ${user?.region}` : 'Primary Focus: Maroodi Jeex'}
            </div>
            <button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">View Map View</button>
          </div>
        </div>
      </div>

      {/* Minister Note */}
      {user?.role === 'minister' && (
        <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-2xl shadow-blue-900/20 flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-black uppercase tracking-tight">Ministerial Oversight Note</h4>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-2xl mt-1">
              Welcome, Honorable Minister. You are in <span className="text-blue-400 font-black uppercase tracking-widest">Read-Only Observer Mode</span>. You can view all strategic reports and dashboard analytics, but administrative modifications are restricted to the General Director and departmental staff.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ShieldAlert(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
