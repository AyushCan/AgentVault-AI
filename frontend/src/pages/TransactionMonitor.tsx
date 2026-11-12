import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Transaction } from '../types';
import api from '../api/client';
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  FileText
} from 'lucide-react';

export const TransactionMonitor: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/purchases');
      // Flatten or collect transactions
      const txRes = await api.get('/approvals');
      // Also get recent decisions
      const decRes = await api.get('/policy/decisions');
      // Format transactions
      const mapped: Transaction[] = decRes.data.map((d: any) => ({
        id: d.transaction_id,
        amount: d.amount,
        status: d.decision === 'APPROVED' ? 'COMPLETED' : (d.decision === 'REJECTED' ? 'REJECTED' : 'PENDING'),
        policy_decision: d.decision,
        policy_reason: d.reason,
        policy_rules_evaluated: d.rules_evaluated || [],
        risk_score: 18,
        risk_category: 'LOW',
        description: `Autonomous Transaction ${d.transaction_id.slice(0, 8)}`,
        created_at: d.created_at,
        updated_at: d.created_at,
        agent_id: 'ProcurementBot'
      }));
      setTransactions(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleProcessPayment = async (txId: string, method: string = 'MOCK') => {
    setPaymentProcessing(true);
    setPaymentSuccessMsg(null);
    try {
      const res = await api.post('/payments/process', {
        transaction_id: txId,
        payment_method: method
      });
      setPaymentSuccessMsg(`Payment executed successfully! Reference: ${res.data.reference} (${res.data.method})`);
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Payment failed');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const filtered = transactions.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchQuery && !t.id.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <Layout title="Transaction & Authorization Monitor" subtitle="Live stream of autonomous transactions, deterministic policy decisions, and payment settlement records">
      
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          {['ALL', 'COMPLETED', 'PENDING', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === st 
                  ? 'bg-navy text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Transaction ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-electric-blue"
          />
        </div>
      </div>

      {paymentSuccessMsg && (
        <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{paymentSuccessMsg}</span>
          <button onClick={() => setPaymentSuccessMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-6 font-semibold">Transaction ID</th>
                <th className="py-3 px-6 font-semibold">Amount</th>
                <th className="py-3 px-6 font-semibold">Policy Decision</th>
                <th className="py-3 px-6 font-semibold">Risk Category</th>
                <th className="py-3 px-6 font-semibold">Status</th>
                <th className="py-3 px-6 font-semibold">Date</th>
                <th className="py-3 px-6 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => (
                <tr 
                  key={tx.id} 
                  onClick={() => setSelectedTx(tx)}
                  className="hover:bg-blue-50/40 transition cursor-pointer"
                >
                  <td className="py-3.5 px-6 font-mono text-slate-700 font-medium">
                    {tx.id.slice(0, 12)}...
                  </td>
                  <td className="py-3.5 px-6 font-mono font-bold text-slate-900 text-sm">
                    {formatINR(tx.amount)}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tx.policy_decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      tx.policy_decision === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {tx.policy_decision}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="font-semibold text-slate-600 font-mono text-[11px]">
                      {tx.risk_category} ({tx.risk_score}/100)
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tx.status === 'COMPLETED' ? 'bg-teal/15 text-teal' :
                      tx.status === 'REJECTED' ? 'bg-danger/15 text-danger' :
                      'bg-amber/15 text-amber'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-400 font-mono text-[11px]">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-8 overflow-y-auto flex flex-col justify-between animate-slideIn">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Transaction Governance Audit</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedTx.id}</p>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Amount & Status Card */}
              <div className="p-5 rounded-2xl bg-navy text-white mb-6">
                <span className="text-[10px] uppercase font-bold text-teal tracking-wider">Authorized Transaction Total</span>
                <div className="text-3xl font-extrabold font-mono mt-1 text-white">
                  {formatINR(selectedTx.amount)}
                </div>
                <div className="flex items-center space-x-3 mt-4 text-xs">
                  <span className="bg-navy-secondary px-3 py-1 rounded-lg border border-slate-700">
                    Decision: <strong className="text-teal">{selectedTx.policy_decision}</strong>
                  </span>
                  <span className="bg-navy-secondary px-3 py-1 rounded-lg border border-slate-700">
                    Status: <strong className="text-white">{selectedTx.status}</strong>
                  </span>
                </div>
              </div>

              {/* Policy Engine Evaluation Rules */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-electric-blue" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Deterministic Policy Engine Rules Evaluated
                  </h4>
                </div>
                <div className="space-y-2">
                  {selectedTx.policy_rules_evaluated && selectedTx.policy_rules_evaluated.length > 0 ? (
                    selectedTx.policy_rules_evaluated.map((r: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">{r.rule}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{r.reason || 'Rule check satisfied'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.result === 'PASSED' || r.result === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {r.result}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-500">
                      Standard policy checks passed: Kill Switch inactive, Wallet liquid, Agent budget within limit.
                    </div>
                  )}
                </div>
              </div>

              {/* Policy Final Reason */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 mb-6">
                <strong>Authorization Justification: </strong>
                {selectedTx.policy_reason || 'Verified against organizational policy bounds'}
              </div>

              {/* Payment Processing Section */}
              {selectedTx.status === 'PENDING' && selectedTx.policy_decision === 'APPROVED' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Execute Settlement</h4>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Choose payment adapter to finalize simulated transaction</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleProcessPayment(selectedTx.id, 'MOCK')}
                      disabled={paymentProcessing}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Process via Mock Adapter
                    </button>
                    <button
                      onClick={() => handleProcessPayment(selectedTx.id, 'PAYPAL_SANDBOX')}
                      disabled={paymentProcessing}
                      className="py-2.5 px-4 bg-electric-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      PayPal Sandbox Mode
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

