'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MOCK_DB } from '@/lib/mockDb';
import { ShieldCheck, Building2, Download } from 'lucide-react';

export default function PrintLicensePage() {
  const params = useParams();
  const id = params.id as string;
  const [app, setApp] = useState<any>(null);

  useEffect(() => {
    const apps = MOCK_DB.get('applications');
    const defaults = [
      { id: '1', agency: 'Hargeisa Sky Travels', type: 'New', status: 'Under Review', statusColor: 'amber', date: 'Oct 24, 2023' },
      { id: '2', agency: 'Berbera Maritime Tours', type: 'Renewal', status: 'Approved by general_director', statusColor: 'green', date: 'Oct 23, 2023' },
    ];
    const found = [...apps, ...defaults].find(a => a.id === id);
    setApp(found);

    if (found) {
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [id]);

  if (!app) return <div className="p-10 text-center">Loading License...</div>;

  return (
    <div className="license-print-container">
      <style jsx global>{`
        /* Reset for the standalone print page ONLY */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          width: 100% !important;
          height: 100% !important;
        }

        .license-print-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: white;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          .license-print-container {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <div className="license-certificate shadow-2xl border-slate-100 border p-16 print:p-10 print:shadow-none print:border-none w-[210mm] h-[297mm] relative overflow-hidden flex flex-col items-center bg-white">
        {/* Background Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-45deg] pointer-events-none">
          <ShieldCheck className="w-[800px] h-[800px] text-blue-900" />
        </div>
        
        <div className="relative z-10 w-full flex flex-col items-center text-center">
          {/* Header */}
          <div className="flex items-center gap-6 mb-12">
            <Building2 className="w-24 h-24 text-blue-900" />
            <div className="text-left border-l-4 border-blue-900 pl-6">
              <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none">SOMALILAND</h2>
              <p className="text-base font-bold text-blue-800 tracking-[0.3em] uppercase mt-2">Travel Authority Office</p>
            </div>
          </div>
          
          <div className="h-2 w-64 bg-blue-900 rounded-full mb-20"></div>
          
          <h1 className="text-7xl font-black text-slate-900 mb-8 tracking-tighter uppercase leading-none">Travel Agency License</h1>
          <p className="text-2xl font-medium text-slate-500 mb-20 italic">This document certifies the official legal authorization of:</p>
          
          {/* Agency Details */}
          <div className="bg-slate-50 border-4 border-double border-slate-200 p-16 rounded-[40px] mb-20 w-full max-w-3xl shadow-sm">
            <h3 className="text-6xl font-black text-blue-900 mb-4">{app.agency}</h3>
            <p className="text-2xl font-bold text-slate-500 uppercase tracking-[0.2em]">License ID: SL-STA-{app.id.toUpperCase()}</p>
          </div>
          
          {/* Dates */}
          <div className="grid grid-cols-2 gap-24 text-left w-full max-w-3xl mb-32">
            <div className="space-y-2">
              <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Issue Date</p>
              <p className="text-3xl font-black text-slate-900">{app.date}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Expiry Date</p>
              <p className="text-3xl font-black text-slate-900">Oct 24, 2025</p>
            </div>
          </div>
          
          {/* Signatures & QR */}
          <div className="w-full max-w-4xl flex items-end justify-between mt-12 px-10">
            <div className="text-center">
              <div className="w-56 h-1.5 bg-slate-200 mb-4"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Digital Verification</p>
              <div className="mt-6 w-28 h-28 bg-white rounded-2xl mx-auto flex items-center justify-center border-4 border-slate-50 shadow-sm">
                <div className="w-20 h-20 border-8 border-slate-50 flex items-center justify-center">
                  <Download className="w-10 h-10 text-slate-100" />
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-96 h-0.5 bg-slate-900 mb-6"></div>
              <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Director General Signature</p>
              <p className="text-sm font-bold text-blue-800 uppercase tracking-[0.3em] mt-2">Somaliland Republic</p>
            </div>
          </div>
        </div>
        
        {/* Decorative Borders */}
        <div className="absolute top-0 left-0 w-full h-8 bg-blue-900"></div>
        <div className="absolute bottom-0 left-0 w-full h-8 bg-blue-900"></div>
        <div className="absolute bottom-8 left-0 w-full h-1 bg-blue-400"></div>
      </div>
    </div>
  );
}
