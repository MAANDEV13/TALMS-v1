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
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewApplicationPage() {
  const router = useRouter();
  const [branches, setBranches] = useState([{ id: 1, name: '', address: '', city: 'Hargeisa' }]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [agencyName, setAgencyName] = useState('');
  const [type, setType] = useState('new');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const somalilandCities = ['Hargeisa', 'Borama', 'Berbera', 'Burao', 'Erigavo', 'Las Anod', 'Gabiley', 'Sheikh'];

  const addBranch = () => {
    setBranches([...branches, { id: Date.now(), name: '', address: '', city: 'Hargeisa' }]);
  };

  const removeBranch = (id: number) => {
    if (branches.length > 1) {
      setBranches(branches.filter(b => b.id !== id));
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If we are not on the last step yet, just move to the next step
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Only submit if we are on the final step
    setIsSubmitting(true);

    // Mock API call
    setTimeout(() => {
      const newApp = {
        id: Math.random().toString(36).substr(2, 9),
        agency: agencyName,
        type: type === 'new' ? 'New' : 'Renewal',
        status: 'Under Review',
        statusColor: 'amber',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      // Save to local storage for persistence in the session
      const existing = JSON.parse(localStorage.getItem('talms_applications') || '[]');
      localStorage.setItem('talms_applications', JSON.stringify([newApp, ...existing]));

      setIsSubmitting(false);
      router.push('/licenses');
    }, 1500);
  };

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
          <h1 className="text-2xl font-bold text-slate-900">New License Application</h1>
          <p className="text-slate-500">Register a new travel agency in Somaliland.</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between px-12 relative before:absolute before:left-12 before:right-12 before:top-5 before:h-0.5 before:bg-slate-200">
        {[
          { step: 1, label: 'Agency Details' },
          { step: 2, label: 'Branches' },
          { step: 3, label: 'Documents' },
        ].map((s) => (
          <div key={s.step} className="relative z-10 flex flex-col items-center gap-2">
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
              <Building2 className="w-5 h-5 text-blue-600" />
              Agency Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Agency Name</label>
                <input 
                  type="text" 
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
                  placeholder="e.g. Hargeisa Global Travel"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Application Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white text-slate-900"
                >
                  <option value="new">New License</option>
                  <option value="renewal">Renewal</option>
                </select>
              </div>

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

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
                  placeholder="+252 63 ..."
                  required
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Branch Locations
              </h2>
              <button 
                type="button"
                onClick={addBranch}
                className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Branch
              </button>
            </div>

            <div className="space-y-6">
              {branches.map((branch, index) => (
                <div key={branch.id} className="p-6 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4 relative group">
                  {branches.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeBranch(branch.id)}
                      className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch Name</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                        placeholder="Main Branch"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Somaliland City</label>
                      <select 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none text-slate-900"
                        defaultValue={branch.city}
                      >
                        {somalilandCities.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specific Address</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                        placeholder="Independent Avenue"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileUp className="w-5 h-5 text-blue-600" />
              Required Documentation
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                'Somaliland Business License',
                'Owner Identification',
                'Office Rental Agreement',
                'Tax Clearance (MoF)'
              ].map((doc, i) => (
                <div key={i} className="p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <FileUp className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{doc}</p>
                    <p className="text-xs text-slate-500 mt-1 text-slate-500">PDF or Image (Max 20MB)</p>
                  </div>
                  <button type="button" className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-2">
                    Select File
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            disabled={currentStep === 1 || isSubmitting}
            onClick={() => setCurrentStep(currentStep - 1)}
            className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-0 transition-all"
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
              currentStep < 3 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20' 
                : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              currentStep < 3 ? 'Next Step' : 'Complete Submission'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
