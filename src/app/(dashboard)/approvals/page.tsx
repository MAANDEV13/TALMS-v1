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
    async function loadData() {
      try {
        const [appsRes, changesRes] = await Promise.all([
          fetch('/api/data?table=applications'),
          fetch('/api/data?table=agency_changes')
        ]);
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          const normalized = (Array.isArray(appsData) ? appsData : []).map((app: any) => {
            const parsedDocs = typeof app.uploaded_docs === 'string' ? JSON.parse(app.uploaded_docs) : (app.uploaded_docs || []);
            const parsedNames = typeof app.doc_file_names === 'string' ? JSON.parse(app.doc_file_names) : (app.doc_file_names || {});
            const parsedData = typeof app.doc_file_data === 'string' ? JSON.parse(app.doc_file_data) : (app.doc_file_data || {});
            return {
              ...app,
              uploadedDocs: parsedDocs,
              docFileNames: parsedNames,
              docFileData: parsedData,
              statusColor: app.status_color || app.statusColor,
              agencyId: app.agency_id || app.agencyId,
              reviewComment: app.review_comment || app.reviewComment
            };
          });
          setApprovals(normalized.filter((app: any) => app.status !== 'Draft'));
        }
        if (changesRes.ok) {
          const changesData = await changesRes.json();
          setAgencyChanges(Array.isArray(changesData) ? changesData : []);
        }
      } catch { /* ignore */ }
    }
    loadData();
  }, []);

  const handleAction = async (status: string, color: string) => {
    if (!selectedApp) return;
    
    // Create actual agency record if approved by GD
    let assignedLicenseId = selectedApp.agency_id || selectedApp.agencyId;
    
    if (status === 'Approved by General Director') {
      const agencies = await fetch('/api/data?table=agencies').then(r => r.ok ? r.json() : []);
      const existingAgency = agencies.find((a: any) => a.name.toLowerCase() === selectedApp.agency.toLowerCase());
      
      const issueDate = new Date(selectedApp.registerDate || new Date());
      const formattedIssueDate = issueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const expiryDateObj = new Date(issueDate);
      expiryDateObj.setFullYear(expiryDateObj.getFullYear() + 1);
      const formattedExpiryDate = expiryDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (!existingAgency) {
        // Generate new License ID: 001-MOCAAD-DCA/YYYY
        const currentYear = new Date().getFullYear();
        const yearAgencies = agencies.filter((a: any) => a.licenseId?.endsWith(`/${currentYear}`) || a.license_id?.endsWith(`/${currentYear}`));
        const count = yearAgencies.length + 1;
        assignedLicenseId = `${String(count).padStart(3, '0')}-MOCAAD-DCA/${currentYear}`;
        
        const newAgency = {
          id: Math.random().toString(36).substr(2, 9),
          license_id: assignedLicenseId, // Using db snake_case for consistency via API
          name: selectedApp.agency,
          city: selectedApp.district,
          region: selectedApp.region,
          status: 'Active',
          contact_person: selectedApp.contactPerson,
          phone: selectedApp.phone,
          email: selectedApp.email,
          issue_date: formattedIssueDate,
          expiry_date: formattedExpiryDate,
          registered_by: user?.name || selectedApp.registeredBy || `${selectedApp.region || 'HQ'}-officer`,
          print_count: 0
        };
        await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'agencies', action: 'create', data: newAgency }) });
      } else {
        assignedLicenseId = existingAgency.licenseId || existingAgency.license_id;
      }
    }

    // Update application
    const updateFields: any = { status, status_color: color };
    if (reviewComment) updateFields.review_comment = reviewComment;
    if (status === 'Approved by General Director') updateFields.agency_id = assignedLicenseId;

    await fetch('/api/data', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ table: 'applications', action: 'update', data: { id: selectedApp.id, fields: updateFields } }) 
    });

    // Log activity
    await fetch('/api/data', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ table: 'activities', action: 'log', data: { user: user?.name || 'Reviewer', action: `Updated status to: ${status} for`, target: selectedApp.agency } }) 
    });

    // Refresh approvals list
    const updatedApps = await fetch('/api/data?table=applications').then(r => r.ok ? r.json() : []);
    setApprovals(Array.isArray(updatedApps) ? updatedApps.filter((app: any) => app.status !== 'Draft') : []);
    
    setSelectedApp(null);
    setIsEditing(false);
  };

  const handleUpdateFinancials = async () => {
    if (!selectedApp) return;
    const updateFields = {
      reg_fee: selectedApp.financials.regFee,
      app_fee: selectedApp.financials.appFee,
      discount: selectedApp.financials.discount,
      paid_amount: selectedApp.financials.paidAmount,
      total_due: selectedApp.financials.totalDue
    };
    await fetch('/api/data', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ table: 'applications', action: 'update', data: { id: selectedApp.id, fields: updateFields } }) 
    });
    
    const updatedApps = await fetch('/api/data?table=applications').then(r => r.ok ? r.json() : []);
    setApprovals(Array.isArray(updatedApps) ? updatedApps.filter((app: any) => app.status !== 'Draft') : []);
    
    setMessage("Financial records updated successfully.");
    setTimeout(() => setMessage(null), 3000);
  };

  const [message, setMessage] = useState<string | null>(null);

  const filteredApprovals = approvals.filter((item) => {
    const searchMatch = 
      (item.agency || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.agency_id || item.agencyId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.region || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const typeMatch = filterType === 'All' || item.type === filterType;
    const statusMatch = filterStatus === 'All' || item.status === filterStatus;
    
    return searchMatch && typeMatch && statusMatch;
  });

  const filteredChanges = agencyChanges.filter((item) => {
    const searchMatch = 
      (item.agency_id || item.agencyId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.requester || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    return searchMatch;
  });

  const handleApproveChange = async () => {
    if (!selectedChange) return;

    // Apply the change to the agency
    const agencies = await fetch('/api/data?table=agencies').then(r => r.ok ? r.json() : []);
    const agency = agencies.find((a: any) => a.licenseId === (selectedChange.agency_id || selectedChange.agencyId) || a.license_id === (selectedChange.agency_id || selectedChange.agencyId));
    
    if (agency) {
      const fields: any = {};
      if (selectedChange.type === 'edit') {
        if (selectedChange.data?.newName) fields.name = selectedChange.data.newName;
        
        // Handle document replacement
        if (selectedChange.data?.document && selectedChange.data?.r2Key) {
          const currentData = typeof agency.doc_data === 'string' ? JSON.parse(agency.doc_data) : (agency.doc_data || {});
          currentData[selectedChange.data.document] = selectedChange.data.r2Key;
          fields.doc_data = JSON.stringify(currentData);
        }
      } else if (selectedChange.type === 'delete') {
        await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'agencies', action: 'delete', data: { id: agency.id } }) });
      }
      
      if (Object.keys(fields).length > 0) {
        await fetch('/api/data', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ table: 'agencies', action: 'update', data: { id: agency.id, fields } }) 
        });
      }
    }

    // Delete the change request
    await fetch('/api/data', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ table: 'agency_changes', action: 'delete', data: { id: selectedChange.id } }) 
    });

    await fetch('/api/data', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ table: 'activities', action: 'log', data: { user: user?.name || 'Admin', action: `Approved ${selectedChange.type} for`, target: selectedChange.agency_id || selectedChange.agencyId } }) 
    });

    const changesRes = await fetch('/api/data?table=agency_changes');
    if (changesRes.ok) {
      const changesData = await changesRes.json();
      setAgencyChanges(Array.isArray(changesData) ? changesData : []);
    }
    
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
                          <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{item.agency_id || item.agencyId || 'NEW'}</span>
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
                      {item.agency_id || item.agencyId}
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
                <h3 className="text-2xl font-bold text-slate-900 mt-1">Agency: {selectedChange.agency_id || selectedChange.agencyId}</h3>
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
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Updated Document Registry</p>
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <div>
                              <p className="text-xs font-bold text-slate-900">{selectedChange.data?.document}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedChange.data?.fileName}</p>
                            </div>
                            {selectedChange.data?.r2Key && (
                              <button 
                                onClick={async () => {
                                  const key = selectedChange.data.r2Key;
                                  const res = await fetch('/api/storage', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'getDownloadUrl', key })
                                  });
                                  const { url } = await res.json();
                                  window.open(url, '_blank');
                                }}
                                className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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
                onClick={async () => {
                  await fetch('/api/data', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ table: 'agency_changes', action: 'delete', data: { id: selectedChange.id } }) 
                  });
                  const changesRes = await fetch('/api/data?table=agency_changes');
                  if (changesRes.ok) {
                    const changesData = await changesRes.json();
                    setAgencyChanges(Array.isArray(changesData) ? changesData : []);
                  }
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
                            onClick={async () => {
                              const key = selectedApp.docFileData?.[doc];
                              if (key && key.startsWith('http')) {
                                // Legacy base64/link
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(`<iframe src="${key}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                }
                              } else if (key) {
                                // R2 Key
                                try {
                                  const res = await fetch('/api/storage', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'getDownloadUrl', key })
                                  });
                                  if (!res.ok) throw new Error('Failed to get download URL');
                                  const { url } = await res.json();
                                  window.open(url, '_blank');
                                } catch (err) {
                                  alert('Failed to open document.');
                                }
                              } else {
                                alert('Document file not available.');
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

            <div className={`p-8 border-t border-slate-100 grid gap-4 bg-white ${(!isAlreadyReviewed(selectedApp) || isEditing) && user?.role === 'general_director' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {(!isAlreadyReviewed(selectedApp) || isEditing) ? (
                <>
                  <button 
                    onClick={() => handleAction('Draft', 'slate')}
                    className="py-3.5 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all"
                  >
                    Reject to Draft
                  </button>
                  {user?.role === 'general_director' && (
                    <button 
                      onClick={async () => {
                        if (confirm('Are you sure you want to permanently delete this application? This cannot be undone.')) {
                          await fetch('/api/data', { 
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' }, 
                            body: JSON.stringify({ table: 'applications', action: 'delete', data: { id: selectedApp.id } }) 
                          });
                          await fetch('/api/data', { 
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' }, 
                            body: JSON.stringify({ table: 'activities', action: 'log', data: { user: user.name, action: 'Deleted application for', target: selectedApp.agency } }) 
                          });
                          const updatedApps = await fetch('/api/data?table=applications').then(r => r.ok ? r.json() : []);
                          setApprovals(Array.isArray(updatedApps) ? updatedApps.filter((app: any) => app.status !== 'Draft') : []);
                          setSelectedApp(null);
                        }
                      }}
                      className="py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Delete App
                    </button>
                  )}
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
                      onClick={async () => {
                        if (user?.role === 'director') {
                          const agencies = await fetch('/api/data?table=agencies').then(r => r.ok ? r.json() : []);
                          const agency = agencies.find((a: any) => a.licenseId === (selectedApp.agency_id || selectedApp.agencyId) || a.license_id === (selectedApp.agency_id || selectedApp.agencyId));
                          if (agency) {
                            await fetch('/api/data', { 
                              method: 'POST', 
                              headers: { 'Content-Type': 'application/json' }, 
                              body: JSON.stringify({ table: 'agencies', action: 'update', data: { id: agency.id, fields: { print_count: (agency.printCount || agency.print_count || 0) + 1 } } }) 
                            });
                            await fetch('/api/data', { 
                              method: 'POST', 
                              headers: { 'Content-Type': 'application/json' }, 
                              body: JSON.stringify({ table: 'activities', action: 'log', data: { user: user.name, action: 'Printed certificate for', target: selectedApp.agency } }) 
                            });
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
