'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  FileUp, 
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  ShieldCheck,
  AlertCircle,
  FileText,
  Printer,
  History,
  Download,
  Edit2,
  Eye,
  Clock,
  ArrowRight,
  Save,
  Loader2,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AgencyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [agency, setAgency] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history'>('overview');
  const [editingDates, setEditingDates] = useState(false);
  const [editIssueDate, setEditIssueDate] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [savingDates, setSavingDates] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const uploadFileToR2 = async (file: File, prefix: string) => {
    const key = `${prefix}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const res = await fetch('/api/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getUploadUrl', key, contentType: file.type })
    });
    
    if (!res.ok) throw new Error('Failed to get upload URL');
    const { url } = await res.json();
    
    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });
    
    if (!uploadRes.ok) throw new Error('Failed to upload file to R2');
    return key;
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [agencyRes, activityRes] = await Promise.all([
          fetch('/api/data?table=agencies'),
          fetch('/api/data?table=activities')
        ]);
        
        if (agencyRes.ok) {
          const agencies = await agencyRes.json();
          const found = agencies.find((a: any) => a.id === id);
          if (found) {
            // Parse docs JSON if needed
            const parsedDocs = typeof found.docs === 'string' ? JSON.parse(found.docs) : (found.docs || []);
            found.docs = parsedDocs;
            const parsedData = typeof found.doc_data === 'string' ? JSON.parse(found.doc_data) : (found.doc_data || {});
            found.docData = parsedData;
            const parsedFileData = typeof found.doc_file_data === 'string' ? JSON.parse(found.doc_file_data) : (found.doc_file_data || {});
            found.doc_file_data = parsedFileData;
            
            // Add default docs if missing
            if (found.docs.length === 0) {
                found.docs = [
                  'Application Letter',
                  'National ID cards (Staff & Management)',
                  'Company Profile (Vision, Mission, Activities)',
                  'Memorandum & Articles of Association',
                  'Staff list and CVs',
                  'Travel Agency Managers/Owners CVs',
                  'Shareholders Notarized Document',
                  'Office Inventory List',
                  'Notarized Lease Agreement',
                  'Bank Statement (Last 6 Months)'
                ];
            }
            setAgency(found);
          }
        }
        
        if (activityRes.ok) {
          const allActivities = await activityRes.json();
          setActivities(Array.isArray(allActivities) ? allActivities : []);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    }
    
    if (id) {
      loadData();
    }
  }, [id]);

  if (!agency) return <div className="p-20 text-center">Loading Agency Profile...</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-4">
            {(() => {
              const docData = typeof agency.doc_file_data === 'string' ? (() => { try { return JSON.parse(agency.doc_file_data); } catch { return {}; } })() : (agency.doc_file_data || {});
              const logoKey = docData?.agency_logo;
              if (logoKey) {
                return (
                  <>
                    <img
                      src={logoKey.startsWith('http') ? logoKey : `/api/storage?key=${encodeURIComponent(logoKey)}`}
                      alt={agency.name}
                      className="w-16 h-16 rounded-2xl object-cover shadow-xl border-4 border-white shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                    />
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-xl border-4 border-white shrink-0 hidden">
                      <span className="text-2xl font-black text-white uppercase">{agency.name[0]}</span>
                    </div>
                  </>
                );
              }
              return (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-xl border-4 border-white shrink-0">
                  <span className="text-2xl font-black text-white uppercase">{agency.name[0]}</span>
                </div>
              );
            })()}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">{agency.name}</h1>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                  agency.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  {agency.status}
                </span>
              </div>
              <p className="text-slate-500 font-medium mt-1">License ID: <span className="font-bold text-blue-600">{agency.license_id || agency.licenseId}</span> • {agency.city}, {agency.region}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              if (user?.role === 'director') {
                const updated = { ...agency, print_count: (agency.print_count || agency.printCount || 0) + 1 };
                setAgency(updated);
                
                fetch('/api/data', { 
                  method: 'POST', 
                  headers: { 'Content-Type': 'application/json' }, 
                  body: JSON.stringify({ table: 'agencies', action: 'update', data: { id: agency.id, fields: { print_count: updated.print_count } } }) 
                });
                
                fetch('/api/data', { 
                  method: 'POST', 
                  headers: { 'Content-Type': 'application/json' }, 
                  body: JSON.stringify({ table: 'activities', action: 'log', data: { user: user.name, action: 'Printed agency status report for', target: agency.name } }) 
                });
              }
              // Clean print: open a new window with only important details
              const printWindow = window.open('', '_blank', 'width=700,height=900');
              if (printWindow) {
                printWindow.document.write(`
                  <html><head><title>Agency Status - ${agency.name}</title>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap');
                    body { font-family: 'Montserrat', sans-serif; padding: 40px; color: #0f172a; }
                    h1 { font-size: 22px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
                    h2 { font-size: 14px; color: #1e40af; font-weight: 700; margin-bottom: 30px; }
                    .logo-header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
                    .logo-header img { width: 100px; margin-bottom: 10px; }
                    .logo-header p { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 800; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; }
                    td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
                    td.label { font-weight: 700; color: #475569; width: 40%; }
                    td.value { font-weight: 600; color: #0f172a; }
                    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
                    .status.active { background: #dcfce7; color: #15803d; }
                    .status.expired { background: #fee2e2; color: #dc2626; }
                    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
                    @media print { body { padding: 20px; } }
                  </style></head><body>
                  <div class="logo-header">
                    <img src="/logo.png" alt="Logo" />
                    <h1>Agency Status Report</h1>
                    <p>Ministry of Civil Aviation & Airport's Development</p>
                  </div>
                  <table>
                    <tr><th colspan="2">Agency Details</th></tr>
                    <tr><td class="label">Agency Name</td><td class="value">${agency.name}</td></tr>
                    <tr><td class="label">License ID</td><td class="value">${agency.license_id || agency.licenseId || 'N/A'}</td></tr>
                    <tr><td class="label">Status</td><td class="value"><span class="status ${agency.status === 'Active' ? 'active' : 'expired'}">${agency.status}</span></td></tr>
                    <tr><td class="label">Region</td><td class="value">${agency.region || 'N/A'}</td></tr>
                    <tr><td class="label">District / City</td><td class="value">${agency.city || 'N/A'}</td></tr>
                    <tr><th colspan="2" style="padding-top:24px">Contact Information</th></tr>
                    <tr><td class="label">Contact Person</td><td class="value">${agency.contact_person || agency.contactPerson || 'N/A'}</td></tr>
                    <tr><td class="label">Phone</td><td class="value">${agency.phone || 'N/A'}</td></tr>
                    <tr><td class="label">Email</td><td class="value">${agency.email || 'N/A'}</td></tr>
                    ${(agency.alternate_person || agency.alternatePerson) ? `
                    <tr><th colspan="2" style="padding-top:24px">Alternate Contact</th></tr>
                    <tr><td class="label">Contact Person</td><td class="value">${agency.alternate_person?.name || agency.alternatePerson?.name || 'N/A'}</td></tr>
                    <tr><td class="label">Phone</td><td class="value">${agency.alternate_person?.phone || agency.alternatePerson?.phone || 'N/A'}</td></tr>
                    ` : ''}
                    <tr><th colspan="2" style="padding-top:24px">License Dates</th></tr>
                    <tr><td class="label">Issue Date</td><td class="value">${agency.issue_date || agency.issueDate || 'Not Issued'}</td></tr>
                    <tr><td class="label">Expiry Date</td><td class="value">${agency.expiry_date || agency.expiryDate || 'Not Issued'}</td></tr>
                    <tr><td class="label">Print Count</td><td class="value">${agency.printCount || 0} time(s)</td></tr>
                  </table>
                  <div class="footer">Printed on ${new Date().toLocaleDateString()} — TALMS Official Report</div>
                  </body></html>
                `);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 500);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Status
          </button>
          <button 
            onClick={() => {
              // Export agency data as JSON file
              const exportData = {
                name: agency.name,
                licenseId: agency.licenseId,
                status: agency.status,
                region: agency.region,
                city: agency.city,
                contactPerson: agency.contactPerson,
                phone: agency.phone,
                email: agency.email,
                issueDate: agency.issueDate,
                expiryDate: agency.expiryDate,
                registeredBy: agency.registeredBy || 'N/A',
                documents: agency.docs || [],
                exportedAt: new Date().toISOString()
              };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${agency.name.replace(/\s+/g, '_')}_export.json`;
              a.click();
              URL.revokeObjectURL(url);

              // Export any stored doc files
              if (agency.docFileData) {
                Object.entries(agency.docFileData).forEach(([docName, base64]: [string, any]) => {
                  try {
                    const link = document.createElement('a');
                    link.href = base64;
                    link.download = docName.replace(/\s+/g, '_') + '.pdf';
                    link.click();
                  } catch (e) { /* skip invalid data */ }
                });
              }

              fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table: 'activities', action: 'log', data: { user: user?.name || 'User', action: 'Exported agency data for', target: agency.name } })
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Agency Overview', icon: Building2 },
          { id: 'documents', label: 'Document Registry', icon: FileUp },
          { id: 'history', label: 'Compliance History', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Primary Details */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-4 uppercase tracking-tight">Business Information</h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Name</p>
                  <p className="text-sm font-bold text-slate-900">{agency.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structure</p>
                  <p className="text-sm font-bold text-slate-900">Registered Agency</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Region</p>
                  <p className="text-sm font-bold text-slate-900">{agency.region}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">District/City</p>
                  <p className="text-sm font-bold text-slate-900">{agency.city}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-4 uppercase tracking-tight">Contact Personnel</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <User className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="text-xs font-black text-blue-600 uppercase tracking-tighter">Primary Contact</p>
                       <p className="text-sm font-bold text-slate-900">{agency.contact_person || agency.contactPerson || 'Not Provided'}</p>
                     </div>
                   </div>
                   <div className="space-y-2 pt-2">
                     <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Phone className="w-3 h-3 text-blue-500" />
                        {agency.phone}
                     </div>
                     <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Mail className="w-3 h-3 text-blue-500" />
                        {agency.email || 'No email provided'}
                     </div>
                   </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-blue-600 uppercase tracking-tighter">Secondary Contact</p>
                        <p className="text-sm font-bold text-slate-900">{agency.alternate_name || agency.alternate_person?.name || agency.alternatePerson?.name || 'Not Provided'}</p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Phone className="w-3 h-3 text-blue-500" />
                          {agency.alternate_phone || agency.alternate_person?.phone || agency.alternatePerson?.phone || 'Not Provided'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Mail className="w-3 h-3 text-blue-500" />
                          No email provided
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
             <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-6 shadow-2xl shadow-slate-900/40 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                    <h3 className="font-bold text-lg uppercase tracking-tight">License Status</h3>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'director' || user?.role === 'general_director') && !editingDates && (
                    <button
                      onClick={() => {
                        setEditIssueDate(agency.issue_date || agency.issueDate || '');
                        setEditExpiryDate(agency.expiry_date || agency.expiryDate || '');
                        setEditingDates(true);
                      }}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all" title="Edit Dates"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Issue Date</p>
                      {editingDates ? (
                        <input
                          type="date"
                          value={editIssueDate}
                          onChange={(e) => setEditIssueDate(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        <p className="text-sm font-bold">{agency.issue_date || agency.issueDate || 'Not Issued'}</p>
                      )}
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Expiry Date</p>
                      {editingDates ? (
                        <input
                          type="date"
                          value={editExpiryDate}
                          onChange={(e) => setEditExpiryDate(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-sm font-bold text-amber-400 outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      ) : (
                        <p className="text-sm font-bold text-amber-400">{agency.expiry_date || agency.expiryDate || 'Not Issued'}</p>
                      )}
                   </div>
                </div>
                {editingDates ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditingDates(false)}
                      className="flex-1 py-3 border border-white/20 text-white/70 font-bold rounded-xl hover:bg-white/10 transition-all text-xs uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setSavingDates(true);
                        const fields: any = {};
                        if (editIssueDate) fields.issue_date = new Date(editIssueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        if (editExpiryDate) fields.expiry_date = new Date(editExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        await fetch('/api/data', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ table: 'agencies', action: 'update', data: { id: agency.id, fields } })
                        });
                        await fetch('/api/data', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ table: 'activities', action: 'log', data: { user: user?.name || 'Admin', action: 'Updated license dates for', target: agency.name } })
                        });
                        setAgency({ ...agency, issue_date: fields.issue_date || agency.issue_date, expiry_date: fields.expiry_date || agency.expiry_date });
                        setEditingDates(false);
                        setSavingDates(false);
                        setMessage('License dates updated successfully.');
                        setTimeout(() => setMessage(null), 4000);
                      }}
                      disabled={savingDates}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-xs uppercase flex items-center justify-center gap-2 active:scale-95"
                    >
                      {savingDates ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Dates
                    </button>
                  </div>
                ) : (
                  <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                    Request Renewal
                  </button>
                )}
              {(user?.role === 'officer' || user?.role === 'general_director' || user?.role === 'director') && (agency.print_count || agency.printCount) > 0 && (
                <div className="p-4 mt-4 bg-amber-50 border border-amber-100 rounded-3xl flex items-center gap-3">
                  <Printer className="w-5 h-5 text-amber-600" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 uppercase">Print Tracking</h4>
                    <p className="text-xs text-amber-700 font-medium">Certificate printed {agency.print_count || agency.printCount} time(s) by Director.</p>
                  </div>
                </div>
              )}
             </div>

             <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl">
                <div className="flex items-center gap-3 mb-3">
                   <AlertCircle className="w-5 h-5 text-blue-600" />
                   <h4 className="text-sm font-bold text-blue-900 uppercase">Compliance Note</h4>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  This agency is currently in <span className="font-black text-blue-900">Good Standing</span>. All documents are verified and up to date for the current fiscal year.
                </p>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Agency Document Registry</h3>
                <p className="text-sm text-slate-500 mt-1">Official compliance files for this agency.</p>
              </div>
            </div>

            {/* Read-only notice */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">Documents are managed through Applications</p>
                <p className="text-xs text-amber-700 mt-0.5">To update or replace documents, submit an <Link href="/licenses/new" className="underline font-bold">Update Agency</Link> or <Link href="/licenses/new" className="underline font-bold">Renewal</Link> application.</p>
              </div>
            </div>

           {message && (
             <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
               <ShieldCheck className="w-5 h-5 text-blue-600" />
               <p className="text-sm font-bold text-blue-800">{message}</p>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agency.docs.map((doc: string, i: number) => (
                <div key={i} className="p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-white transition-all group flex items-center gap-4 text-left shadow-sm hover:shadow-md">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-white border border-slate-100 flex items-center justify-center transition-colors group-hover:border-blue-100 shadow-sm">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 leading-tight truncate">{doc}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase border border-green-200">Verified</span>
                      {(() => {
                        const key = agency.docData?.[doc] || agency.doc_file_data?.[doc] || agency.docFileData?.[doc];
                        if (key && typeof key === 'string') {
                          const fileName = key.split('-').slice(1).join('-') || 'Existing File';
                          return <span className="text-[10px] text-blue-600 font-bold truncate max-w-[150px]">{fileName}</span>;
                        }
                        return <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">PDF Repository</span>;
                      })()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const key = agency.docData?.[doc] || agency.doc_file_data?.[doc] || agency.docFileData?.[doc];
                        if (!key) {
                          alert('This document is not yet uploaded to storage.');
                          return;
                        }
                        
                        if (key.startsWith('http') || key.startsWith('data:')) {
                           window.open(key, '_blank');
                           return;
                        }

                        try {
                          const res = await fetch('/api/storage', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'getDownloadUrl', key })
                          });
                          const { url } = await res.json();
                          window.open(url, '_blank');
                        } catch (err) {
                          alert('Failed to open document.');
                        }
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="View Document"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'history' && (() => {
        const agencyLogs = activities.filter((a: any) => 
          (a.target || '').toLowerCase().includes(agency.name.toLowerCase())
        );
        return (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Compliance History</h3>
                <p className="text-sm text-slate-500 mt-1">All activity logs related to {agency.name}.</p>
              </div>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                {agencyLogs.length} Records
              </span>
            </div>
            {agencyLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Administrator</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action Taken</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {agencyLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                              <User className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{log.user}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Authorized Session</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-700">{log.action}</span>
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{log.target}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-slate-900 font-black text-sm">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {log.created_at ? new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' }) : (log.time || '')}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{log.created_at ? new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Africa/Nairobi' }) : (log.date || '')}</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                  <History className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium">No activity logs found for this agency yet.</p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
