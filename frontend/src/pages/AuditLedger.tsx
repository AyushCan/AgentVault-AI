import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { LedgerEntry } from '../types';
import api from '../api/client';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  RefreshCw, 
  Link, 
  AlertTriangle,
  Lock
} from 'lucide-react';

export const AuditLedger: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  const fetchLedger = async () => {
    try {
      const res = await api.get('/ledger?limit=100');
      setEntries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.get('/ledger/verify');
      setVerifyResult(res.data);
    } catch (err: any) {
      alert('Verification request failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleTamperTest = async (eventId: string) => {
    if (!confirm('Simulate manual database tampering to test modification detection?')) return;
    try {
      await api.post(`/ledger/tamper-test?entry_id=${eventId}`);
      alert('Simulated unauthorized tampering injected! Now click "Verify Hash Chain Integrity" to see cryptographic detection.');
      fetchLedger();
      setVerifyResult(null);
    } catch (err) {
      alert('Failed to simulate tamper test');
    }
  };

  return (
    <Layout title="Tamper-Evident Audit Ledger" subtitle="Immutable SHA-256 hash-chained event log recording every autonomous agent transaction, policy check, and human approval">
      
      {/* Top Controls Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-electric-blue" />
            <h3 className="text-base font-bold text-slate-800">SHA-256 Cryptographic Hash Chain</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Each entry's hash is computed from <code>Hash(Prev_Hash + Data_Hash + Timestamp)</code>. Any database modification breaks the integrity chain.
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-electric-blue to-teal hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{verifying ? 'Recomputing Hash Chain...' : 'Verify Ledger Integrity'}</span>
        </button>
      </div>

      {/* Verification Banner */}
      {verifyResult && (
        <div className={`p-6 rounded-3xl mb-8 border animate-fadeIn ${
          verifyResult.all_valid 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-red-50 border-red-300 text-red-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {verifyResult.all_valid ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-7 h-7 text-red-600 shrink-0" />
              )}
              <div>
                <h4 className="font-extrabold text-sm tracking-tight">
                  {verifyResult.all_valid 
                    ? 'Cryptographic Verification Passed — 100% Chain Integrity' 
                    : 'INTEGRITY BREACH DETECTED: Tampered or Modified Ledger Records Found!'}
                </h4>
                <p className="text-xs mt-0.5 opacity-80">
                  Verified {verifyResult.total_entries} total blocks in sequence. Valid: {verifyResult.valid_entries} | Tampered: {verifyResult.tampered_entries}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-white/70 px-3 py-1.5 rounded-xl border border-black/5">
              Status: {verifyResult.all_valid ? 'INTACT' : 'TAMPERED'}
            </span>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-5 font-semibold">Block #</th>
                <th className="py-3 px-5 font-semibold">Event Type</th>
                <th className="py-3 px-5 font-semibold">Description</th>
                <th className="py-3 px-5 font-semibold">Chain Hash (SHA-256)</th>
                <th className="py-3 px-5 font-semibold">Timestamp</th>
                <th className="py-3 px-5 font-semibold text-right">Demo Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-5 font-mono text-slate-500 font-bold">#{entry.id}</td>
                  <td className="py-3 px-5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-electric-blue">
                      {entry.event_type}
                    </span>
                  </td>
                  <td className="py-3 px-5 font-medium text-slate-800 max-w-sm truncate">
                    {entry.description}
                  </td>
                  <td className="py-3 px-5 font-mono text-[11px] text-slate-400">
                    <span className="text-slate-700 font-bold">{entry.chain_hash.slice(0, 10)}</span>
                    <span>...{entry.chain_hash.slice(-8)}</span>
                  </td>
                  <td className="py-3 px-5 text-slate-400 font-mono text-[11px]">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button
                      onClick={() => handleTamperTest(entry.event_id)}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition"
                      title="Intentionally modify record to test SHA-256 chain detection"
                    >
                      Tamper Test
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

