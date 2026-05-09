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
  Users,
  User,
  FileText,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ReportsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState(0);
  const [regionalDensity, setRegionalDensity] = useState<any[]>([]);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [agenciesRes, appsRes, finesRes] = await Promise.all([
          fetch('/api/data?table=agencies'),
          fetch('/api/data?table=applications'),
          fetch('/api/data?table=fines')
        ]);

        let agencies = agenciesRes.ok ? await agenciesRes.json() : [];
        let apps = appsRes.ok ? await appsRes.json() : [];
        const fines = finesRes.ok ? await finesRes.json() : [];
        agencies = Array.isArray(agencies) ? agencies : [];
        apps = Array.isArray(apps) ? apps : [];

        const allAgencies = [...agencies];

        // Role-based filtering
        if ((user?.role === 'regional_director' || user?.role === 'officer') && user.region) {
          agencies = agencies.filter((a: any) => a.region === user.region);
          apps = apps.filter((a: any) => a.region === user.region);
        }

        const fineRevenue = (Array.isArray(fines) ? fines : []).reduce((acc: number, f: any) => acc + (parseFloat(f.amount) || 0), 0);
        const licenseRevenue = apps.filter((a: any) => a.status === 'Approved by General Director').length * 500;

        setStats({
          totalAgencies: agencies.length,
          activeAgencies: agencies.filter((a: any) => a.status === 'Active').length,
          expiredAgencies: agencies.filter((a: any) => a.status === 'Expired').length,
          pendingApps: apps.filter((a: any) => (a.status || '').includes('Review')).length,
          newApps: apps.filter((a: any) => a.type === 'New').length,
          renewalApps: apps.filter((a: any) => a.type === 'Renewal').length,
          totalFines: (Array.isArray(fines) ? fines : []).length,
        });
        setRevenue(licenseRevenue + fineRevenue);

        // Regional density
        const regions = ['Maroodi Jeex', 'Togdheer', 'Awdal', 'Saaxil', 'Sool', 'Sanaag', 'Gabiley'];
        const density = regions.map(r => ({
          region: r,
          count: allAgencies.filter((a: any) => a.region === r).length,
          color: r === 'Maroodi Jeex' ? 'blue' : r === 'Togdheer' ? 'indigo' : r === 'Gabiley' ? 'green' : 'slate'
        }));

        if ((user?.role === 'regional_director') && user.region) {
          setRegionalDensity(density.filter(d => d.region === user.region));
        } else {
          setRegionalDensity(density);
        }

        // Load user reports for admin
        if (user?.role === 'admin') {
          setLoadingUsers(true);
          try {
            const usersRes = await fetch('/api/data?table=users');
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              const allUsers = Array.isArray(usersData) ? usersData : [];
              const userSummaries = allUsers.map((u: any) => {
                const userApps = apps.filter((a: any) => a.registered_by === u.name);
                const userAgencies = allAgencies.filter((a: any) => a.registered_by === u.name);
                return {
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  region: u.region,
                  totalApps: userApps.length,
                  totalAgencies: userAgencies.length,
                };
              });
              setUserReports(userSummaries);
            }
          } catch { /* ignore */ }
          setLoadingUsers(false);
        }
      } catch (err) {
        console.error('Failed to load report data:', err);
      }
    }

    if (user) loadData();
  }, [user]);

  const exportReportPDF = () => {
    if (!stats) return;
    
    const printWindow = window.open('', '', 'width=800,height=900');
    if (!printWindow) {
      alert("Please allow popups to generate the PDF report.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TALMS Analytical Report</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; padding: 40px; margin: 0; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0 0 10px 0; font-size: 24px; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; }
          .meta { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .section { margin-bottom: 40px; }
          .section h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #475569; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .stat-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; background: #f8fafc; }
          .stat-box p { margin: 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .stat-box h3 { margin: 10px 0 0 0; font-size: 28px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 14px; }
          th { background: #f8fafc; color: #64748b; font-weight: bold; text-transform: uppercase; font-size: 12px; }
          @media print { body { padding: 0; } .stat-box { break-inside: avoid; } table { break-inside: auto; } tr { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>TALMS Analytical Report</h1>
          <div class="meta">
            <span>Generated By: ${user?.name || 'System Administrator'} (${(user?.role || '').replace('_', ' ')})</span>
            <span>Date Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        <div class="section">
          <h2>Executive Summary</h2>
          <div class="grid">
            <div class="stat-box"><p>Total Registry</p><h3>${stats.totalAgencies}</h3></div>
            <div class="stat-box"><p>Active Licenses</p><h3>${stats.activeAgencies}</h3></div>
            <div class="stat-box"><p>Total Revenue</p><h3>$${revenue.toLocaleString()}</h3></div>
            <div class="stat-box"><p>Pending Applications</p><h3>${stats.pendingApps}</h3></div>
          </div>
        </div>

        <div class="section">
          <h2>Regional Distribution</h2>
          <table>
            <tr><th>Region</th><th>Agency Count</th></tr>
            ${regionalDensity.map(r => `<tr><td><strong>${r.region}</strong></td><td>${r.count}</td></tr>`).join('')}
          </table>
        </div>

        ${userReports.length > 0 ? `
        <div class="section">
          <h2>User Activity Reports</h2>
          <table>
            <tr><th>User Name</th><th>Role</th><th>Region</th><th>Applications</th><th>Agencies Created</th></tr>
            ${userReports.map(u => `<tr><td><strong>${u.name || 'Unnamed'}</strong><br><span style="font-size:10px;color:#64748b;">${u.email}</span></td><td style="text-transform:uppercase;font-size:11px;font-weight:bold;">${u.role}</td><td>${u.region || '—'}</td><td>${u.totalApps}</td><td>${u.totalAgencies}</td></tr>`).join('')}
          </table>
        </div>
        ` : ''}

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'activities', action: 'log', data: { user: user?.name || 'Admin', action: 'Exported analytics report as PDF', target: 'Reports' } })
    });
  };

  if (!stats) return <div className="p-20 text-center">Loading Reports...</div>;

  const isRegionalView = user?.role === 'regional_director' || (user?.role === 'officer' && user?.region);
  const totalApps = stats.newApps + stats.renewalApps;
  const newPct = totalApps > 0 ? Math.round((stats.newApps / totalApps) * 100) : 0;
  const renewalPct = totalApps > 0 ? Math.round((stats.renewalApps / totalApps) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
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
        <button
          onClick={exportReportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          Export PDF Report
        </button>
      </div>

      {isRegionalView && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-900 uppercase tracking-tight">Regional View Active</h4>
            <p className="text-xs text-blue-700 font-medium mt-0.5">
              You are viewing data filtered to <span className="font-black">{user?.region}</span> only.
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
                <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${newPct}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-600 uppercase tracking-wider">Renewals</span>
                <span className="text-amber-600">{renewalPct}%</span>
              </div>
              <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${renewalPct}%` }}></div>
              </div>
            </div>
          </div>
          <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                The current trend shows a <span className="font-bold text-slate-900">12% increase</span> in new agency registrations compared to last quarter.
              </p>
            </div>
          </div>
        </div>

        {/* Regional Performance */}
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
              {isRegionalView ? `Showing: ${user?.region}` : 'All Regions'}
            </div>
          </div>
        </div>
      </div>

      {/* User-Specific Reports — Admin Only */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                User Activity Reports
              </h3>
              <p className="text-sm text-slate-500 mt-1">Per-user breakdown of registrations and agency activity.</p>
            </div>
            {loadingUsers && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
          </div>
          {userReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Region</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Applications</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Agencies</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {userReports.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{u.name || 'Unnamed'}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-lg uppercase">{u.role}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{u.region || '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{u.totalApps}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-black text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">{u.totalAgencies}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            const lines = [
                              `USER ACTIVITY REPORT: ${u.name?.toUpperCase() || 'UNNAMED'}`,
                              `==================================================`,
                              `Email: ${u.email}`,
                              `Role: ${u.role}`,
                              `Region: ${u.region || 'All Regions'}`,
                              ``,
                              `PERFORMANCE METRICS`,
                              `--------------------------------------------------`,
                              `Total Applications Handled: ${u.totalApps}`,
                              `Total Agencies Managed:     ${u.totalAgencies}`,
                              ``,
                              `Generated By: ${user?.name || 'Admin'}`,
                              `Date Generated: ${new Date().toLocaleDateString('en-US')}`,
                              `==================================================`
                            ];
                            const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `User_Report_${(u.name || 'User').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 font-medium">
              {loadingUsers ? 'Loading user data...' : 'No user data available.'}
            </div>
          )}
        </div>
      )}

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
