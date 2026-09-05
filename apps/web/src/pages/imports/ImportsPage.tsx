import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Download,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';
import { Badge } from '../../components/common/Badge';
import { formatDateTime } from '../../lib/utils';

export const ImportsPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'UPLOAD' | 'MAP' | 'RESULTS'>('UPLOAD');
  const [preview, setPreview] = useState<any>(null);
  const [mapping, setMapping] = useState<any>({});
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'create_anyway'>('skip');
  const [results, setResults] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await api.get('/imports/batches');
      const raw = res.data?.data ?? res.data;
      setBatches(Array.isArray(raw) ? raw : []);
    } catch {
      setBatches([]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', selected);

    try {
      const res = await api.post('/imports/preview', formData);
      const p = res.data.data;
      setPreview(p);

      // Smart Auto-Mapping for 7Blocks Core format or standard spreadsheets
      const autoMap: any = {};
      p.headers.forEach((h: string) => {
        const lower = h.toLowerCase().trim();
        if (lower === 'name' && !autoMap.companyName) {
          autoMap.companyName = h;
        } else if ((lower === 'name' || lower === 'name ') && autoMap.companyName) {
          autoMap.fullName = h;
        } else if (lower.includes('email / phone') || lower.includes('email/phone')) {
          autoMap.email = h;
        } else if (lower.includes('phone number') || lower.includes('phone')) {
          autoMap.phone = h;
        } else if (lower.includes('website')) {
          autoMap.website = h;
        } else if (lower.includes('send(') || lower.includes('send (')) {
          autoMap.emailSentCol = h;
        } else if (lower.includes('calling(') || lower.includes('calling (')) {
          autoMap.callingCol = h;
        } else if (lower.includes('response') || lower.includes('response ')) {
          autoMap.callResponseCol = h;
        }
      });

      setMapping(autoMap);
      setStep('MAP');
      success('File parsed successfully', `${p.totalRows} data rows detected.`);
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to parse spreadsheet');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    formData.append('duplicateHandling', duplicateHandling);

    try {
      const res = await api.post('/imports/execute', formData);
      setResults(res.data.data);
      setStep('RESULTS');
      success('Import completed successfully', `${res.data.data.importedCount} contacts created.`);
      fetchBatches();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Import execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setMapping({});
    setResults(null);
    setStep('UPLOAD');
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-brand-400" />
          <span>Excel & CSV Migration Wizard</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Migrate existing lead spreadsheets, call outcomes, and outreach history into normalized CRM records.
        </p>
      </div>

      {/* Step Progress Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <div className={`flex items-center gap-2 font-semibold ${step === 'UPLOAD' ? 'text-brand-400' : 'text-slate-400'}`}>
          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
          <span>Upload File</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-800" />
        <div className={`flex items-center gap-2 font-semibold ${step === 'MAP' ? 'text-brand-400' : 'text-slate-400'}`}>
          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
          <span>Column & Semantic Mapping</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-800" />
        <div className={`flex items-center gap-2 font-semibold ${step === 'RESULTS' ? 'text-emerald-400' : 'text-slate-400'}`}>
          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">3</span>
          <span>Results & Summary</span>
        </div>
      </div>

      {/* STEP 1: UPLOAD */}
      {step === 'UPLOAD' && (
        <div className="p-12 rounded-2xl border-2 border-dashed border-slate-800 hover:border-brand-500/50 bg-slate-900/40 text-center transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mx-auto mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">
            Select an Excel (.xlsx, .xls) or CSV file
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Supports both raw scraped lead lists and 7BLOCKS operational spreadsheets (with SEND, Calling, and Response columns).
          </p>

          <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-colors">
            <span>Choose Spreadsheet File</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(e) => {
                handleFileSelect(e);
                e.target.value = '';
              }}
              disabled={loading}
            />
          </label>

          {loading && (
            <p className="text-xs text-brand-400 mt-4 animate-pulse">
              Parsing rows and validating data headers...
            </p>
          )}
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING & DUPLICATE RULES */}
      {step === 'MAP' && preview && (
        <div className="space-y-6">
          {preview.is7BlocksCore && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">7BLOCKS Core Spreadsheet Detected!</p>
                <p className="text-slate-300 mt-0.5 leading-relaxed">
                  We've automatically detected dual email and phone outreach tracks. Call response notes (e.g. "CALLING AT 5:30 (BOSS)", "meeting left", "SEND DEMO") will be automatically mapped to activities and scheduled tasks.
                </p>
              </div>
            </div>
          )}

          {/* Mapping Table */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm text-slate-100">
              Map Spreadsheet Columns to CRM Fields
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Company / Gym Name</label>
                <select
                  value={mapping.companyName || ''}
                  onChange={e => setMapping({ ...mapping, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">(None / Skip)</option>
                  {preview.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contact Person Name</label>
                <select
                  value={mapping.fullName || ''}
                  onChange={e => setMapping({ ...mapping, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">(None / Skip)</option>
                  {preview.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <select
                  value={mapping.email || ''}
                  onChange={e => setMapping({ ...mapping, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">(None / Skip)</option>
                  {preview.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Direct Phone Number</label>
                <select
                  value={mapping.phone || ''}
                  onChange={e => setMapping({ ...mapping, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">(None / Skip)</option>
                  {preview.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Website URL</label>
                <select
                  value={mapping.website || ''}
                  onChange={e => setMapping({ ...mapping, website: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">(None / Skip)</option>
                  {preview.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Outreach Column (SEND Y/N)</label>
                <select
                  value={mapping.emailSentCol || ''}
                  onChange={e => setMapping({ ...mapping, emailSentCol: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">(None / Skip)</option>
                  {preview.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Calling Outreach Column (Calling Y/N)</label>
                <select
                  value={mapping.callingCol || ''}
                  onChange={e => setMapping({ ...mapping, callingCol: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">(None / Skip)</option>
                  {preview.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Call Outcome Response Column</label>
                <select
                  value={mapping.callResponseCol || ''}
                  onChange={e => setMapping({ ...mapping, callResponseCol: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">(None / Skip)</option>
                  {preview.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duplicate Handling */}
            <div className="pt-4 border-t border-slate-800">
              <label className="block font-semibold text-slate-300 mb-2">
                Duplicate Contact Strategy
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                  duplicateHandling === 'skip' ? 'bg-brand-950/40 border-brand-500 text-slate-100' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="duplicate"
                    checked={duplicateHandling === 'skip'}
                    onChange={() => setDuplicateHandling('skip')}
                    className="hidden"
                  />
                  <span className="font-semibold block text-slate-200">Skip Duplicates</span>
                  <span className="text-[11px] opacity-80">Existing records are left untouched.</span>
                </label>

                <label className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                  duplicateHandling === 'update' ? 'bg-brand-950/40 border-brand-500 text-slate-100' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="duplicate"
                    checked={duplicateHandling === 'update'}
                    onChange={() => setDuplicateHandling('update')}
                    className="hidden"
                  />
                  <span className="font-semibold block text-slate-200">Update Existing</span>
                  <span className="text-[11px] opacity-80">Appends new outreach notes and updates fields.</span>
                </label>

                <label className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                  duplicateHandling === 'create_anyway' ? 'bg-brand-950/40 border-brand-500 text-slate-100' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="duplicate"
                    checked={duplicateHandling === 'create_anyway'}
                    onChange={() => setDuplicateHandling('create_anyway')}
                    className="hidden"
                  />
                  <span className="font-semibold block text-slate-200">Create Separate</span>
                  <span className="text-[11px] opacity-80">Creates new record regardless of duplicate match.</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Back / Choose Another File
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-md disabled:opacity-50"
              >
                {loading ? 'Processing Import...' : `Import ${preview.totalRows} Leads`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: RESULTS SUMMARY */}
      {step === 'RESULTS' && results && (
        <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
            <div>
              <h3 className="text-lg font-bold text-slate-100">Import Batch Finished</h3>
              <p className="text-xs text-slate-400">Batch ID: {results.batchId}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Total Rows</span>
              <span className="text-xl font-bold text-slate-100">{results.totalRows}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-emerald-400 block mb-1">Imported New</span>
              <span className="text-xl font-bold text-emerald-400">{results.importedCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-cyan-400 block mb-1">Updated</span>
              <span className="text-xl font-bold text-cyan-400">{results.updatedCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-amber-400 block mb-1">Skipped</span>
              <span className="text-xl font-bold text-amber-400">{results.skippedCount}</span>
            </div>
          </div>

          {results.errors && results.errors.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs">
              <p className="font-semibold text-rose-300 mb-2">Errors Encountered ({results.errors.length}):</p>
              <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-slate-300">
                {results.errors.map((err: any, idx: number) => (
                  <p key={idx}>Row {err.row}: {err.error}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs"
            >
              Import Another Spreadsheet
            </button>
          </div>
        </div>
      )}

      {/* Import Batches History Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm space-y-3">
        <h3 className="font-semibold text-sm text-slate-100">Recent Import Batches</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">File Name</th>
                <th className="py-2.5 px-3">Uploaded By</th>
                <th className="py-2.5 px-3">Total Rows</th>
                <th className="py-2.5 px-3">Imported</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No import history yet.
                  </td>
                </tr>
              ) : (
                batches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{b.filename}</td>
                    <td className="py-2.5 px-3 text-slate-400">{b.uploadedBy?.name}</td>
                    <td className="py-2.5 px-3 font-mono">{b.totalRows}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400">{b.importedRows}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={b.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{formatDateTime(b.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
