import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Policy, Vendor, Agent } from '../types';
import api from '../api/client';
import { 
  SlidersHorizontal, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Save,
  Info
} from 'lucide-react';

export const PolicyStudio: React.FC = () => {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form edit states
  const [autoApproveLimit, setAutoApproveLimit] = useState('10000');
  const [humanApprovalAbove, setHumanApprovalAbove] = useState('50000');
  const [riskRejectThreshold, setRiskRejectThreshold] = useState('80');
  const [blockedVendors, setBlockedVendors] = useState<string[]>([]);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Live Policy Test Sandbox
  const [testAgentId, setTestAgentId] = useState('');
  const [testAmount, setTestAmount] = useState('45000');
  const [testRiskScore, setTestRiskScore] = useState('25');
  const [testResult, setTestResult] = useState<any | null>(null);

  const fetchPolicy = async () => {
    try {
      const [pRes, vRes, aRes] = await Promise.all([
        api.get('/policy'),
        api.get('/vendors'),
        api.get('/agents')
      ]);
      if (pRes.data.length > 0) {
        const p = pRes.data[0];
        setPolicy(p);
        setAutoApproveLimit(String(p.auto_approve_threshold));
        setHumanApprovalAbove(String(p.require_human_above));
        setRiskRejectThreshold(String(p.risk_auto_reject_threshold));
        setBlockedVendors(p.blocked_vendors || []);
      }
      setVendors(vRes.data);
      setAgents(aRes.data);
      if (aRes.data.length > 0) {
        setTestAgentId(aRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;
    try {
      await api.put(`/policy/${policy.id}`, {
        auto_approve_threshold: parseFloat(autoApproveLimit),
        require_human_above: parseFloat(humanApprovalAbove),
        risk_auto_reject_threshold: parseFloat(riskRejectThreshold),
        blocked_vendors: blockedVendors
      });
      setSaveMsg('Financial policy thresholds updated and enforced across all agents!');
      setTimeout(() => setSaveMsg(null), 5000);
      fetchPolicy();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save policy');
    }
  };

  const handleTestPolicy = async () => {
    try {
      const res = await api.get('/policy/evaluate', {
        params: {
          agent_id: testAgentId,
          amount: parseFloat(testAmount),
          risk_score: parseFloat(testRiskScore)
        }
      });
      setTestResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Evaluation failed');
    }
  };

  const toggleBlockedVendor = (vendorId: string) => {
    setBlockedVendors((prev) => 
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  return (
    <Layout title="Deterministic Policy Studio" subtitle="Configure programmatic financial rules, authorization thresholds, and vendor blacklist controls">
      
      {saveMsg && (
        <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{saveMsg}</span>
          <button onClick={() => setSaveMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 cols): Policy Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSavePolicy} className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Global Financial Policy Rules</h3>
                <p className="text-xs text-slate-400">Strict deterministic checks enforced before any autonomous transaction executes</p>
              </div>
              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2.5 bg-electric-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save & Deploy Policy</span>
              </button>
            </div>

            {/* Threshold Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Auto-Approve Threshold (₹)
                </label>
                <input
                  type="number"
                  value={autoApproveLimit}
                  onChange={(e) => setAutoApproveLimit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-electric-blue"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Autonomous sign-off without human queue</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Require Human Above (₹)
                </label>
                <input
                  type="number"
                  value={humanApprovalAbove}
                  onChange={(e) => setHumanApprovalAbove(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-electric-blue"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Escalates directly to Approval Center</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Risk Auto-Reject Cutoff (0-100)
                </label>
                <input
                  type="number"
                  max="100"
                  min="0"
                  value={riskRejectThreshold}
                  onChange={(e) => setRiskRejectThreshold(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-electric-blue"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Hard auto-rejection score threshold</span>
              </div>
            </div>

            {/* Blocked Vendors Matrix */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Restricted & Blocked Vendors (Blacklist)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vendors.map((v) => {
                  const isBlocked = blockedVendors.includes(v.id) || v.is_blocked;
                  return (
                    <div 
                      key={v.id}
                      onClick={() => toggleBlockedVendor(v.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        isBlocked 
                          ? 'bg-red-50 border-red-300 text-red-900' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">{v.name}</p>
                        <p className="text-[10px] text-slate-500">Trust Score: {v.trust_score} • {v.category}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isBlocked ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isBlocked ? 'BLOCKED' : 'ALLOWED'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Explanation of 10-rule Deterministic Hierarchy */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Deterministic Policy Execution Hierarchy (Non-LLM)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">1. Kill Switch status verification</div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">2. Treasury Wallet active & unfrozen check</div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">3. Agent status is ACTIVE check</div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">4. Agent has PURCHASE permission</div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">5. Amount &le; Agent authorized budget limit</div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">6. Amount &le; Wallet liquid available funds</div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">7. Vendor Blacklist verification check</div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">8. Risk score &lt; auto-reject threshold</div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">9. Auto-approve threshold routing check</div>
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-semibold">10. Final Authorization Grant</div>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Live Policy Sandbox Evaluator */}
        <div className="bg-navy rounded-3xl p-6 border border-slate-800 text-white shadow-xl h-fit">
          <div className="flex items-center space-x-2 mb-4">
            <Play className="w-4 h-4 text-teal" />
            <h3 className="text-sm font-bold tracking-tight">Interactive Policy Sandbox</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6">Simulate and test policy decisions in real-time without committing transactions</p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Agent</label>
              <select
                value={testAgentId}
                onChange={(e) => setTestAgentId(e.target.value)}
                className="w-full bg-navy-secondary border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} (Limit: ₹{a.budget_limit})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Simulated Amount (₹)</label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="w-full bg-navy-secondary border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Simulated Risk Score (0-100)</label>
              <input
                type="number"
                value={testRiskScore}
                onChange={(e) => setTestRiskScore(e.target.value)}
                className="w-full bg-navy-secondary border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <button
              onClick={handleTestPolicy}
              className="w-full py-2.5 bg-gradient-to-r from-electric-blue to-teal text-white rounded-xl text-xs font-bold transition shadow-md hover:opacity-95"
            >
              Evaluate Policy Decision
            </button>
          </div>

          {/* Test Evaluation Result */}
          {testResult && (
            <div className="pt-4 border-t border-slate-800 animate-fadeIn">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Engine Outcome</span>
              <div className={`mt-1.5 p-3 rounded-xl font-bold text-xs flex items-center justify-between ${
                testResult.decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                testResult.decision === 'REJECTED' || testResult.decision === 'BLOCKED_BY_KILL_SWITCH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                <span>{testResult.decision}</span>
              </div>
              <p className="text-xs text-slate-300 mt-2 font-medium">{testResult.final_reason}</p>

              {/* Step-by-step Rule Trace */}
              <div className="mt-4 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {testResult.rules_evaluated.map((r: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-lg bg-navy-secondary/80 text-[11px] flex justify-between items-center border border-slate-800">
                    <span className="text-slate-300">{r.rule}</span>
                    <span className={`font-mono font-bold text-[10px] ${
                      r.result === 'PASSED' || r.result === 'APPROVED' ? 'text-teal' : 'text-danger'
                    }`}>
                      {r.result}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
