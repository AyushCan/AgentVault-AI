import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { DashboardStats } from '../types';
import api from '../api/client';
import { 
  Wallet, 
  Bot, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [spendingTrend, setSpendingTrend] = useState<any[]>([]);
  const [agentSpending, setAgentSpending] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [riskDist, setRiskDist] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sRes, tRes, aRes, oRes, rRes, actRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/spending-trend'),
        api.get('/dashboard/agent-expenditure'),
        api.get('/dashboard/transaction-outcomes'),
        api.get('/dashboard/risk-distribution'),
        api.get('/dashboard/recent-activity')
      ]);
      setStats(sRes.data);
      setSpendingTrend(tRes.data);
      setAgentSpending(aRes.data);
      setOutcomes(oRes.data);
      setRiskDist(rRes.data);
      setActivities(actRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <Layout title="Executive Monitoring Dashboard" subtitle="Real-time multi-agent financial governance and spending telemetry">
      {/* 6 Key Stat Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {/* Total Allocation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Treasury Allocation</span>
            <div className="p-2 bg-blue-50 text-electric-blue rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {stats ? formatINR(stats.total_allocation) : '...'}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Simulated Main Wallets</span>
        </div>

        {/* Available Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Balance</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600 tracking-tight">
            {stats ? formatINR(stats.available_balance) : '...'}
          </div>
          <span className="text-[10px] text-emerald-500 font-medium font-mono">Unallocated Liquid Reserve</span>
        </div>

        {/* Total Spending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Executed Spend</span>
            <div className="p-2 bg-teal/10 text-teal rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {stats ? formatINR(stats.total_spending) : '...'}
          </div>
          <span className="text-[10px] text-teal font-medium">Verified Completed Txns</span>
        </div>

        {/* Active Agents */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Autonomous Agents</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {stats ? stats.active_agents : '...'} Active
          </div>
          <span className="text-[10px] text-purple-500 font-medium">Role Delegated</span>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 bg-amber/10 text-amber rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber tracking-tight">
            {stats ? stats.pending_approvals : '...'}
          </div>
          <span className="text-[10px] text-amber font-medium">Requires Human Sign-off</span>
        </div>

        {/* Risk Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Alerts</span>
            <div className="p-2 bg-red-50 text-red-500 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-red-500 tracking-tight">
            {stats ? stats.risk_alerts : '...'}
          </div>
          <span className="text-[10px] text-red-400 font-medium">High / Critical Flags</span>
        </div>
      </div>

      {/* Charts Row 1: Spending Trend & Agent Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Spending Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">7-Day Spending Trajectory</h3>
              <p className="text-xs text-slate-400">Total verified agent expenditures in INR</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-semibold">Simulated Telemetry</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spendingTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  formatter={(val: any) => [formatINR(Number(val)), 'Spend']}
                  contentStyle={{ backgroundColor: '#101B2D', borderRadius: '12px', color: '#fff', border: 'none' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#4169E1" strokeWidth={3} dot={{ fill: '#4169E1', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent Expenditure Breakdown (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800">Expenditure by Agent</h3>
            <p className="text-xs text-slate-400">Utilized budget vs allocated limit</p>
          </div>
          <div className="space-y-4">
            {agentSpending.map((item, idx) => {
              const pct = Math.min(100, Math.round((item.spent / (item.limit || 1)) * 100));
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.agent}</span>
                    <span className="font-mono text-slate-500">{formatINR(item.spent)} / {formatINR(item.limit)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        pct > 80 ? 'bg-danger' : pct > 50 ? 'bg-amber' : 'bg-teal'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Role: {item.role}</span>
                    <span>{pct}% utilized</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Transaction Outcomes & Risk Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Transaction Outcomes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Transaction Authorization Outcomes</h3>
          <p className="text-xs text-slate-400 mb-4">Autonomous vs Human Interventions</p>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outcomes} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                  {outcomes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#101B2D', borderRadius: '12px', color: '#fff', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {outcomes.map((o, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: o.color }} />
                <span className="text-slate-600">{o.name}: <strong className="text-slate-800">{o.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Risk Score Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Fraud Engine Classification</p>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                  {riskDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#101B2D', borderRadius: '12px', color: '#fff', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {riskDist.map((r, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-slate-600">{r.name}: <strong className="text-slate-800">{r.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Ledger Activity Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Live Audit Ledger Activity</h3>
              <p className="text-xs text-slate-400">Cryptographically chained events</p>
            </div>
            <Activity className="w-4 h-4 text-electric-blue animate-pulse" />
          </div>
          <div className="space-y-3 overflow-y-auto max-h-64 flex-1 pr-1">
            {activities.map((act) => (
              <div key={act.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3 text-xs">
                <div className="mt-0.5 p-1 rounded-lg bg-blue-100 text-electric-blue shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 truncate">{act.description}</p>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-mono text-electric-blue">{act.event_type}</span>
                    <span>•</span>
                    <span>{new Date(act.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};
