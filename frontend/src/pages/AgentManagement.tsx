import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Agent } from '../types';
import api from '../api/client';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Send,
  Share2,
  Sliders,
  DollarSign,
  FileSearch,
  ShoppingCart
} from 'lucide-react';

export const AgentManagement: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [delegations, setDelegations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Actor Agent Interactive Console
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [instruction, setInstruction] = useState('Purchase a laptop under ₹70,000 with at least 16 GB RAM');
  const [agentRunning, setAgentRunning] = useState(false);
  const [actorResult, setActorResult] = useState<any | null>(null);
  const [purchaseCreated, setPurchaseCreated] = useState<any | null>(null);

  // Delegation Modal
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [fromAgentId, setFromAgentId] = useState('');
  const [toAgentId, setToAgentId] = useState('');
  const [delegationTask, setDelegationTask] = useState('Research alternative GPU workstation vendors');

  const fetchData = async () => {
    try {
      const [aRes, dRes] = await Promise.all([
        api.get('/agents'),
        api.get('/delegations')
      ]);
      setAgents(aRes.data);
      if (aRes.data.length > 0 && !selectedAgentId) {
        setSelectedAgentId(aRes.data[0].id);
        setFromAgentId(aRes.data[0].id);
        setToAgentId(aRes.data[1]?.id || aRes.data[0].id);
      }
      setDelegations(dRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleRunActorAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgentRunning(true);
    setActorResult(null);
    setPurchaseCreated(null);
    try {
      const res = await api.post('/agents/instruct', {
        agent_id: selectedAgentId,
        instruction
      });
      setActorResult(res.data.result);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Actor agent execution failed');
    } finally {
      setAgentRunning(false);
    }
  };

  const handleCreatePurchaseRequest = async () => {
    if (!actorResult) return;
    try {
      const res = await api.post('/purchases', {
        agent_id: selectedAgentId,
        vendor_id: actorResult.recommended_vendor_id,
        product_id: actorResult.recommended_product_id,
        amount: actorResult.recommended_price,
        instruction,
        actor_recommendation: actorResult
      });
      setPurchaseCreated(res.data);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit purchase request');
    }
  };

  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/delegations', {
        from_agent_id: fromAgentId,
        to_agent_id: toAgentId,
        task_type: 'RESEARCH',
        task_description: delegationTask
      });
      setShowDelegationModal(false);
      setDelegationTask('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Delegation failed');
    }
  };

  return (
    <Layout title="Autonomous AI Agent Command & Delegation" subtitle="Multi-agent role coordination, capability boundaries, and natural language purchasing execution">
      
      {/* SECTION 1: Natural Language Purchasing Console (Feature 1) */}
      <div className="bg-navy rounded-3xl p-7 text-white mb-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-electric-blue/10 rounded-full blur-3xl -top-24 -right-24 pointer-events-none" />

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-electric-blue/20 text-electric-blue border border-electric-blue/30">
            <Sparkles className="w-5 h-5 text-teal" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Interactive Autonomous Actor Agent</h2>
            <p className="text-xs text-slate-400">Instruct procurement bots to autonomously search vendor catalogues, compare prices, and prepare purchase requests</p>
          </div>
        </div>

        <form onSubmit={handleRunActorAgent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Executing Agent</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full bg-navy-secondary border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-electric-blue"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Natural Language Purchasing Instruction</label>
              <div className="relative">
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g. Purchase a laptop under ₹70,000 with at least 16 GB RAM"
                  className="w-full bg-navy-secondary border border-slate-700 rounded-xl pl-4 pr-36 py-3 text-sm text-white focus:outline-none focus:border-electric-blue"
                  required
                />
                <button
                  type="submit"
                  disabled={agentRunning}
                  className="absolute right-2 top-2 px-4 py-2 bg-gradient-to-r from-electric-blue to-teal hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-md"
                >
                  {agentRunning ? (
                    <span>Reasoning...</span>
                  ) : (
                    <>
                      <span>Research & Compare</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* AI Agent Reasoning Result Panel */}
        {actorResult && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 animate-fadeIn">
            <div className="bg-navy-secondary/90 rounded-2xl p-6 border border-slate-700/60">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-teal/20 text-teal px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {actorResult._mode || 'AI MODE'}
                    </span>
                    <h3 className="text-base font-bold text-white">Recommended: {actorResult.recommended_product_name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Vendor: <strong>{actorResult.recommended_vendor_name}</strong> • Price: <strong className="text-teal font-mono">{formatINR(actorResult.recommended_price)}</strong></p>
                </div>

                {!purchaseCreated ? (
                  <button
                    onClick={handleCreatePurchaseRequest}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Submit to Policy Engine & Auditor</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submitted! Policy Decision: {purchaseCreated.policy_result?.decision}</span>
                  </div>
                )}
              </div>

              {/* Reasoning */}
              <div className="p-3.5 bg-navy/60 rounded-xl text-xs text-slate-300 leading-relaxed mb-4 border border-slate-800">
                <span className="text-teal font-semibold">Agent Reasoning: </span>
                {actorResult.reasoning}
              </div>

              {/* Tasks Performed Stepper */}
              {actorResult.tasks_performed && (
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Autonomous Workflow Steps Executed</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {actorResult.tasks_performed.map((task: string, i: number) => (
                      <div key={i} className="flex items-center space-x-2 text-xs bg-navy/40 p-2 rounded-lg border border-slate-800/80">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal shrink-0" />
                        <span className="text-slate-300 truncate">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparison Table */}
              {actorResult.comparison_table && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Vendor Catalogue Comparative Matrix</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-navy/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Product</th>
                          <th className="py-2 px-3">Vendor</th>
                          <th className="py-2 px-3">Price</th>
                          <th className="py-2 px-3">Spec & Budget Match</th>
                          <th className="py-2 px-3">Agent Assessment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {actorResult.comparison_table.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-800/30">
                            <td className="py-2 px-3 font-medium text-slate-200">{row.product}</td>
                            <td className="py-2 px-3 text-slate-400">{row.vendor}</td>
                            <td className="py-2 px-3 font-mono text-slate-300">{formatINR(row.price)}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.meets_requirements ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                              }`}>
                                {row.meets_requirements ? 'PASSED' : 'NON-COMPLIANT'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-400">{row.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Active AI Agent Roster */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Configured Autonomous Agent Fleet</h3>
          <p className="text-xs text-slate-400">Assigned roles, capability permissions, and programmatic spending caps</p>
        </div>
        <button
          onClick={() => setShowDelegationModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>New Agent Delegation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {agents.map((agent) => {
          const pct = Math.min(100, Math.round((agent.spent_amount / (agent.budget_limit || 1)) * 100));
          return (
            <div key={agent.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Bot className="w-5 h-5 text-electric-blue" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{agent.name}</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-semibold">
                      {agent.role}
                    </span>
                  </div>
                </div>
                <span className={`w-2 h-2 rounded-full ${agent.status === 'ACTIVE' ? 'bg-teal' : 'bg-red-500'}`} />
              </div>

              <div className="space-y-3 mb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Budget Limit:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatINR(agent.budget_limit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Spent:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatINR(agent.spent_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Available:</span>
                  <span className="font-bold text-emerald-600 font-mono">{formatINR(agent.available_budget)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-electric-blue h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Capabilities */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Capabilities</span>
                <div className="flex flex-wrap gap-1">
                  {agent.permissions.map((p, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-50 text-electric-blue text-[10px] font-mono font-semibold rounded-md">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 3: Agent-to-Agent Delegation History (Feature 3) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Agent-to-Agent Delegation Ledger</h3>
        <p className="text-xs text-slate-400 mb-4">Inter-agent task handoffs, research mandates, and compliance checks</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Initiating Agent</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Agent</th>
                <th className="py-2.5 px-4 font-semibold">Task Type</th>
                <th className="py-2.5 px-4 font-semibold">Task Description</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {delegations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-medium text-slate-800">{d.from_agent_id}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{d.to_agent_id}</td>
                  <td className="py-3 px-4 font-mono text-electric-blue font-bold">{d.task_type}</td>
                  <td className="py-3 px-4 text-slate-600">{d.task_description}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Delegation Modal */}
      {showDelegationModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-1">Create Agent Delegation</h3>
            <p className="text-xs text-slate-400 mb-4">Transfer tasks autonomously from one agent to another</p>
            <form onSubmit={handleCreateDelegation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">From Agent</label>
                <select
                  value={fromAgentId}
                  onChange={(e) => setFromAgentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">To Agent (Must have required capability)</label>
                <select
                  value={toAgentId}
                  onChange={(e) => setToAgentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Specification</label>
                <textarea
                  rows={3}
                  value={delegationTask}
                  onChange={(e) => setDelegationTask(e.target.value)}
                  placeholder="Describe the research or validation objective..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDelegationModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-electric-blue text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition shadow-sm"
                >
                  Dispatch Delegation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

