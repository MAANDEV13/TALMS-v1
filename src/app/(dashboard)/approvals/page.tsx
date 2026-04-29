'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Search, 
  Filter, 
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  History,
  XCircle,
  MessageSquare,
  ShieldCheck,
  Edit3,
  Printer
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MOCK_DB } from '@/lib/mockDb';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setApprovals(MOCK_DB.get('applications'));
  }, []);

  const handleAction = (status: string, color: string) => {
    if (!selectedApp) return;
    
    MOCK_DB.updateApplicationStatus(selectedApp.id, status, color);
    setApprovals(MOCK_DB.get('applications'));
    setSelectedApp(null);
    setIsEditing(false);
  };

  const isAlreadyReviewed = (app: any) => {
    return app.status.includes('Approved') || app.status === 'Needs Revision';
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Approval Workflow</h1>
          <p className="text-slate-500 mt-1">Review and process license applications awaiting your action.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            <History className="w-4 h-4" />
            <span>Past Approvals</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by agency name..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4" />
            <span>Filter By Role</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agency</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approvals.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{item.agency}</span>
                      <span className="text-xs text-slate-500 uppercase tracking-tighter">{item.type} Application</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      item.statusColor === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      item.statusColor === 'green' ? 'bg-green-50 text-green-700 border-green-100' :
                      item.statusColor === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-600">
                    {item.priority || 'Medium'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedApp(item);
                        setIsEditing(false);
                      }}
                      className="flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:underline ml-auto"
                    >
                      {isAlreadyReviewed(item) ? 'View Review' : 'Process Review'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Side Panel */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedApp(null)}></div>
          <div className="relative w-full max-w-xl bg-white h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                  {isAlreadyReviewed(selectedApp) ? 'Review Summary' : 'Reviewing Application'}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{selectedApp.agency}</h3>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-slate-200 rounded-full">
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {isAlreadyReviewed(selectedApp) && !isEditing ? (
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-blue-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Previous Review Result
                    </h4>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Review
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-blue-800">
                      Current Status: <span className="font-bold uppercase">{selectedApp.status}</span>
                    </p>
                    <p className="text-sm text-blue-700 italic bg-white/50 p-3 rounded-xl border border-blue-100">
                      "All documents verified. Agency meets all Somaliland Travel Authority standards for {selectedApp.type} license."
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <section className="space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                      Application Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                        <p className="text-slate-400 font-medium">License Type</p>
                        <p className="font-bold text-slate-900">{selectedApp.type}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                        <p className="text-slate-400 font-medium">Submission Date</p>
                        <p className="font-bold text-slate-900">{selectedApp.date}</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      Reviewer Comments
                    </h4>
                    <textarea 
                      className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium"
                      rows={4}
                      placeholder="Enter your assessment or feedback for the agency..."
                    ></textarea>
                  </section>
                </>
              )}

              <section className="space-y-4">
                <h4 className="font-bold text-slate-900">Verified Documents</h4>
                <div className="space-y-3">
                  {['Business License', 'Tax Clearance'].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                      <span className="text-sm font-medium text-slate-700">{doc}</span>
                      <button className="text-xs font-bold text-blue-600">View File</button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-8 border-t border-slate-100 grid grid-cols-2 gap-4 bg-white">
              {(!isAlreadyReviewed(selectedApp) || isEditing) ? (
                <>
                  <button 
                    onClick={() => handleAction('Needs Revision', 'red')}
                    className="py-3.5 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all"
                  >
                    Request Revision
                  </button>
                  <button 
                    onClick={() => handleAction('Approved by ' + user?.role, 'green')}
                    className="py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {isEditing ? 'Update Review' : 'Approve Now'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="col-span-2 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
                >
                  Close Summary
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
