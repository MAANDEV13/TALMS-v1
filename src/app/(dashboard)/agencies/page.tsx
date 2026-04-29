'use client';

import React from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  MapPin, 
  Calendar,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function AgenciesPage() {
  const agencies = [
    { id: '1', name: 'Somaliland Travel Services', licenseId: 'SL-2023-001', city: 'Hargeisa', branches: 4, joined: 'Jan 2023', status: 'Active' },
    { id: '2', name: 'Borama International Tours', licenseId: 'SL-2023-042', city: 'Borama', branches: 2, joined: 'Mar 2023', status: 'Active' },
    { id: '3', name: 'Berbera Port Logistics', licenseId: 'SL-2023-115', city: 'Berbera', branches: 3, joined: 'Jun 2023', status: 'Active' },
    { id: '4', name: 'Burao Expeditions', licenseId: 'SL-2024-008', city: 'Burao', branches: 5, joined: 'Feb 2024', status: 'Expired' },
    { id: '5', name: 'Erigavo Eco Tours', licenseId: 'SL-2024-015', city: 'Erigavo', branches: 1, joined: 'Apr 2024', status: 'Active' },
    { id: '6', name: 'Las Anod Express', licenseId: 'SL-2024-022', city: 'Las Anod', branches: 2, joined: 'May 2024', status: 'Active' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Registered Agencies</h1>
          <p className="text-slate-500 mt-1">Directory of all travel agencies registered in Somaliland.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search agencies..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 bg-white">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-6 gap-6">
          {agencies.map((agency) => (
            <div key={agency.id} className="group relative bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-slate-200/40 hover:border-blue-100 transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  agency.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {agency.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{agency.name}</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">ID: {agency.licenseId}</p>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{agency.city} ({agency.branches} branches)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Joined {agency.joined}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <button className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline">
                  View Details
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
