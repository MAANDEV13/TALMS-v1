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
  ChevronRight,
  MessageSquare,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { MOCK_DB } from '@/lib/mockDb';
import { useAuth } from '@/context/AuthContext';

export default function LicensesPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    let saved = MOCK_DB.get('applications');
    // Hide drafts from non-officers/regional_directors
    if (user?.role !== 'officer' && user?.role !== 'regional_director') {
      saved = saved.filter((app: any) => app.status !== 'Draft');
    }
    
    // Filter by region for regional_director
    if (user?.role === 'regional_director' && user.region) {
      saved = saved.filter((app: any) => app.region === user.region);
    }
    setApplications(saved);
  }, [user]);

  const canPrint = (app: any) => {
    const isDirector = user?.role === 'director';
    const isApproved = app.status === 'Approved' || app.status.includes('Approved');
    return isDirector && isApproved;
  };

  const [viewingApp, setViewingApp] = useState<any>(null);

  const handlePrint = (id: string) => {
    window.open(`/print/license/${id}`, '_blank', 'width=900,height=1200');
  };

  const filteredApps = applications.filter((app) => {
    const searchMatch = 
      (app.agency || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.agencyId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.district || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const typeMatch = filterType === 'All' || app.type === filterType;
    const statusMatch = filterStatus === 'All' || app.status === filterStatus;
    
    return searchMatch && typeMatch && statusMatch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">License Applications</h1>
          <p className="text-slate-500 mt-1">Manage and track travel agency license applications in Somaliland.</p>
        </div>
        {(user?.role === 'officer' || user?.role === 'regional_director') && (
          <Link 
            href="/licenses/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>New Application</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center bg-slate-50/50">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search applications..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 outline-none"
            >
              <option value="All">All Types</option>
              <option value="New">New</option>
              <option value="Renewal">Renewal</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending Initial Review">Pending Initial Review</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Pending Director Approval">Pending Director Approval</option>
              <option value="Pending DG Approval">Pending DG Approval</option>
              <option value="Approved by General Director">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
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
              {filteredApps.length > 0 ? filteredApps.map((app) => (
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
                    <td className="px-6 py-4 text-sm font-bold">
                      {app.status === 'Draft' && (user?.role === 'officer' || user?.role === 'regional_director') ? (
                        <div className="flex items-center gap-3">
                          <Link 
                            href={`/licenses/new?id=${app.id}`}
                            className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 hover:underline"
                          >
                            Continue Draft
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to discard this draft? This cannot be undone.')) {
                                const apps = MOCK_DB.get('applications');
                                MOCK_DB.save('applications', apps.filter((a: any) => a.id !== app.id));
                                setApplications(prev => prev.filter(a => a.id !== app.id));
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Discard Draft"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          app.statusColor === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          app.statusColor === 'green' ? 'bg-green-50 text-green-700 border-green-100' :
                          app.statusColor === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setViewingApp(app); }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="View Details"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    {canPrint(app) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePrint(app.id); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-2 text-xs font-bold border border-blue-100"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </button>
                    )}
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

      {/* Detail Modal for Officer */}
      {viewingApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Application Status</h2>
              <button onClick={() => setViewingApp(null)} className="text-slate-400 hover:text-slate-600">
                <ChevronRight className="w-6 h-6 rotate-90" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    viewingApp.statusColor === 'green' ? 'bg-green-100 text-green-600' : 
                    viewingApp.statusColor === 'amber' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Current Status</p>
                    <p className="text-sm font-black text-slate-900 capitalize">{viewingApp.status.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              {viewingApp.reviewComment && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    Reviewer Notes
                  </h4>
                  <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-sm text-blue-900 font-medium italic leading-relaxed">
                      "{viewingApp.reviewComment}"
                    </p>
                  </div>
                </div>
              )}

              {!viewingApp.reviewComment && (
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
                  <p className="text-xs text-slate-500 font-medium">No reviewer comments have been added yet for this application.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Agency ID</p>
                  <p className="text-sm font-bold text-slate-900">{viewingApp.agencyId || 'Pending'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Type</p>
                  <p className="text-sm font-bold text-slate-900">{viewingApp.type}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100">
              <button 
                onClick={() => setViewingApp(null)}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
