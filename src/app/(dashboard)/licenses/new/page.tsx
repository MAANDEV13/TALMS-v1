'use client';

import React, { useState, Suspense } from 'react';
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
  History,
  DollarSign,
  UserPlus,
  Camera,
  ImageIcon,
  User,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MOCK_DB } from '@/lib/mockDb';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

function NewApplicationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameChecked, setNameChecked] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [existingAgencies, setExistingAgencies] = useState<any[]>([]);
  const [allAgencies, setAllAgencies] = useState<any[]>([]);
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
  
  // New Personnel fields
  const [secondName, setSecondName] = useState('');
  const [secondPhone, setSecondPhone] = useState('');
  const [secondEmail, setSecondEmail] = useState('');
  const [altName, setAltName] = useState('');
  const [altPhone, setAltPhone] = useState('');

  // Financial fields
  const [regFee, setRegFee] = useState(0);
  const [appFee, setAppFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [feePaid, setFeePaid] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [docFileNames, setDocFileNames] = useState<Record<string, string>>({});
  const [docFileData, setDocFileData] = useState<Record<string, string>>({});
  const [agencyLogoPreview, setAgencyLogoPreview] = useState<string | null>(null);
  const [ownerPhotoPreview, setOwnerPhotoPreview] = useState<string | null>(null);
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<string | null>(null);
  const [grSerial, setGrSerial] = useState('');
  const [originalAgencyData, setOriginalAgencyData] = useState<any>(null);

  useEffect(() => {
    // 1. Role protection
    if (user && user.role !== 'officer' && user.role !== 'regional_director') {
      router.push('/dashboard');
      return;
    }

    if (user && user.role === 'regional_director' && user.region) {
      setRegion(user.region);
    }

    // 2. Load settings & Sync Fees
    fetch('/api/data?table=settings')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const s = typeof data === 'object' && !Array.isArray(data) ? data : {};
        setSettings(s);
        setRegFee(type === 'renewal' ? (parseInt(s.renewalFee) || 100) : (parseInt(s.registrationFee) || 200));
        setAppFee(type === 'renewal' ? (parseInt(s.renewalAppFee) || 50) : (parseInt(s.registrationAppFee) || 50));
      })
      .catch(err => console.error('Failed to load settings:', err));
    
    // Fetch live agencies
    fetch('/api/data?table=agencies')
      .then(res => res.ok ? res.json() : [])
      .then(data => setAllAgencies(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to fetch agencies:', err));

    // 3. Load draft if ID exists (First Priority)
    if (draftId) {
      const apps = MOCK_DB.get('applications');
      const draft = apps.find((a: any) => a.id === draftId);
      if (draft) {
        setAgencyName(draft.agency);
        setType(draft.type.toLowerCase());
        setRegion(draft.region);
        setDistrict(draft.district);
        setSecondName(draft.contactPerson);
        setSecondPhone(draft.phone);
        setSecondEmail(draft.email || '');
        if (draft.alternatePerson) {
          setAltName(draft.alternatePerson.name);
          setAltPhone(draft.alternatePerson.phone);
        }
        if (draft.financials) {
          setRegFee(draft.financials.registrationFee);
          setAppFee(draft.financials.applicationFee);
          setDiscount(draft.financials.discount);
          setFeePaid(draft.financials.paidAmount);
        }
        setSelectionMade(true);
        setNameChecked(true);
      }
    }

    // 4. Auto-fill for Renewal (Second Priority)
    if (type === 'renewal' && selectedAgency && !draftId) {
      setAgencyName(selectedAgency.name);
      setRegion(selectedAgency.region || '');
      setDistrict(selectedAgency.city || '');
      setSecondName(selectedAgency.contactPerson || '');
      setSecondPhone(selectedAgency.phone || '');
      setSecondEmail(selectedAgency.email || '');
      if (selectedAgency.alternatePerson) {
        setAltName(selectedAgency.alternatePerson.name || '');
        setAltPhone(selectedAgency.alternatePerson.phone || '');
      }
      setOriginalAgencyData({
        name: selectedAgency.name,
        region: selectedAgency.region || '',
        city: selectedAgency.city || '',
        contact_person: selectedAgency.contact_person || selectedAgency.contactPerson || '',
        phone: selectedAgency.phone || '',
        email: selectedAgency.email || '',
        altName: selectedAgency.alternate_name || selectedAgency.alternatePerson?.name || '',
        altPhone: selectedAgency.alternate_phone || selectedAgency.alternatePerson?.phone || ''
      });
    }
  }, [user, router, draftId, type, selectedAgency]);

  const somalilandRegionsData: Record<string, string[]> = {
    'Maroodi Jeex': ['Hargeisa', 'Baligubadle', 'Salaxlay', 'Faraweyne', 'Sabawanaag', 'Caddaadlay', 'Daarasalaam', 'Allaybaday', 'Dacar Budhuq'],
    'Togdheer': ['Burco', 'Oodwayne', 'Buuhoodle', 'Duruqsi', 'Sh. Xasan Geelle', 'Qoryaale'],
    'Sanaag': ['Ceerigaabo', 'Ceel-af-weyn', 'Badhan', 'Laas-qoray', 'Dhahar', 'Gar-adag', 'Maydh', 'Darar-weyne', 'Fiqi-fulliye', 'Xiis'],
    'Awdal': ['Boorama', 'Baki', 'Saylac', 'Lughaya', 'Dilla'],
    'Sool': ['Laascaanood', 'Caynabo', 'Taleex', 'Xuddun', 'Boocane', 'Yagoori'],
    'Gabiley': ['Gabiley'],
    'Saaxil': ['Berbera', 'Sheekh', 'Ma-dheera', 'Bulaxaar', 'Xaggal']
  };
  const somalilandRegions = Object.keys(somalilandRegionsData);
  
  const hasChanges = () => {
    if (!originalAgencyData) return false;
    return (
      agencyName !== originalAgencyData.name ||
      region !== originalAgencyData.region ||
      district !== originalAgencyData.city ||
      secondName !== originalAgencyData.contact_person ||
      secondPhone !== originalAgencyData.phone ||
      secondEmail !== originalAgencyData.email ||
      altName !== originalAgencyData.altName ||
      altPhone !== originalAgencyData.altPhone
    );
  };

  const handleNameCheck = (): boolean => {
    if (!agencyName) return false;
    
    // For renewal, we just search for matching agencies
    if (type === 'renewal') {
      const matches = allAgencies.filter((a: any) => 
        (a.name || '').toLowerCase().includes(agencyName.toLowerCase()) ||
        (a.licenseId || a.license_id || '').toLowerCase().includes(agencyName.toLowerCase())
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

    // For new, we check if it DOES NOT exist in allAgencies
    const isAvailable = !allAgencies.some(a => (a.name || '').toLowerCase() === agencyName.toLowerCase());
    if (isAvailable) {
      setNameChecked(true);
      setNameError(null);
      return true;
    }

    setNameError("Agency name is already registered or has a pending application.");
    setNameChecked(false);
    return false;
  };

  const handleSaveDraft = () => {
    const generatedId = MOCK_DB.getDraftId();
    const newApp = {
      id: draftId || Math.random().toString(36).substr(2, 9),
      agency: agencyName || "Untitled Draft",
      agencyId: draftId ? (MOCK_DB.get('applications').find((a: any) => a.id === draftId)?.agencyId || generatedId) : generatedId,
      region: region,
      district: district,
      contactPerson: secondName,
      phone: secondPhone,
      email: secondEmail,
      alternatePerson: {
        name: altName,
        phone: altPhone
      },
      registerDate: new Date().toISOString().split('T')[0],
      type: type === 'new' ? 'New' : 'Renewal',
      status: 'Draft',
      statusColor: 'amber',
      financials: {
        registrationFee: regFee,
        applicationFee: appFee,
        discount: discount,
        paidAmount: feePaid,
        totalDue: (regFee + appFee) - discount,
        paymentReceipt: paymentReceiptFile,
        grSerial: grSerial
      },
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    if (draftId) {
      MOCK_DB.updateApplication(newApp);
    } else {
      MOCK_DB.addApplication(newApp);
      MOCK_DB.logActivity(user?.name || 'Officer', `Submitted ${newApp.type} application for`, agencyName);
    }
    router.push('/licenses');
  };

  const handleDiscardDraft = async () => {
    if (draftId && confirm('Are you sure you want to discard this draft? This cannot be undone.')) {
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'applications', action: 'delete', data: { id: draftId } })
        });
        router.push('/licenses');
      } catch (err) {
        console.error('Failed to delete draft:', err);
      }
    }
  };

  const [selectionMade, setSelectionMade] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

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
      // Item 13: Mandatory document validation on form submit
      const allDocs = [
        'Application Letter (MOCAAD Format)',
        'Passport Photo of Owner/Manager',
        'National ID Cards (Staff & Management)',
        'Company Profile (Vision, Mission, Activities)',
        'Memorandum & Articles of Association',
        'Staff List & CVs',
        'Travel Agency Managers/Owners CVs',
        'Office Inventory List',
        'Notarized Lease Agreement',
        'Bank Statement (Last 6 Months)',
      ];
      if (businessType === 'partnership') {
        allDocs.splice(6, 0, 'Shareholders Notarized Document');
      }
      const missing = allDocs.filter(d => !uploadedDocs.includes(d));
      if (missing.length > 0) {
        alert(`Please upload all mandatory documents before proceeding.\n\nMissing (${missing.length}):\n• ${missing.join('\n• ')}`);
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      setIsSubmitting(true);

      // Item 13: Final validation of mandatory documents before submission
      const mandatoryDocs = [
        'Application Letter (MOCAAD Format)',
        'Passport Photo of Owner/Manager',
        'National ID Cards (Staff & Management)',
        'Company Profile (Vision, Mission, Activities)',
        'Memorandum & Articles of Association',
        'Staff List & CVs',
        'Travel Agency Managers/Owners CVs',
        'Office Inventory List',
        'Notarized Lease Agreement',
        'Bank Statement (Last 6 Months)',
      ];
      if (businessType === 'partnership') {
        mandatoryDocs.splice(6, 0, 'Shareholders Notarized Document');
      }
      const missingDocs = mandatoryDocs.filter(d => !uploadedDocs.includes(d));
      if (missingDocs.length > 0) {
        alert(`Cannot submit: ${missingDocs.length} mandatory document(s) missing.\n\n• ${missingDocs.join('\n• ')}`);
        setCurrentStep(2);
        setIsSubmitting(false);
        return;
      }

      // Validate Agency Name manually
      const [appsRes, agenciesRes] = await Promise.all([
        fetch('/api/data?table=applications').then(r => r.ok ? r.json() : []),
        fetch('/api/data?table=agencies').then(r => r.ok ? r.json() : [])
      ]);

      const apps = Array.isArray(appsRes) ? appsRes : [];
      const agencies = Array.isArray(agenciesRes) ? agenciesRes : [];

      if (type === 'new') {
        const agencyMatch = agencies.some((a: any) => a.name?.toLowerCase() === agencyName.toLowerCase());
        const appMatch = apps.some((a: any) => a.agency?.toLowerCase() === agencyName.toLowerCase() && a.status !== 'Draft');
        if (agencyMatch || appMatch) {
          setNameError('Agency name is already registered or has a pending application.');
          setCurrentStep(1);
          setIsSubmitting(false);
          return;
        }
      }

      // Generate NEW-00X sequence
      let assignedAgencyId = selectedAgency?.licenseId || selectedAgency?.license_id;
      if (type === 'new') {
        const newApps = apps.filter((a: any) => a.agencyId?.startsWith('NEW-') || a.agency_id?.startsWith('NEW-'));
        const nextNum = newApps.length + 1;
        assignedAgencyId = `NEW-${String(nextNum).padStart(3, '0')}`;
      }

      const newApp = {
        id: Math.random().toString(36).substr(2, 9),
        agency: agencyName,
        agency_id: assignedAgencyId,
        agencyId: assignedAgencyId, // keep both for frontend compatibility
        region: region,
        district: district,
        contact_person: secondName,
        contactPerson: secondName,
        phone: secondPhone,
        email: secondEmail,
        alternate_name: altName,
        alternate_phone: altPhone,
        register_date: new Date().toISOString().split('T')[0],
        type: type === 'new' ? 'New' : 'Renewal',
        status: 'Under Review',
        status_color: 'amber',
        reg_fee: regFee,
        app_fee: appFee,
        discount: discount,
        paid_amount: feePaid,
        total_due: (regFee + appFee) - discount,
        payment_receipt: paymentReceiptFile,
        gr_serial: grSerial,
        uploaded_docs: uploadedDocs,
        doc_file_names: docFileNames,
        doc_file_data: docFileData,
        registered_by: user?.name || `${region || 'HQ'}-${(user?.role || 'officer').replace('_', ' ')}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'applications', action: 'create', data: newApp })
        });
        
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'activities', action: 'log', data: { user: user?.name || 'Officer', action: `Submitted ${newApp.type} application for`, target: agencyName } })
        });

        setTimeout(() => {
          setIsSubmitting(false);
          router.push('/licenses');
        }, 1500);
      } catch (err) {
        setNameError('A submission error occurred.');
        setCurrentStep(1);
        setIsSubmitting(false);
      }
    }
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
          { step: 3, label: 'Financials' },
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
                          // Auto-fill existing details
                          setRegion(agency.region || '');
                          setDistrict(agency.city || '');
                          setSecondName(agency.contact_person || agency.contactPerson || '');
                          setSecondPhone(agency.phone || '');
                          setSecondEmail(agency.email || '');
                          setSecondEmail(agency.email || '');
                          const alt = agency.alternate_person || agency.alternatePerson;
                          const aName = agency.alternate_name || alt?.name || '';
                          const aPhone = agency.alternate_phone || alt?.phone || '';
                          setAltName(aName);
                          setAltPhone(aPhone);
                          
                          setOriginalAgencyData({
                            name: agency.name,
                            region: agency.region || '',
                            city: agency.city || '',
                            contact_person: agency.contact_person || agency.contactPerson || '',
                            phone: agency.phone || '',
                            email: agency.email || '',
                            altName: aName,
                            altPhone: aPhone
                          });

                          // Load documents for renewal
                          const docData = typeof agency.doc_file_data === 'string' ? (() => { try { return JSON.parse(agency.doc_file_data); } catch { return {}; } })() : (agency.doc_file_data || {});
                          const docsFound: string[] = [];
                          const fileNames: Record<string, string> = {};
                          const fileData: Record<string, string> = {};

                          Object.entries(docData).forEach(([key, val]) => {
                            if (val && typeof val === 'string') {
                              // Map the JSON keys (e.g., 'agency_logo') back to display names if possible,
                              // or just use the keys as display names.
                              const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                              docsFound.push(displayName);
                              fileNames[displayName] = val.split('/').pop() || 'Existing File';
                              fileData[displayName] = val;
                              
                              if (key === 'agency_logo') setAgencyLogoPreview(`/api/storage?key=${encodeURIComponent(val)}`);
                              if (key === 'owner_photo') setOwnerPhotoPreview(`/api/storage?key=${encodeURIComponent(val)}`);
                            }
                          });
                          
                          setUploadedDocs(docsFound);
                          setDocFileNames(fileNames);
                          setDocFileData(fileData);
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

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Region</label>
                <select 
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value);
                    setDistrict('');
                  }}
                  disabled={user?.role === 'regional_director'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 appearance-none disabled:bg-slate-100 disabled:text-slate-500"
                  required
                >
                  <option value="">Select Region</option>
                  {somalilandRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">District</label>
                <select 
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={!region}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 appearance-none disabled:bg-slate-100 disabled:text-slate-500"
                  required
                >
                  <option value="">Select District</option>
                  {region && somalilandRegionsData[region]?.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Contact Person Section */}
              <div className="col-span-full pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-4">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Contact Person
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      value={secondName}
                      onChange={(e) => setSecondName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Phone</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm border-r border-slate-200 pr-3">+252</span>
                      <input 
                        type="tel" 
                        value={secondPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setSecondPhone(val);
                        }}
                        className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="63 XXXXXXX"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email <span className="text-xs text-slate-400 font-normal">(Optional)</span></label>
                    <input 
                      type="email" 
                      value={secondEmail}
                      onChange={(e) => setSecondEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Email"
                    />
                  </div>
                </div>
              </div>

              {/* Alternate Person Section */}
              <div className="col-span-full pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-amber-600" />
                  Alternate Person
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      value={altName}
                      onChange={(e) => setAltName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Alternate Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Phone</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm border-r border-slate-200 pr-3">+252</span>
                      <input 
                        type="tel" 
                        value={altPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setAltPhone(val);
                        }}
                        className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="63 XXXXXXX"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Step 1 Navigation */}
            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Save as Draft
                </button>
                {draftId && (
                  <button 
                    type="button"
                    onClick={handleDiscardDraft}
                    className="px-6 py-2.5 font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    Discard Draft
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (type === 'renewal') {
                    if (!hasChanges()) {
                      // No changes - proceed to next step
                      setCurrentStep(2);
                    } else {
                      // Changes exist - we will update database on final submit
                      setCurrentStep(2);
                    }
                  } else {
                    setCurrentStep(2);
                  }
                }}
                disabled={!nameChecked || !!nameError}
                className={`px-10 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                  nameChecked && !nameError
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                    : 'bg-blue-600/50 text-white cursor-not-allowed'
                }`}
              >
                Next Step
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-blue-600" />
                Required Documentation
              </h2>
              {(() => {
                const totalReq = businessType === 'partnership' ? 11 : 10;
                const uploaded = uploadedDocs.length;
                const pct = Math.round((uploaded / totalReq) * 100);
                const isComplete = uploaded >= totalReq;
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : pct > 50 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${isComplete ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {uploaded}/{totalReq} uploaded
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Agency Identity - Logo + Owner Passport Photo */}
            <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight flex items-center gap-2 mb-6">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Agency Identity Photos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Agency Logo */}
                <div className="flex flex-col items-center gap-4">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest self-start">Agency Logo</p>
                  <div className="relative">
                    {agencyLogoPreview ? (
                      <img src={agencyLogoPreview} alt="Agency Logo" className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-xl" />
                    ) : (
                      <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center border-4 border-white shadow-xl">
                        <span className="text-4xl font-black text-white uppercase">{agencyName ? agencyName[0] : '?'}</span>
                      </div>
                    )}
                    <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { alert('Logo must be under 5MB'); return; }
                      try {
                        const key = await uploadFileToR2(file, `agencies/${agencyName}/identity`);
                        setAgencyLogoPreview(URL.createObjectURL(file));
                        setDocFileData(prev => ({ ...prev, 'agency_logo': key }));
                        setDocFileNames(prev => ({ ...prev, 'agency_logo': file.name }));
                      } catch (err) {
                        alert('Failed to upload logo to storage.');
                      }
                      e.target.value = '';
                    }} />
                    <label htmlFor="logo-upload" className="absolute -bottom-2 -right-2 w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg transition-all">
                      <Camera className="w-4 h-4" />
                    </label>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Logo · Max 5MB</p>
                    {docFileNames['agency_logo'] && (
                      <p className="text-[10px] mt-1 font-bold text-blue-600 truncate max-w-[120px] mx-auto">{docFileNames['agency_logo']}</p>
                    )}
                  </div>
                </div>
                {/* Owner Passport Photo */}
                <div className="flex flex-col items-center gap-4">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest self-start">Owner Passport Photo</p>
                  <div className="relative">
                    {ownerPhotoPreview ? (
                      <img src={ownerPhotoPreview} alt="Owner Photo" className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-xl" />
                    ) : (
                      <div className="w-28 h-28 rounded-2xl bg-slate-100 border-4 border-white shadow-xl flex flex-col items-center justify-center gap-1">
                        <User className="w-10 h-10 text-slate-300" />
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No Photo</span>
                      </div>
                    )}
                    <input type="file" id="owner-photo-upload" className="hidden" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5MB'); return; }
                      try {
                        const key = await uploadFileToR2(file, `agencies/${agencyName}/identity`);
                        setOwnerPhotoPreview(URL.createObjectURL(file));
                        setDocFileData(prev => ({ ...prev, 'owner_photo': key }));
                        setDocFileNames(prev => ({ ...prev, 'owner_photo': file.name }));
                      } catch (err) {
                        alert('Failed to upload owner photo to storage.');
                      }
                      e.target.value = '';
                    }} />
                    <label htmlFor="owner-photo-upload" className="absolute -bottom-2 -right-2 w-9 h-9 bg-slate-700 hover:bg-slate-900 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg transition-all">
                      <Camera className="w-4 h-4" />
                    </label>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Passport-size · Max 5MB</p>
                    {docFileNames['owner_photo'] && (
                      <p className="text-[10px] mt-1 font-bold text-blue-600 truncate max-w-[120px] mx-auto">{docFileNames['owner_photo']}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const requiredDocs = [
                  'Application Letter',
                  'National ID cards (Staff & Management)',
                  'Company Profile (Vision, Mission, Activities)',
                  'Memorandum & Articles of Association',
                  'Staff list and CVs',
                  'Travel Agency Managers/Owners CVs',
                  'Office Inventory List',
                  'Notarized Lease Agreement',
                ];
                
                if (businessType === 'partnership') {
                  requiredDocs.push('Shareholders Notarized Document');
                  requiredDocs.push('Bank Statement (Last 6 Months)');
                }
                
                // Add any other existing documents that are already uploaded but not in requiredDocs
                const allDisplayDocs = [...requiredDocs];
                uploadedDocs.forEach(d => {
                  if (!allDisplayDocs.includes(d) && d !== 'Agency Logo' && d !== 'Owner Photo') {
                    allDisplayDocs.push(d);
                  }
                });

                return allDisplayDocs.map((doc, i) => {
                  const isUploaded = uploadedDocs.includes(doc);
                  const uploadedFileName = docFileNames[doc];
                  const inputId = `doc-upload-${i}`;
                  return (
                    <div 
                      key={i} 
                      className={`p-5 rounded-2xl border-2 transition-all group flex items-center gap-4 text-left ${
                        isUploaded 
                          ? 'border-green-200 bg-green-50/30' 
                          : 'border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'
                      }`}
                    >
                      <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition-all ${
                        isUploaded ? 'bg-green-100' : 'bg-slate-100 group-hover:bg-blue-100'
                      }`}>
                        {isUploaded ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <FileUp className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black leading-tight truncate ${isUploaded ? 'text-green-900' : 'text-slate-900'}`}>{doc}</p>
                        {uploadedFileName ? (
                          <p className="text-[10px] mt-1 font-bold text-green-600 truncate">{uploadedFileName}</p>
                        ) : (
                          <p className="text-[10px] mt-1 font-bold uppercase tracking-widest text-slate-400">PDF/Image · Max 5MB</p>
                        )}
                      </div>
                      {/* Hidden file input */}
                      <input
                        type="file"
                        id={inputId}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            alert(`"${file.name}" exceeds the 5 MB limit. Please compress the file before uploading.`);
                            e.target.value = '';
                            return;
                          }
                          const action = isUploaded ? 'Replaced' : 'Uploaded';
                          try {
                            const key = await uploadFileToR2(file, `applications/${agencyName}/docs`);
                            setDocFileData((prev) => ({ ...prev, [doc]: key }));
                            setUploadedDocs((prev) => prev.includes(doc) ? prev : [...prev, doc]);
                            setDocFileNames((prev) => ({ ...prev, [doc]: file.name }));
                            fetch('/api/data', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ table: 'activities', action: 'log', data: { user: user?.name || 'Officer', action: `${action} document: ${doc} (${file.name})`, target: agencyName || 'New Application' } })
                            });
                          } catch (err) {
                            alert(`Failed to upload ${doc} to storage.`);
                          }
                          e.target.value = '';
                        }}
                      />
                      <div className="flex gap-2 shrink-0">
                        {isUploaded && (
                          <button
                            type="button"
                            onClick={async () => {
                              const key = docFileData[doc];
                              if (!key) return;
                              const res = await fetch('/api/storage', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'getDownloadUrl', key })
                              });
                              if (res.ok) {
                                const { url } = await res.json();
                                window.open(url, '_blank');
                              }
                            }}
                            className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-all"
                            title="View Document"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                        <label
                          htmlFor={inputId}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center ${
                            isUploaded 
                              ? 'bg-white border border-green-200 text-green-700 hover:bg-green-600 hover:text-white' 
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20'
                          }`}
                        >
                          {isUploaded ? 'Replace' : 'Upload'}
                        </label>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-8">
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Save as Draft
                </button>
                {draftId && (
                  <button 
                    type="button"
                    onClick={handleDiscardDraft}
                    className="px-6 py-2.5 font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    Discard Draft
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Back to Identity
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Item 13: Mandatory document validation
                    const allDocs = [
                      'Application Letter',
                      'National ID cards (Staff & Management)',
                      'Company Profile (Vision, Mission, Activities)',
                      'Memorandum & Articles of Association',
                      'Staff list and CVs',
                      'Travel Agency Managers/Owners CVs',
                      'Office Inventory List',
                      'Notarized Lease Agreement',
                    ];
                    if (businessType === 'partnership') {
                      allDocs.push('Shareholders Notarized Document');
                      allDocs.push('Bank Statement (Last 6 Months)');
                    }
                    const missing = allDocs.filter(d => !uploadedDocs.includes(d));
                    if (missing.length > 0) {
                      alert(`Please upload all mandatory documents before proceeding.\n\nMissing (${missing.length}):\n• ${missing.join('\n• ')}`);
                      return;
                    }
                    setCurrentStep(3);
                  }}
                  className="px-8 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  Next Step
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Financial Requirements
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    {type === 'renewal' ? 'Renewal Fee ($)' : 'Registration Fee ($)'}
                  </label>
                  <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-black text-slate-600">
                    {regFee}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Application Fee ($)</label>
                  <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-black text-slate-600">
                    {appFee}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Discount Applied ($)</label>
                  <input 
                    type="number" 
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-red-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Amount Already Paid ($)</label>
                  <input 
                    type="number" 
                    value={feePaid}
                    onChange={(e) => setFeePaid(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-green-600"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-bold text-slate-900">${regFee + appFee}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-bold text-red-600">-${discount}</span>
                </div>
                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-slate-900 font-black uppercase tracking-widest text-xs">Final Total Due</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Payable to MOCAAD Revenue Account</p>
                  </div>
                  <span className="text-3xl font-black text-blue-600">
                    ${(regFee + appFee) - discount}
                  </span>
                </div>
                
                {feePaid > 0 && (
                  <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600 font-bold text-sm italic">Balance Remaining</span>
                    <span className="text-lg font-black text-slate-900">
                      ${Math.max(0, (regFee + appFee - discount) - feePaid)}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-blue-800 leading-relaxed">
                  Please verify all financial data before submission. These fees will be reviewed by the Department Director and General Director.
                </p>
              </div>

              {/* GR Serial Number Section */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-blue-600" />
                    General Receipt (GR) Serial Number
                  </label>
                  <p className="text-xs text-slate-500">Please enter the serial number from the bank receipt.</p>
                  <input 
                    type="text" 
                    value={grSerial}
                    onChange={(e) => setGrSerial(e.target.value)}
                    required
                    placeholder="e.g. GR-2024-XXXX"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-8">
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Save as Draft
                </button>
                {draftId && (
                  <button 
                    type="button"
                    onClick={handleDiscardDraft}
                    className="px-6 py-2.5 font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    Discard Draft
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Back to Documents
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-2.5 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Complete & Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default function NewApplicationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-medium">Loading application form...</span>
        </div>
      </div>
    }>
      <NewApplicationPageContent />
    </Suspense>
  );
}
