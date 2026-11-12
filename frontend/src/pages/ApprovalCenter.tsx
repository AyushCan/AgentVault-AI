import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Approval } from '../types';
import api from '../api/client';
import { 
  CheckSquare, 
  Check, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Clock, 
  Building2, 
  Bot, 
  DollarSign
} from 'lucide-react';

export const ApprovalCenter: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/approvals');
      setApprovals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/approvals/${id}/approve`, {
        notes: 'Approved by Administrator after manual verification'
      });
      setActionFeedback(`Transaction approved! Budget updated and ready for payment settlement.`);
      fetchApprovals();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please enter rejection reason:', 'Policy non-compliance / suspicious vendor');
    if (reason === null) return;
    try {
      await api.post(`/approvals/${id}/reject`, { notes: reason });
      setActionFeedback(`Transaction rejected.`);
      fetchApprovals();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Rejection failed');
    }
  };

  const pending = approvals.filter((a) => a.status === 'PENDING');
  const resolved = approvals.filter((a) => a.status !== 'PENDING');

  return (
    <Layout title="Human Authorization & Approval Center" subtitle="Human-in-the-loop governance: review agent purchase requests flagged by policy thresholds or high risk scores">
      
      {actionFeedback && (
        <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {/* PENDING APPROVALS SECTION */}
      <div className="mb-10">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-amber" />
          <h3 className="text-base font-bold text-slate-800">Pending Authorization Requests ({pending.length})</h3>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm">
            <CheckSquare className="w-10 h-10 text-teal mx-auto mb-3 opacity-60" />
            <h4 className="font-bold text-slate-700 text-sm">All Clean — No Pending Approvals</h4>
            <p className="text-xs text-slate-400 mt-1">All agent activities are within autonomous auto-approve policy thresholds</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pending.map((item) => {
              const tx = item.transaction;
              const audit = item.audit_report;
              return (
                <div key={item.id} className="bg-white rounded-3xl p-6 border border-amber/30 shadow-md relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-amber/5 rounded-bl-full pointer-events-none" />

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber/10 text-amber flex items-center justify-center font-bold">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{item.agent?.name || 'Autonomous Agent'}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">Agent Role: {item.agent?.role || 'PROCUREMENT'}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-amber/15 text-amber rounded-full text-xs font-bold uppercase tracking-wider">
                        Requires Sign-off
                      </span>
                    </div>

                    {/* Amount & Vendor */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Requested Amount</span>
                        <div className="text-2xl font-extrabold text-slate-900 font-mono">
                          {tx ? formatINR(tx.amount) : '₹0'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Target Vendor</span>
                        <p className="font-bold text-slate-800 text-sm">{item.vendor?.name || 'BudgetTech'}</p>
                        <p className="text-[10px] text-slate-400">Trust Score: {item.vendor?.trust_score ?? 62}/100</p>
                      </div>
                    </div>

                    {/* Independent Auditor Agent Report */}
                    {audit && (
                      <div className="mb-4 p-4 rounded-2xl bg-slate-900 text-white border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-teal font-bold flex items-center space-x-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Independent AI Auditor Findings</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            audit.recommendation === 'APPROVE_RECOMMENDED' ? 'bg-emerald-500/20 text-emerald-400' :
                            audit.recommendation === 'REJECT_RECOMMENDED' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {audit.recommendation.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mb-2 leading-relaxed">{audit.explanation}</p>
                        {audit.red_flags && audit.red_flags.length > 0 && (
                          <div className="space-y-1">
                            {audit.red_flags.map((flag: string, idx: number) => (
                              <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-red-400">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>{flag}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Policy Reason */}
                    <div className="text-xs text-slate-600 mb-6 p-3 bg-amber/5 rounded-xl border border-amber/20">
                      <strong>Policy Engine Trigger: </strong>
                      {tx?.policy_reason || 'Transaction exceeds autonomous threshold'}
                    </div>
                  </div>

                  {/* Approve / Reject Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleReject(item.id)}
                      className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Purchase</span>
                    </button>
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Authorize & Approve</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RESOLVED APPROVALS HISTORY */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-1">Human Decision Audit Log</h4>
        <p className="text-xs text-slate-400 mb-4">Historical approvals and manual intervention trail</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Transaction</th>
                <th className="py-2.5 px-4 font-semibold">Amount</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Decision By</th>
                <th className="py-2.5 px-4 font-semibold">Notes</th>
                <th className="py-2.5 px-4 font-semibold">Resolved At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resolved.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono text-slate-700">{item.transaction_id.slice(0, 10)}...</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{formatINR(item.transaction?.amount || 0)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-semibold">{item.approved_by || 'Admin'}</td>
                  <td className="py-3 px-4 text-slate-500">{item.notes || 'No notes'}</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                    {item.resolved_at ? new Date(item.resolved_at).toLocaleString() : 'N/A'}
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
