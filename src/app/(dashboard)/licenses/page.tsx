'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowRight,
  Clock, 
  CheckCircle2, 
  Printer,
} from 'lucide-react';
import Link from 'next/link';
import { MOCK_DB } from '@/lib/mockDb';
import { useAuth } from '@/context/AuthContext';

export default function LicensesPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    const saved = MOCK_DB.get('applications');
    setApplications(saved);
  }, []);

  const canPrint = (app: any) => {
    const isOfficer = user?.role === 'officer';
    const isFinalApproved = app.status === 'Approved by general_director' || app.status === 'Approved';
    return isOfficer && isFinalApproved;
  };

  const handlePrint = (id: string) => {
    // Open the dedicated print page in a new window
    window.open(`/print/license/${id}`, '_blank', 'width=900,height=1200');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">License Applications</h1>
          <p className="text-slate-500 mt-1">Manage and track travel agency license applications in Somaliland.</p>
        </div>
        <Link 
          href="/licenses/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Application</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search applications..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agency ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agency Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Region</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">District</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Person</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Register Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.length > 0 ? applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase tracking-tighter">
                      {app.agencyId || (app.type === 'New' ? 'NEW' : 'N/A')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{app.agency}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{app.region || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{app.district || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{app.contactPerson || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{app.phone ? `+252 ${app.phone}` : '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{app.registerDate || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{app.type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      app.statusColor === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      app.statusColor === 'green' ? 'bg-green-50 text-green-700 border-green-100' :
                      app.statusColor === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    {canPrint(app) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePrint(app.id); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-2 text-xs font-bold border border-blue-100"
                      >
                        <Printer className="w-4 h-4" />
                        Print License
                      </button>
                    )}
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
