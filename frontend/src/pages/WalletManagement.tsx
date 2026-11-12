import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Wallet, Agent } from '../types';
import api from '../api/client';
import { 
  Wallet as WalletIcon, 
  Plus, 
  Lock, 
  Unlock, 
  ArrowUpRight, 
  ShieldAlert,
  Info
} from 'lucide-react';

export const WalletManagement: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  // Form States
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletDesc, setNewWalletDesc] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('100000');

  const [allocAgentId, setAllocAgentId] = useState('');
  const [allocAmount, setAllocAmount] = useState('25000');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [wRes, aRes] = await Promise.all([
        api.get('/wallets'),
        api.get('/agents')
      ]);
      setWallets(wRes.data);
      setAgents(aRes.data);
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

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/wallets', {
        name: newWalletName,
        description: newWalletDesc,
        total_balance: parseFloat(newWalletBalance)
      });
      setShowCreateModal(false);
      setNewWalletName('');
      setNewWalletDesc('');
      setFeedbackMsg({ type: 'success', text: 'New simulated wallet created successfully!' });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to create wallet' });
    }
  };

  const handleToggleFreeze = async (wallet: Wallet) => {
    try {
      if (wallet.status === 'ACTIVE') {
        await api.post(`/wallets/${wallet.id}/freeze`);
        setFeedbackMsg({ type: 'success', text: `Wallet '${wallet.name}' has been FROZEN. Agent purchases from it will now be rejected.` });
      } else {
        await api.post(`/wallets/${wallet.id}/unfreeze`);
        setFeedbackMsg({ type: 'success', text: `Wallet '${wallet.name}' is now ACTIVE.` });
      }
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Action failed' });
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;
    try {
      await api.post(`/wallets/${selectedWallet.id}/allocate`, {
        agent_id: allocAgentId,
        amount: parseFloat(allocAmount)
      });
      setShowAllocateModal(false);
      setFeedbackMsg({ type: 'success', text: `Allocated ${formatINR(parseFloat(allocAmount))} to selected agent!` });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.detail || 'Allocation failed' });
    }
  };

  return (
    <Layout title="Programmable Wallets & Budgets" subtitle="Configure programmatic financial boundaries and simulated multi-agent treasury pools">
      {/* Notice Banner */}
      <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs mb-6">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-electric-blue shrink-0" />
          <span>All balances are <strong>simulated Indian Rupees (₹)</strong> designed for autonomous agent governance demonstrations.</span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-electric-blue text-white rounded-xl font-bold shadow-sm hover:bg-blue-600 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Wallet</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className={`p-4 mb-6 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet) => {
          const isFrozen = wallet.status === 'FROZEN';
          const allocPct = wallet.total_balance > 0 ? Math.round((wallet.allocated_balance / wallet.total_balance) * 100) : 0;

          return (
            <div 
              key={wallet.id} 
              className={`bg-white rounded-3xl p-6 border transition-all shadow-sm ${
                isFrozen ? 'border-red-300 bg-red-50/20' : 'border-slate-200/80 hover:shadow-md'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isFrozen ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-electric-blue'
                  }`}>
                    <WalletIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{wallet.name}</h3>
                    <p className="text-xs text-slate-400 truncate max-w-[180px]">{wallet.description || 'Organizational Treasury Pool'}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isFrozen ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {wallet.status}
                </span>
              </div>

              {/* Total Balance */}
              <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Pool Allocation</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
                  {formatINR(wallet.total_balance)}
                </div>
              </div>

              {/* Balances details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Available (Unassigned):</span>
                  <span className="font-bold text-emerald-600 font-mono">{formatINR(wallet.available_balance)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Allocated to Agents:</span>
                  <span className="font-bold text-slate-700 font-mono">{formatINR(wallet.allocated_balance)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-electric-blue h-2 rounded-full transition-all"
                    style={{ width: `${allocPct}%` }}
                  />
                </div>
                <p className="text-right text-[10px] text-slate-400 font-medium">{allocPct}% Committed</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setSelectedWallet(wallet);
                    setAllocAgentId(agents[0]?.id || '');
                    setShowAllocateModal(true);
                  }}
                  disabled={isFrozen || wallet.available_balance <= 0}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Allocate</span>
                </button>

                <button
                  onClick={() => handleToggleFreeze(wallet)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                    isFrozen 
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' 
                      : 'bg-red-50 hover:bg-red-100 text-red-600'
                  }`}
                >
                  {isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{isFrozen ? 'Unfreeze' : 'Freeze'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Wallet Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-1">Create Simulated Wallet</h3>
            <p className="text-xs text-slate-400 mb-4">Provision a new financial sandbox pool for agents</p>
            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Wallet Name</label>
                <input
                  type="text"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder="e.g. Marketing Autonomous Pool"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-electric-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newWalletDesc}
                  onChange={(e) => setNewWalletDesc(e.target.value)}
                  placeholder="Purpose of this wallet"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-electric-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Allocation (₹)</label>
                <input
                  type="number"
                  value={newWalletBalance}
                  onChange={(e) => setNewWalletBalance(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-electric-blue"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-electric-blue text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition shadow-sm"
                >
                  Create Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Budget Modal */}
      {showAllocateModal && selectedWallet && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-1">Allocate Budget to Agent</h3>
            <p className="text-xs text-slate-400 mb-4">From '{selectedWallet.name}' (Available: {formatINR(selectedWallet.available_balance)})</p>
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Agent</label>
                <select
                  value={allocAgentId}
                  onChange={(e) => setAllocAgentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-electric-blue"
                  required
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.role}) - Current: {formatINR(a.budget_limit)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Allocate (₹)</label>
                <input
                  type="number"
                  max={selectedWallet.available_balance}
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-electric-blue"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-electric-blue text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition shadow-sm"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
