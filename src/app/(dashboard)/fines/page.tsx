'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  AlertOctagon, 
  Plus, 
  History,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { MOCK_DB } from '@/lib/mockDb';
import { useAuth } from '@/context/AuthContext';

export default function FinesPage() {
  const { user } = useAuth();
  const [expiredAgencies, setExpiredAgencies] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<any>(null);
  const [fineAmount, setFineAmount] = useState('');
  const [fineReason, setFineReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    MOCK_DB.init();
    // Get all agencies and filter for expired ones
    const allAgencies = MOCK_DB.get('agencies');
    setExpiredAgencies(allAgencies.filter((a: any) => a.status === 'Expired'));
    setFines(MOCK_DB.get('fines') || []);
  }, []);

  const handleIssueFine = () => {
    if (!selectedAgency || !fineAmount || !fineReason) return;

    const newFine = {
      id: Math.random().toString(36).substr(2, 9),
      agencyId: selectedAgency.licenseId,
      agencyName: selectedAgency.name,
      amount: fineAmount,
      reason: fineReason,
      issuedBy: user?.name || 'Director',
      date: new Date().toLocaleDateString(),
      status: 'Pending'
    };

    const currentFines = MOCK_DB.get('fines') || [];
    MOCK_DB.save('fines', [newFine, ...currentFines]);
    MOCK_DB.logActivity(user?.name || 'Director', 'Issued a fine to', selectedAgency.name);
    
    setFines([newFine, ...fines]);
    setSelectedAgency(null);
    setFineAmount('');
    setFineReason('');
    setMessage(`Fine of $${fineAmount} issued to ${selectedAgency.name} successfully.`);
    setTimeout(() => setMessage(null), 5000);
  };

  if (user?.role !== 'director') {
    return <div className="p-20 text-center text-slate-500 font-bold">Unauthorized. This page is only for the Director.</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Compliance & Fines</h1>
          <p className="text-slate-500 mt-1">Issue and manage penalties for expired licenses and regulatory violations.</p>
        </div>
        <div className="flex bg-blue-50 border border-blue-100 rounded-2xl px-4 py-2 gap-3 items-center">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
          <p className="text-sm font-bold text-blue-800">Enforcement Mode Active</p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm font-bold text-green-800">{message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Expired Agencies List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                Agencies with Expired Licenses
              </h2>
              <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-1 rounded-lg uppercase">
                {expiredAgencies.length} Required Action
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Agency</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expiredAgencies.map((agency) => (
                    <tr key={agency.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{agency.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{agency.licenseId} • {agency.city}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedAgency(agency)}
                          className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all shadow-md shadow-red-600/20"
                        >
                          Issue Fine
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expiredAgencies.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                        Excellent! No expired licenses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom: Fine History */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Recent Fine History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/30">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Agency</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Reason</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Issued Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {fines.map((fine) => (
                    <tr key={fine.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{fine.agencyName}</td>
                      <td className="px-6 py-4 font-black text-red-600">${fine.amount}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{fine.reason}</td>
                      <td className="px-6 py-4 text-right text-slate-400 font-medium">{fine.date}</td>
                    </tr>
                  ))}
                  {fines.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic font-medium">
                        No fines issued in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Fine Issuance Form */}
        <div className="space-y-6">
          <div className={`bg-white rounded-3xl border transition-all duration-500 ${selectedAgency ? 'border-blue-200 shadow-xl shadow-blue-900/5' : 'border-slate-200 shadow-sm opacity-50'}`}>
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Issue Penalty</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {!selectedAgency ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <Plus className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400 px-10">Select an expired agency from the list to issue a fine.</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Target Agency</p>
                    <p className="text-lg font-black text-blue-900 leading-tight">{selectedAgency.name}</p>
                    <p className="text-xs text-blue-500 font-bold mt-1 uppercase tracking-tighter">ID: {selectedAgency.licenseId}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Fine Amount ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                      <input 
                        type="number" 
                        value={fineAmount}
                        onChange={(e) => setFineAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-black text-lg text-slate-900 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Penalty Reason</label>
                    <textarea 
                      value={fineReason}
                      onChange={(e) => setFineReason(e.target.value)}
                      placeholder="e.g. Overdue renewal penalty for more than 30 days..."
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm font-medium text-slate-900 transition-all resize-none"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button 
                      onClick={() => setSelectedAgency(null)}
                      className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleIssueFine}
                      disabled={!fineAmount || !fineReason}
                      className="flex-[2] py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      Process Fine
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl space-y-3">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-amber-600" />
              <h4 className="text-sm font-bold text-amber-900 uppercase">Policy Notice</h4>
            </div>
            <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
              As the Director, you have the authority to levy financial penalties on agencies that fail to comply with renewal deadlines. Fines are calculated based on the duration of expiration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
