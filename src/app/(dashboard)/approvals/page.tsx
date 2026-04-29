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
  const [agencyChanges, setAgencyChanges] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'applications' | 'agency_changes'>('applications');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [selectedChange, setSelectedChange] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    MOCK_DB.init();
    setApprovals(MOCK_DB.get('applications'));
    setAgencyChanges(MOCK_DB.get('agency_changes'));
  }, []);

  const handleAction = (status: string, color: string) => {
    if (!selectedApp) return;
    
    MOCK_DB.updateApplicationStatus(selectedApp.id, status, color);
    setApprovals(MOCK_DB.get('applications'));
    setSelectedApp(null);
    setIsEditing(false);
  };

  const handleApproveChange = () => {
    if (!selectedChange) return;
    MOCK_DB.approveAgencyChange(selectedChange.id);
    setAgencyChanges(MOCK_DB.get('agency_changes'));
    setSelectedChange(null);
  };

  const isAlreadyReviewed = (app: any) => {
    return app.status.includes('Approved') || app.status === 'Needs Revision';
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Approval Workflow</h1>
          <p className="text-slate-500 mt-1">Review and process actions awaiting your authority.</p>
        </div>
        {user?.role === 'general_director' && (
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button 
              onClick={() => setActiveTab('applications')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'applications' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Applications
            </button>
            <button 
              onClick={() => setActiveTab('agency_changes')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'agency_changes' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Data Changes
              {agencyChanges.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === 'agency_changes' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                }`}>
                  {agencyChanges.length}
                </span>
              )}
            </button>
          </div>
        )}
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
          {activeTab === 'applications' ? (
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
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{item.agencyId || 'NEW'}</span>
                          <span className="text-sm font-bold text-slate-900">{item.agency}</span>
                        </div>
                        <span className="text-xs text-slate-500 uppercase tracking-tighter mt-1">{item.type} Application</span>
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
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agency ID / Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Change Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agencyChanges.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {item.agencyId}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border ${
                        item.type === 'edit' 
                          ? 'bg-blue-50 text-blue-700 border-blue-100' 
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {item.type} Request
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600">{item.requester}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{item.date}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedChange(item)}
                        className="text-blue-600 font-black text-xs hover:underline uppercase tracking-widest"
                      >
                        Review & Approve
                      </button>
                    </td>
                  </tr>
                ))}
                {agencyChanges.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No pending data change requests at this time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Agency Change Review Side Panel */}
      {selectedChange && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedChange(null)}></div>
          <div className="relative w-full max-w-xl bg-white h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Data Change Request</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">Agency: {selectedChange.agencyId}</h3>
              </div>
              <button onClick={() => setSelectedChange(null)} className="p-2 hover:bg-slate-200 rounded-full">
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 text-slate-900">
              <section className="space-y-4">
                <div className={`p-6 rounded-3xl border ${selectedChange.type === 'delete' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                  <h4 className={`font-black uppercase text-xs tracking-widest mb-4 ${selectedChange.type === 'delete' ? 'text-red-700' : 'text-blue-700'}`}>
                    Request Type: {selectedChange.type}
                  </h4>
                  {selectedChange.type === 'edit' ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Proposed New Name</p>
                        <p className="text-lg font-black text-slate-900">{selectedChange.data?.newName || 'No name change requested'}</p>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Updated Documents Registry</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedChange.data?.docs?.map((doc: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded uppercase">
                              {doc}
                            </span>
                          )) || <p className="text-xs text-slate-400">No document updates</p>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-red-800">
                        CRITICAL WARNING: This request is to PERMANENTLY DELETE the agency record from the system.
                      </p>
                      <p className="text-xs text-red-600/80 font-medium italic">This action cannot be undone once executed.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Requester Information</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-blue-600 border border-blue-100 shadow-sm">
                    {selectedChange.requester[0]}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{selectedChange.requester}</p>
                    <p className="text-xs text-slate-500 font-medium">Proposed on {selectedChange.date}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-8 border-t border-slate-100 grid grid-cols-2 gap-4 bg-white">
              <button 
                onClick={() => {
                  MOCK_DB.save('agency_changes', MOCK_DB.get('agency_changes').filter((c: any) => c.id !== selectedChange.id));
                  setAgencyChanges(MOCK_DB.get('agency_changes'));
                  setSelectedChange(null);
                }}
                className="py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                Reject Request
              </button>
              <button 
                onClick={handleApproveChange}
                className={`py-3.5 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${selectedChange.type === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}
              >
                Approve & Execute
              </button>
            </div>
          </div>
        </div>
      )}

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
                    onClick={() => handleAction('Draft', 'slate')}
                    className="py-3.5 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all"
                  >
                    Reject to Draft
                  </button>
                  <button 
                    onClick={() => {
                      let nextStatus = '';
                      let nextColor = 'blue';
                      
                      // Handle role-based progression
                      if (user?.role === 'officer') {
                        nextStatus = 'Under Review - Director';
                      } else if (user?.role === 'director') {
                        nextStatus = 'Under Review - Director General';
                      } else if (user?.role === 'general_director') {
                        nextStatus = 'Approved';
                        nextColor = 'green';
                      }
                      
                      if (nextStatus) {
                        handleAction(nextStatus, nextColor);
                      }
                    }}
                    className="py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Approve to Next Level
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
