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
  Printer,
  DollarSign,
  Save,
  FileText,
  Eye
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
  const [reviewComment, setReviewComment] = useState('');
  const [docTab, setDocTab] = useState<'details' | 'documents'>('details');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    MOCK_DB.init();
    // Never show drafts in the approval workflow
    setApprovals(MOCK_DB.get('applications').filter((app: any) => app.status !== 'Draft'));
    setAgencyChanges(MOCK_DB.get('agency_changes'));
  }, []);

  const handleAction = (status: string, color: string) => {
    if (!selectedApp) return;
    
    MOCK_DB.updateApplicationStatus(selectedApp.id, status, color, reviewComment);
    MOCK_DB.logActivity(user?.name || 'Reviewer', `Updated status to: ${status} for`, selectedApp.agency);
    
    // Create or update actual agency record if approved by GD
    if (status === 'Approved by General Director') {
      const agencies = MOCK_DB.get('agencies');
      const existingIdx = agencies.findIndex((a: any) => a.licenseId === selectedApp.agencyId || a.name.toLowerCase() === selectedApp.agency.toLowerCase());
      
      const issueDate = new Date(selectedApp.registerDate || new Date());
      const formattedIssueDate = issueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const expiryDateObj = new Date(issueDate);
      expiryDateObj.setFullYear(expiryDateObj.getFullYear() + 1);
      const formattedExpiryDate = expiryDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (existingIdx === -1) {
        const newAgency = {
          id: Math.random().toString(36).substr(2, 9),
          licenseId: selectedApp.agencyId,
          name: selectedApp.agency,
          city: selectedApp.district,
          region: selectedApp.region,
          status: 'Active',
          contactPerson: selectedApp.contactPerson,
          phone: selectedApp.phone,
          email: selectedApp.email,
          createdAt: new Date().toISOString(),
          issueDate: formattedIssueDate,
          expiryDate: formattedExpiryDate,
          registeredBy: selectedApp.registeredBy || `${selectedApp.region || 'HQ'}-officer`,
          printCount: 0
        };
        MOCK_DB.save('agencies', [newAgency, ...agencies]);
      } else {
        const updatedAgency = { ...agencies[existingIdx], status: 'Active', issueDate: formattedIssueDate, expiryDate: formattedExpiryDate };
        const newAgencies = [...agencies];
        newAgencies[existingIdx] = updatedAgency;
        MOCK_DB.save('agencies', newAgencies);
      }
    }

    setApprovals(MOCK_DB.get('applications'));
    setSelectedApp(null);
    setIsEditing(false);
  };

  const handleUpdateFinancials = () => {
    if (!selectedApp) return;
    MOCK_DB.updateApplication(selectedApp);
    setApprovals(MOCK_DB.get('applications'));
    setMessage("Financial records updated successfully.");
    setTimeout(() => setMessage(null), 3000);
  };

  const [message, setMessage] = useState<string | null>(null);

  const filteredApprovals = approvals.filter((item) => {
    const searchMatch = 
      (item.agency || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.agencyId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.region || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const typeMatch = filterType === 'All' || item.type === filterType;
    const statusMatch = filterStatus === 'All' || item.status === filterStatus;
    
    return searchMatch && typeMatch && statusMatch;
  });

  const filteredChanges = agencyChanges.filter((item) => {
    const searchMatch = 
      (item.agencyId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.requester || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    return searchMatch;
  });

  const handleApproveChange = () => {
    if (!selectedChange) return;
    MOCK_DB.approveAgencyChange(selectedChange.id);
    MOCK_DB.logActivity(user?.name || 'Admin', `Approved data change for`, selectedChange.agencyId);
    setAgencyChanges(MOCK_DB.get('agency_changes'));
    setSelectedChange(null);
  };

  const isAlreadyReviewed = (app: any) => {
    return app.status === 'Approved by General Director' || app.status === 'Needs Revision';
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Approval Workflow</h1>
          <p className="text-slate-500 mt-1">Review and process actions awaiting your authority.</p>
        </div>
        {message && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm animate-in fade-in slide-in-from-top-2">
            {message}
          </div>
        )}
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
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center bg-slate-50/50">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by agency name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {activeTab === 'applications' && (
              <>
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
                  <option value="Pending Initial Review">Pending Initial Review</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Pending Director Approval">Pending Director Approval</option>
                  <option value="Pending DG Approval">Pending DG Approval</option>
                </select>
              </>
            )}
          </div>
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
                {filteredApprovals.map((item) => (
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
                {filteredChanges.map((item) => (
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
            {/* Tab switcher for GD */}
            {user?.role === 'general_director' && (
              <div className="px-8 pt-6 pb-0 flex gap-1 bg-slate-50 border-b border-slate-100">
                <button
                  onClick={() => setDocTab('details')}
                  className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all ${
                    docTab === 'details' ? 'bg-white text-blue-600 border border-b-white border-slate-200 -mb-px' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Application Details
                </button>
                <button
                  onClick={() => setDocTab('documents')}
                  className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all flex items-center gap-2 ${
                    docTab === 'documents' ? 'bg-white text-blue-600 border border-b-white border-slate-200 -mb-px' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Documents
                  {selectedApp?.uploadedDocs?.length > 0 && (
                    <span className="w-4 h-4 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {selectedApp.uploadedDocs.length}
                    </span>
                  )}
                </button>
              </div>
            )}
            
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
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium"
                      rows={4}
                      placeholder="Enter your assessment or feedback for the agency..."
                    ></textarea>
                  </section>
                </>
              )}

                {/* Financials Section */}
                <section className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Financial Assessment
                    </h4>
                    {(user?.role === 'director' || user?.role === 'general_director') && selectedApp.status !== 'Approved' && (
                      <button 
                        onClick={handleUpdateFinancials}
                        className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </button>
                    )}
                  </div>
                  
                  {selectedApp.financials ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Registration Fee</p>
                          <p className="font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">${selectedApp.financials.registrationFee}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Application Fee</p>
                          <p className="font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">${selectedApp.financials.applicationFee}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Discount</p>
                          {(user?.role === 'director' || user?.role === 'general_director') && selectedApp.status !== 'Approved' ? (
                            <input 
                              type="number"
                              value={selectedApp.financials.discount}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const newApp = { ...selectedApp, financials: { ...selectedApp.financials, discount: val, totalDue: (selectedApp.financials.registrationFee + selectedApp.financials.applicationFee) - val } };
                                setSelectedApp(newApp);
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm text-red-600"
                            />
                          ) : (
                            <p className="font-bold text-red-600">-${selectedApp.financials.discount}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Paid Amount</p>
                          {(user?.role === 'director' || user?.role === 'general_director') && selectedApp.status !== 'Approved' ? (
                            <input 
                              type="number"
                              value={selectedApp.financials.paidAmount}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const newApp = { ...selectedApp, financials: { ...selectedApp.financials, paidAmount: val } };
                                setSelectedApp(newApp);
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm text-green-600"
                            />
                          ) : (
                            <p className="font-bold text-green-600">${selectedApp.financials.paidAmount}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Payable</p>
                          <p className="text-xl font-black text-white">${selectedApp.financials.totalDue}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance</p>
                          <p className="text-lg font-bold text-blue-400">${Math.max(0, selectedApp.financials.totalDue - selectedApp.financials.paidAmount)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <p className="text-xs text-amber-800 font-medium">No financial records found for this legacy application.</p>
                    </div>
                  )}
                </section>

              {/* Documents Section - always visible to all roles, full panel for GD */}
              {(user?.role !== 'general_director' || docTab === 'details') && (
                <section className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Submitted Documents
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {selectedApp.uploadedDocs?.length ?? 0} files
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {selectedApp.uploadedDocs && selectedApp.uploadedDocs.length > 0 ? (
                      selectedApp.uploadedDocs.map((doc: string, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{doc}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedApp.docFileNames?.[doc] || 'File on record'}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 uppercase">Submitted</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-800 font-medium">No documents were recorded for this application.</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Full Documents Tab for GD */}
              {user?.role === 'general_director' && docTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 uppercase tracking-tight">Document Checklist</h4>
                    <span className="text-xs font-bold text-slate-400">{selectedApp.uploadedDocs?.length ?? 0} / 10 submitted</span>
                  </div>
                  {selectedApp.uploadedDocs && selectedApp.uploadedDocs.length > 0 ? (
                    selectedApp.uploadedDocs.map((doc: string, i: number) => (
                      <div key={i} className="p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-blue-200 transition-all flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 leading-tight">{doc}</p>
                          <p className="text-[10px] mt-1 font-bold text-slate-400 truncate">
                            {selectedApp.docFileNames?.[doc] || 'Document on record'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-1 rounded-lg border border-green-200 uppercase">Verified</span>
                          <button 
                            onClick={() => {
                              const base64Data = selectedApp.docFileData?.[doc];
                              if (base64Data) {
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(`<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                }
                              } else {
                                alert('Document file not available in mock database.');
                              }
                            }}
                            className="w-8 h-8 bg-slate-100 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-all" title="View Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                        <FileText className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold text-sm">No documents were uploaded for this application.</p>
                    </div>
                  )}
                </div>
              )}
            </div>{/* end scrollable body */}

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
                        nextStatus = 'Approved by General Director';
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
                <div className="col-span-2 flex gap-3">
                  {user?.role === 'director' && selectedApp.status === 'Approved by General Director' && (
                    <button 
                      onClick={() => {
                        if (user?.role === 'director') {
                          const agencies = MOCK_DB.get('agencies');
                          const idx = agencies.findIndex((a: any) => a.licenseId === selectedApp.agencyId);
                          if (idx !== -1) {
                            const newAgencies = [...agencies];
                            newAgencies[idx].printCount = (newAgencies[idx].printCount || 0) + 1;
                            MOCK_DB.save('agencies', newAgencies);
                            MOCK_DB.logActivity(user.name, 'Printed certificate for', selectedApp.agency);
                          }
                        }
                        window.open(`/print/license/${selectedApp.id}`, '_blank', 'width=900,height=1200');
                      }}
                      className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      Print License
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedApp(null)}
                    className="flex-1 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
                  >
                    Close Summary
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
