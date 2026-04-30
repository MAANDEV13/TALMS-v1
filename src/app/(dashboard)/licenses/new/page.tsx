'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  FileUp, 
  Plus, 
  Trash2, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  History
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MOCK_DB } from '@/lib/mockDb';

export default function NewApplicationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameChecked, setNameChecked] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [existingAgencies, setExistingAgencies] = useState<any[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<any>(null);
  
  // Form state
  const [agencyName, setAgencyName] = useState('');
  const [type, setType] = useState('new');
  const [businessType, setBusinessType] = useState<'solo' | 'partnership'>('solo');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  const somalilandRegions = [
    'Maroodi Jeex',
    'Awdal',
    'Sool',
    'Togdheer',
    'Sanaag',
    'Sahil'
  ];

  const somalilandDistricts = [
    'Hargeisa',
    'Borama',
    'Berbera',
    'Burao',
    'Erigavo',
    'Las Anod',
    'Gabiley',
    'Wajaale',
    'Sheikh',
    'Aynabo',
    'Kalabaydh',
    'Arabsiyo',
    'Buuhoodle',
    'Caynaba',
    'Ceerigaabo',
    'Laasqoray',
    'Xudun'
  ];

  const handleNameCheck = (): boolean => {
    if (!agencyName) return false;
    
    // For renewal, we just search for matching agencies
    if (type === 'renewal') {
      const agencies = MOCK_DB.get('agencies');
      const matches = agencies.filter((a: any) => 
        a.name.toLowerCase().includes(agencyName.toLowerCase()) ||
        a.licenseId.toLowerCase().includes(agencyName.toLowerCase())
      );
      setExistingAgencies(matches);
      if (matches.length > 0) {
        setNameChecked(true);
        setNameError(null);
        return true;
      } else {
        setNameError("No matching agencies found. Please check the name or License ID.");
        setNameChecked(false);
        return false;
      }
    }

    // For new, we check if it DOES NOT exist
    const isAvailable = MOCK_DB.checkAgencyName(agencyName);
    if (isAvailable) {
      setNameChecked(true);
      setNameError(null);
      return true;
    }

    setNameError("Agency name is already registered or has a pending application.");
    setNameChecked(false);
    return false;
  };

  const [selectionMade, setSelectionMade] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      if (type === 'new') {
        const validated = handleNameCheck();
        if (!validated) {
          return;
        }
      }

      if (type === 'renewal') {
        if (!selectedAgency) {
          setNameError('Please select an agency from the list first.');
          return;
        }
      }

      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (type === 'new' && !MOCK_DB.checkAgencyName(agencyName)) {
        setNameError('Agency name is already registered or has a pending application.');
        setCurrentStep(1);
        return;
      }

      setIsSubmitting(true);

      setTimeout(() => {
        const year = new Date().getFullYear();
        const generatedId = MOCK_DB.getNextLicenseId();

        const newApp = {
          id: Math.random().toString(36).substr(2, 9),
          agency: agencyName,
          agencyId: selectedAgency?.licenseId || generatedId,
          region: region,
          district: district,
          contactPerson: contactPerson,
          phone: phone,
          registerDate: new Date().toISOString().split('T')[0],
          type: type === 'new' ? 'New' : 'Renewal',
          status: 'Under Review',
          statusColor: 'amber',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        MOCK_DB.addApplication(newApp);
        setIsSubmitting(false);
        router.push('/licenses');
      }, 1500);
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const appsCount = MOCK_DB.get('applications').length + 1;
      const year = new Date().getFullYear();
      const generatedId = `${appsCount.toString().padStart(3, '0')}-MOCAAD-DCA/${year}`;

      const newApp = {
        id: Math.random().toString(36).substr(2, 9),
        agency: agencyName,
        agencyId: selectedAgency?.licenseId || generatedId,
        region: region,
        district: district,
        contactPerson: contactPerson,
        phone: phone,
        registerDate: new Date().toISOString().split('T')[0],
        type: type === 'new' ? 'New' : 'Renewal',
        status: 'Under Review',
        statusColor: 'amber',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      const existing = JSON.parse(localStorage.getItem('talms_applications') || '[]');
      localStorage.setItem('talms_applications', JSON.stringify([newApp, ...existing]));

      setIsSubmitting(false);
      router.push('/licenses');
    }, 1500);
  };

  if (!selectionMade) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="text-center space-y-4 pt-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">How can we help you today?</h1>
          <p className="text-slate-500 text-lg">Select the type of application you wish to start.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <button 
            onClick={() => {
              setType('new');
              setSelectionMade(true);
            }}
            className="group p-8 bg-white rounded-3xl border-2 border-slate-100 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-600/10 transition-all text-left space-y-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <Plus className="w-8 h-8 text-blue-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">New Agency</h3>
              <p className="text-slate-500 mt-2">Register a brand new travel agency for the first time in Somaliland.</p>
            </div>
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <span>Start Registration</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button 
            onClick={() => {
              setType('renewal');
              setSelectionMade(true);
            }}
            className="group p-8 bg-white rounded-3xl border-2 border-slate-100 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-600/10 transition-all text-left space-y-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
              <History className="w-8 h-8 text-amber-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">License Renewal</h3>
              <p className="text-slate-500 mt-2">Extend an existing license for another year. Requires valid Agency ID.</p>
            </div>
            <div className="flex items-center gap-2 text-amber-600 font-bold">
              <span>Find My Agency</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard"
          className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-600"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {type === 'new' ? 'New License Application' : 'License Renewal Application'}
          </h1>
          <p className="text-slate-500">
            {type === 'new' 
              ? 'Register a new travel agency in Somaliland.' 
              : 'Extend the license of an existing travel agency.'}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between px-12 relative before:absolute before:left-12 before:right-12 before:top-5 before:h-0.5 before:bg-slate-200">
        {[
          { step: 1, label: type === 'new' ? 'Identity Check' : 'Find Agency' },
          { step: 2, label: 'Documents' },
        ].map((s, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
              currentStep === s.step 
                ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                : currentStep > s.step 
                  ? 'bg-green-50 text-white' 
                  : 'bg-white border-2 border-slate-200 text-slate-400'
            }`}>
              {currentStep > s.step ? <CheckCircle2 className="w-6 h-6" /> : s.step}
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              currentStep === s.step ? 'text-blue-600' : 'text-slate-400'
            }`}>{s.label}</span>
          </div>
        ))}
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              {type === 'new' ? (
                <Building2 className="w-5 h-5 text-blue-600" />
              ) : (
                <History className="w-5 h-5 text-amber-500" />
              )}
              {type === 'new' ? 'Agency Verification' : 'Retrieve Existing Record'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  {type === 'new' ? 'Proposed Agency Name' : 'Agency Name or License ID'}
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={agencyName}
                    onChange={(e) => {
                      setAgencyName(e.target.value);
                      setNameChecked(false);
                      setNameError(null);
                      setSelectedAgency(null);
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 ${
                      nameError ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    }`}
                    placeholder={type === 'new' ? 'e.g. Hargeisa Global Travel' : 'Search by Name or SL-2023-...'}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleNameCheck}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      nameChecked 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                    }`}
                  >
                    {nameChecked ? 'Verified' : 'Verify'}
                  </button>
                </div>
                {nameChecked && !nameError && (
                  <p className="text-xs font-bold text-green-600 mt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    {type === 'new' 
                      ? '✓ This agency name is available for registration.' 
                      : '✓ Agency record found and verified for renewal.'}
                  </p>
                )}
                {nameError && (
                  <p className="text-xs font-bold text-red-600 mt-1 animate-in shake duration-500">
                    ✕ {nameError}
                  </p>
                )}
                {type === 'renewal' && existingAgencies.length > 0 && !selectedAgency && (
                  <div className="mt-4 space-y-2 max-h-60 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Select matching agency from records:</p>
                    {existingAgencies.map((agency) => (
                      <button
                        key={agency.id}
                        type="button"
                        onClick={() => {
                          setSelectedAgency(agency);
                          setAgencyName(agency.name);
                          setNameChecked(true);
                          setNameError(null);
                        }}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-300 rounded-xl transition-all text-left shadow-sm hover:shadow-md group"
                      >
                        <div>
                          <p className="text-sm font-black text-slate-900 group-hover:text-blue-700">{agency.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">{agency.licenseId}</span>
                            <span className="text-xs text-slate-400 font-medium">• {agency.city}</span>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-600 flex items-center justify-center transition-colors">
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedAgency && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-green-800 uppercase tracking-tight">Agency Selected for Renewal</p>
                        <p className="text-sm font-black text-green-900">{selectedAgency.name}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedAgency(null);
                        setNameChecked(false);
                      }}
                      className="text-xs font-bold text-green-700 hover:underline"
                    >
                      Change Agency
                    </button>
                  </div>
                )}
              </div>
              
              {type === 'new' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Business Structure</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBusinessType('solo')}
                      className={`px-4 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                        businessType === 'solo' 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                      }`}
                    >
                      Solo Proprietor
                    </button>
                    <button
                      type="button"
                      onClick={() => setBusinessType('partnership')}
                      className={`px-4 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                        businessType === 'partnership' 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                      }`}
                    >
                      Partnership
                    </button>
                  </div>
                </div>
              )}

              {type === 'new' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Contact Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
                    placeholder="contact@hargeisatravel.com"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm border-r border-slate-200 pr-3">+252</span>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setPhone(val);
                    }}
                    className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
                    placeholder="63 XXXXXXX"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Region</label>
                <select 
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 appearance-none"
                  required
                >
                  <option value="">Select Region</option>
                  {somalilandRegions.map(region => <option key={region} value={region}>{region}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">District</label>
                <select 
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 appearance-none"
                  required
                >
                  <option value="">Select District</option>
                  {somalilandDistricts.map(district => <option key={district} value={district}>{district}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Contact Person</label>
                <input 
                  type="text" 
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
                  placeholder="Full name of contact person"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileUp className="w-5 h-5 text-blue-600" />
              Required Documentation
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const requiredDocs = [
                  'Application Letter (MOCAAD Format)',
                  'National ID (Staff & Management)',
                  'Company Profile (Vision/Mission)',
                  'Memorandum & Articles of Association',
                  'Staff List & CVs',
                  'Managers/Owners CVs',
                  'Office Inventory List',
                  'Lease Agreement (Notarized)',
                  'Bank Statement (6 Months)',
                ];
                
                // Add Step 8 specifically if partnership
                if (businessType === 'partnership') {
                  requiredDocs.splice(6, 0, 'Shareholders Copy (Notarized)');
                }

                return requiredDocs.map((doc, i) => (
                  <div key={i} className="p-5 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group flex items-center gap-4 text-left">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <FileUp className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">{doc}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">PDF/Image required</p>
                    </div>
                    <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                      Upload
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                disabled={currentStep === 1 || isSubmitting}
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50 transition-all"
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                  currentStep < 2 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  currentStep < 2 ? 'Next Step' : 'Complete Submission'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
