'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Download,
  Trash2,
  MapPin,
  Building2,
  ShieldCheck,
  XCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Legacy CSV column → New system column mapping defaults
const LEGACY_COLUMN_MAP: Record<string, string> = {
  'agency id': 'license_id',
  'agency name': 'name',
  'region': 'region',
  'destrict': 'city',
  'district': 'city',
  'contact person': 'contact_person',
  'phone number': 'phone',
  'phone': 'phone',
  'register date': 'issue_date',
  'register_date': 'issue_date',
  'status': 'status',
  'email': 'email',
  'expiry date': 'expiry_date',
  'expiry_date': 'expiry_date',
  'issue date': 'issue_date',
  'issue_date': 'issue_date',
  'registered by': 'registered_by',
};

const NEW_SYSTEM_COLUMNS = [
  { key: 'license_id', label: 'License ID', required: false },
  { key: 'name', label: 'Agency Name', required: true },
  { key: 'region', label: 'Region', required: false },
  { key: 'city', label: 'District / City', required: false },
  { key: 'contact_person', label: 'Contact Person', required: false },
  { key: 'phone', label: 'Phone Number', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'issue_date', label: 'Issued Date', required: false },
  { key: 'expiry_date', label: 'Expiry Date', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'registered_by', label: 'Registered By', required: false },
];

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  // Parse rows
  const rows = lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += char;
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  }).filter(row => Object.values(row).some(v => v.trim()));

  return { headers, rows };
}

export default function DataMigrationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'importing' | 'done'>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  // Role protection
  if (user && user.role !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);

      if (headers.length === 0 || rows.length === 0) {
        setError('CSV file appears to be empty or invalid');
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-map columns
      const autoMap: Record<string, string> = {};
      headers.forEach(h => {
        const normalized = h.toLowerCase().trim();
        if (LEGACY_COLUMN_MAP[normalized]) {
          autoMap[h] = LEGACY_COLUMN_MAP[normalized];
        }
      });
      setColumnMapping(autoMap);
      setStep('map');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    setStep('importing');
    setError(null);

    // Map CSV rows to new system format
    const records = csvRows.map(row => {
      const mapped: Record<string, string> = {};
      Object.entries(columnMapping).forEach(([csvCol, sysCol]) => {
        if (sysCol && row[csvCol] !== undefined) {
          mapped[sysCol] = row[csvCol];
        }
      });
      return mapped;
    });

    try {
      const res = await fetch('/api/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Import failed');
        setStep('preview');
        return;
      }

      setImportResult(result);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Network error');
      setStep('preview');
    }
  };

  const mappedPreviewRows = csvRows.slice(0, 10).map(row => {
    const mapped: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([csvCol, sysCol]) => {
      if (sysCol) mapped[sysCol] = row[csvCol] || '';
    });
    return mapped;
  });

  const validationIssues = csvRows.map((row, i) => {
    const issues: string[] = [];
    // Check required "name" field
    const nameCol = Object.entries(columnMapping).find(([, sys]) => sys === 'name')?.[0];
    if (!nameCol || !row[nameCol]?.trim()) {
      issues.push('Missing agency name');
    }
    return issues.length > 0 ? { row: i + 1, issues } : null;
  }).filter(Boolean);

  const resetAll = () => {
    setStep('upload');
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMapping({});
    setImportResult(null);
    setError(null);
    setFileName('');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Data Migration</h1>
            <p className="text-slate-500 mt-1">Import agency data from the legacy system via CSV upload.</p>
          </div>
        </div>
        {step !== 'upload' && step !== 'done' && (
          <button onClick={resetAll} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-all">
            <RefreshCw className="w-4 h-4" />
            Start Over
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between px-12 relative before:absolute before:left-12 before:right-12 before:top-5 before:h-0.5 before:bg-slate-200">
        {[
          { id: 'upload', label: 'Upload CSV', num: 1 },
          { id: 'map', label: 'Map Columns', num: 2 },
          { id: 'preview', label: 'Preview & Import', num: 3 },
        ].map((s) => {
          const stepOrder = ['upload', 'map', 'preview', 'importing', 'done'];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx = stepOrder.indexOf(s.id);
          const isActive = step === s.id;
          const isComplete = currentIdx > thisIdx;
          return (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                isComplete ? 'bg-green-500 text-white' :
                'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {isComplete ? <CheckCircle2 className="w-6 h-6" /> : s.num}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isActive ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-slate-400'
              }`}>{s.label}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-bold text-red-800">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-400 bg-blue-50/50 scale-[1.01]'
                  : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
              />
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Drop your CSV file here</h3>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                Upload a CSV file exported from the legacy system. The file should contain agency data with columns like Agency ID, Agency Name, Region, etc.
              </p>
              <button className="mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Browse Files
              </button>
            </div>

            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-4">Expected Legacy Columns</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Agency ID', 'Agency Name', 'Region', 'District', 'Contact Person', 'Phone Number', 'Register Date', 'Status'].map(col => (
                  <div key={col} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100 text-xs font-bold text-slate-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                    {col}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'map' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Column Mapping
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Map columns from <span className="font-bold text-slate-700">{fileName}</span> ({csvRows.length} rows) to the new system fields.
              </p>
            </div>
            <span className="text-[10px] font-black bg-green-100 text-green-700 px-2.5 py-1 rounded-lg uppercase border border-green-200">
              {Object.values(columnMapping).filter(Boolean).length} / {NEW_SYSTEM_COLUMNS.length} mapped
            </span>
          </div>

          <div className="p-8 space-y-4">
            {csvHeaders.map((csvCol) => (
              <div key={csvCol} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-all">
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Legacy Column</p>
                  <p className="text-sm font-bold text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 inline-block">
                    {csvCol}
                  </p>
                </div>

                <ArrowRight className="w-5 h-5 text-slate-300 shrink-0" />

                <div className="flex-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">New System Column</p>
                  <select
                    value={columnMapping[csvCol] || ''}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, [csvCol]: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-bold outline-none transition-all ${
                      columnMapping[csvCol]
                        ? 'border-green-200 bg-green-50 text-green-800 focus:ring-2 focus:ring-green-400'
                        : 'border-slate-200 bg-white text-slate-600 focus:ring-2 focus:ring-blue-400'
                    }`}
                  >
                    <option value="">— Skip this column —</option>
                    {NEW_SYSTEM_COLUMNS.map(col => (
                      <option key={col.key} value={col.key}>
                        {col.label} {col.required ? '(required)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-slate-100 flex items-center justify-between">
            <button onClick={() => setStep('upload')} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
              Back
            </button>
            <button
              onClick={() => {
                const hasName = Object.values(columnMapping).includes('name');
                if (!hasName) {
                  setError('You must map at least the "Agency Name" column.');
                  return;
                }
                setStep('preview');
              }}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              Preview Data
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Import */}
      {step === 'preview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Validation Summary */}
          {validationIssues.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">{validationIssues.length} rows have issues</h4>
                <p className="text-xs text-amber-700 mt-1">These rows will be skipped during import. All other rows will be imported.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Data Preview</h3>
                <p className="text-sm text-slate-500">Showing first {Math.min(10, csvRows.length)} of {csvRows.length} records</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg uppercase border border-blue-200">
                  {csvRows.length} total rows
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                    {NEW_SYSTEM_COLUMNS.filter(c => Object.values(columnMapping).includes(c.key)).map(col => (
                      <th key={col.key} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {mappedPreviewRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-slate-400">{i + 1}</td>
                      {NEW_SYSTEM_COLUMNS.filter(c => Object.values(columnMapping).includes(c.key)).map(col => (
                        <td key={col.key} className="px-4 py-3 text-sm font-medium text-slate-700">
                          {row[col.key] || <span className="text-slate-300 italic">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep('map')} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
              Back to Mapping
            </button>
            <button
              onClick={handleImport}
              className="px-10 py-3.5 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center gap-2 active:scale-95"
            >
              <Upload className="w-5 h-5" />
              Import {csvRows.length} Records
            </button>
          </div>
        </div>
      )}

      {/* Importing State */}
      {step === 'importing' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Importing Data...</h3>
          <p className="text-slate-500 mt-2">Processing {csvRows.length} records. This may take a moment.</p>
        </div>
      )}

      {/* Done State */}
      {step === 'done' && importResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Import Complete!</h3>
            <p className="text-slate-500 mt-2">The legacy data has been migrated to the new system.</p>

            <div className="grid grid-cols-3 gap-6 mt-8 max-w-lg mx-auto">
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                <p className="text-3xl font-black text-green-700">{importResult.imported}</p>
                <p className="text-xs font-bold text-green-600 uppercase tracking-widest mt-1">Imported</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-3xl font-black text-amber-700">{importResult.skipped}</p>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1">Skipped</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-3xl font-black text-blue-700">{importResult.total}</p>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Total</p>
              </div>
            </div>
          </div>

          {importResult.skippedDetails?.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-amber-50/30">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Skipped Records
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Row</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Agency</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {importResult.skippedDetails.map((s: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm font-bold text-slate-500">{s.row}</td>
                        <td className="px-6 py-3 text-sm font-bold text-slate-900">{s.name}</td>
                        <td className="px-6 py-3">
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">{s.reason}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <button onClick={resetAll} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Import More
            </button>
            <button
              onClick={() => router.push('/agencies')}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <Building2 className="w-5 h-5" />
              View Agencies
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
