'use client';

import React from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  MapPin, 
  Calendar,
  ChevronRight,
  ExternalLink,
  Edit2,
  Trash2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { MOCK_DB } from '@/lib/mockDb';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AgenciesPage() {
  const { user } = useAuth();
  const [agencies, setAgencies] = React.useState<any[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);
  const [editingAgency, setEditingAgency] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('All');
  const [filterRegion, setFilterRegion] = React.useState('All');

  React.useEffect(() => {
    MOCK_DB.init();
    const allAgencies = MOCK_DB.get('agencies');
    if (user?.role === 'regional_director' && user.region) {
      setAgencies(allAgencies.filter((a: any) => a.region === user.region));
    } else {
      setAgencies(allAgencies);
    }
  }, [user]);

  const handleRequestChange = (agencyId: string, type: 'edit' | 'delete') => {
    if (type === 'edit') {
      const agency = agencies.find(a => a.id === agencyId);
      setEditingAgency({ ...agency, newName: agency.name, docs: ['National ID', 'Company Profile', 'Lease Agreement'] });
      return;
    }
    
    MOCK_DB.requestAgencyChange({
      agencyId,
      type,
      requester: user?.name || 'Unknown Officer'
    });
    setMessage(`Your deletion request has been sent to the General Director for approval.`);
    setTimeout(() => setMessage(null), 5000);
  };

  const submitEditRequest = () => {
    MOCK_DB.requestAgencyChange({
      agencyId: editingAgency.id,
      type: 'edit',
      data: { newName: editingAgency.newName, docs: editingAgency.docs },
      requester: user?.name || 'Unknown Officer'
    });
    setEditingAgency(null);
    setMessage(`Your edit request for ${editingAgency.name} has been sent to the General Director.`);
    setTimeout(() => setMessage(null), 5000);
  };

  const filteredAgencies = agencies.filter((a) => {
    const searchMatch = 
      (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.district || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const statusMatch = filterStatus === 'All' || a.status === filterStatus;
    const regionMatch = filterRegion === 'All' || a.region === filterRegion;
    
    return searchMatch && statusMatch && regionMatch;
  });

  return (
    <div className="space-y-8 relative">
      {editingAgency && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Edit Agency Record
              </h2>
              <button onClick={() => setEditingAgency(null)} className="text-slate-400 hover:text-slate-600">
                <ChevronRight className="w-6 h-6 rotate-90" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 text-slate-900">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Propose New Name</label>
                <input 
                  type="text" 
                  value={editingAgency.newName}
                  onChange={(e) => setEditingAgency({...editingAgency, newName: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">Document Management</label>
                <div className="space-y-2">
                  {editingAgency.docs.map((doc: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{doc}</span>
                      </div>
                      <button 
                        onClick={() => {
                          const newDoc = prompt('Enter replacement document name:', doc);
                          if (newDoc) {
                            const newDocs = [...editingAgency.docs];
                            newDocs[i] = newDoc;
                            setEditingAgency({...editingAgency, docs: newDocs});
                          }
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-blue-600 text-[10px] font-black uppercase rounded-lg hover:bg-blue-50 transition-all flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3 h-3" />
                        Change File
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    const newDoc = prompt('Enter new document name:');
                    if (newDoc) setEditingAgency({...editingAgency, docs: [...editingAgency.docs, newDoc]});
                  }}
                  className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 text-sm font-bold rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all bg-slate-50/50"
                >
                  + Add New Document Placeholder
                </button>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-800">
                  IMPORTANT: This change will not be permanent until approved by the General Director.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditingAgency(null)} className="flex-1 py-2.5 font-bold text-slate-600 hover:bg-slate-50 rounded-xl">Cancel</button>
              <button 
                onClick={submitEditRequest}
                className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20"
              >
                Request Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Registered Agencies</h1>
          <p className="text-slate-500 mt-1">Directory of all travel agencies registered in Somaliland.</p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <p className="text-sm font-bold text-blue-800">{message}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, ID, region, or contact..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Expired">Expired</option>
            </select>
            {user?.role !== 'regional_director' && (
              <select 
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 outline-none"
              >
                <option value="All">All Regions</option>
                <option value="Maroodi Jeex">Maroodi Jeex</option>
                <option value="Togdheer">Togdheer</option>
                <option value="Sanaag">Sanaag</option>
                <option value="Awdal">Awdal</option>
                <option value="Sool">Sool</option>
                <option value="Gabiley">Gabiley</option>
                <option value="Saaxil">Saaxil</option>
              </select>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">License ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agency Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                {(user?.role === 'officer' || user?.role === 'director' || user?.role === 'general_director') && (
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Registered By</th>
                )}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgencies.map((agency) => (
                <tr key={agency.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 uppercase tracking-tight">
                      {agency.licenseId}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-sm font-black text-white uppercase">{agency.name[0]}</span>
                      </div>
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{agency.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{agency.city}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      agency.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {agency.status}
                    </span>
                  </td>
                  {(user?.role === 'officer' || user?.role === 'director' || user?.role === 'general_director') && (
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {agency.registeredBy || 'N/A'}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleRequestChange(agency.id, 'edit')}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Request Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleRequestChange(agency.id, 'delete')}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Request Deletion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link 
                      href={`/agencies/${agency.id}`}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="View Full Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
