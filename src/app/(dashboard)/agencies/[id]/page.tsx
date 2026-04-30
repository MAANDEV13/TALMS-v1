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
  Edit2
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_DB } from '@/lib/mockDb';
import { useAuth } from '@/context/AuthContext';

export default function AgencyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [agency, setAgency] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history'>('overview');

  useEffect(() => {
    MOCK_DB.init();
    const agencies = MOCK_DB.get('agencies');
    const found = agencies.find((a: any) => a.id === id);
    if (found) {
      // Add default docs if missing
      if (!found.docs) {
        found.docs = [
          'Application Letter (MOCAAD Format)',
          'National ID (Staff & Management)',
          'Company Profile (Vision/Mission)',
          'Memorandum & Articles of Association',
          'Staff List & CVs',
          'Lease Agreement (Notarized)',
          'Bank Statement (6 Months)'
        ];
      }
      setAgency(found);
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-xl border-4 border-white shrink-0">
              <span className="text-2xl font-black text-white uppercase">{agency.name[0]}</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">{agency.name}</h1>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                  agency.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  {agency.status}
                </span>
              </div>
              <p className="text-slate-500 font-medium mt-1">License ID: <span className="font-bold text-blue-600">{agency.licenseId}</span> • {agency.city}, {agency.region}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">
            <Printer className="w-4 h-4" />
            Print Status
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
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
                       <p className="text-sm font-bold text-slate-900">{agency.contactPerson}</p>
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
                {agency.alternatePerson && (
                  <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
                          <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-tighter">Alternate Contact</p>
                        <p className="text-sm font-bold text-slate-900">{agency.alternatePerson.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {agency.alternatePerson.phone}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
             <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-6 shadow-2xl shadow-slate-900/40 border border-white/5">
                <div className="flex items-center gap-3">
                   <ShieldCheck className="w-6 h-6 text-blue-400" />
                   <h3 className="font-bold text-lg uppercase tracking-tight">License Status</h3>
                </div>
                <div className="space-y-4">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Issue Date</p>
                      <p className="text-sm font-bold">{agency.issueDate || 'Jan 12, 2023'}</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Expiry Date</p>
                      <p className="text-sm font-bold text-amber-400">{agency.expiryDate || 'Jan 12, 2024'}</p>
                   </div>
                </div>
                <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                   Request Renewal
                </button>
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
               <p className="text-sm text-slate-500 mt-1">Directly manage and replace official compliance files.</p>
             </div>
             <button 
               onClick={() => {
                 const newDoc = prompt('Enter document name:');
                 if (newDoc) {
                   const updated = {...agency, docs: [...agency.docs, newDoc]};
                   setAgency(updated);
                   const all = MOCK_DB.get('agencies');
                   MOCK_DB.save('agencies', all.map((a: any) => a.id === id ? updated : a));
                 }
               }}
               className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all text-xs uppercase tracking-widest"
             >
               + Add New Placeholder
             </button>
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
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 leading-tight">{doc}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase border border-green-200">Verified</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">PDF Repository</span>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    id={`replace-${i}`}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        MOCK_DB.requestAgencyChange({
                          agencyId: agency.id,
                          type: 'edit',
                          data: { document: doc, action: 'Replace File', fileName: e.target.files[0].name },
                          requester: user?.name || 'Officer'
                        });
                        MOCK_DB.logActivity(user?.name || 'Officer', `Requested file replacement for: ${doc}`, agency.name);
                        setMessage(`Your replacement request for "${doc}" has been sent to the General Director for approval.`);
                        setTimeout(() => setMessage(null), 5000);
                      }
                    }}
                  />
                  <label 
                    htmlFor={`replace-${i}`}
                    className="px-4 py-2 bg-white border border-slate-200 text-blue-600 text-[10px] font-black uppercase rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    Replace
                  </label>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white p-20 rounded-3xl border border-slate-100 shadow-sm text-center space-y-6">
           <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100 shadow-inner">
              <History className="w-10 h-10 text-slate-300" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Compliance History</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2 font-medium">Detailed logs of all regulatory interactions, inspections, and license renewals will be archived here.</p>
           </div>
           <button className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">
              Refresh Audit Logs
           </button>
        </div>
      )}
    </div>
  );
}
