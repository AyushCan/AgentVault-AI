import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  CreditCard, 
  Database, 
  RefreshCw, 
  CheckCircle2,
  Info
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [demoMode, setDemoMode] = useState(true);

  return (
    <Layout title="Platform Configuration & System Settings" subtitle="Governance environment variables, AI agent models, and payment adapter configurations">
      
      <div className="max-w-4xl space-y-6">
        
        {/* Groq AI Engine Status */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-electric-blue flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Groq AI Agent Engine</h3>
              <p className="text-xs text-slate-400">Powers Actor Agent and Independent Auditor Agent</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-700">Autonomous Reasoning Mode</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Currently running in <strong>Demo AI Mode (Self-Contained)</strong> with fallback reasoning logic. Add your <code>GROQ_API_KEY</code> in <code>backend/.env</code> for live cloud inference.
                </p>
              </div>
              <span className="px-3 py-1 bg-teal/20 text-teal font-mono font-bold rounded-full text-[11px]">
                DEMO AI READY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Configured Model</label>
                <input
                  type="text"
                  value={groqModel}
                  onChange={(e) => setGroqModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Structured JSON Output</label>
                <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Enforced via json_object Schema</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateway Adapters */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Payment Gateway Adapters</h3>
              <p className="text-xs text-slate-400">Deterministic execution after policy clearance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">Mock Payment Adapter</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 font-bold">DEFAULT ACTIVE</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Simulates real-world bank processing, generates reference IDs (e.g. <code>PAY-XXXXXXXXXXXX</code>), and updates transaction status without requiring external accounts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">PayPal Developer Sandbox</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold">OPTIONAL</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Connect your PayPal Sandbox Client ID & Secret in <code>backend/.env</code> to test live sandbox orders.
              </p>
            </div>
          </div>
        </div>

        {/* Database & Persistence */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Database & Storage Engine</h3>
              <p className="text-xs text-slate-400">Zero-configuration local SQLite persistence with SQLAlchemy</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
            <div>
              <p className="font-mono font-bold text-slate-800">sqlite:///./agentvault.db</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Auto-seeded with demo agents, wallets, catalogue, and transaction history.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-bold font-mono">
              CONNECTED
            </span>
          </div>
        </div>

      </div>
    </Layout>
  );
};
