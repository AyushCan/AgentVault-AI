import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import api from '../api/client';
import { 
  ShieldAlert, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Copy, 
  UserX, 
  Power,
  Flame,
  ArrowRight
} from 'lucide-react';

interface SimulationScenario {
  id: number;
  title: string;
  category: string;
  icon: any;
  threatDescription: string;
  expectedDefense: string;
}

export const SecurityLab: React.FC = () => {
  const [runningScenarioId, setRunningScenarioId] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, any>>({});

  const scenarios: SimulationScenario[] = [
    {
      id: 1,
      title: 'Budget Limit Violation',
      category: 'Financial Policy Boundary',
      icon: Zap,
      threatDescription: 'Agent attempts an autonomous purchase that exceeds its authorized spending limit.',
      expectedDefense: 'Rule 5 triggers auto-rejection before payment gateway dispatch.'
    },
    {
      id: 2,
      title: 'Suspicious Vendor Purchase',
      category: 'Vendor Trust & Risk',
      icon: Flame,
      threatDescription: 'Agent selects an unverified or low-trust marketplace seller with anomaly flags.',
      expectedDefense: 'Fraud engine generates high risk score and forces human review.'
    },
    {
      id: 3,
      title: 'Prompt Injection Attempt',
      category: 'Adversarial AI Defense',
      icon: ShieldAlert,
      threatDescription: 'Malicious user attempts to hijack the actor agent using instruction override injection payloads.',
      expectedDefense: 'Input sanitization regex/pattern filter catches injection and blocks request.'
    },
    {
      id: 4,
      title: 'Duplicate Purchase Detection',
      category: 'Autonomous Looping Anomaly',
      icon: Copy,
      threatDescription: 'Agent gets stuck in a loop and triggers duplicate purchase requests for the same vendor within 24h.',
      expectedDefense: 'Duplicate order anomaly detection engine spikes risk score by +25 points.'
    },
    {
      id: 5,
      title: 'Unauthorized Agent Purchase',
      category: 'Agent Role & Capability Boundary',
      icon: UserX,
      threatDescription: 'An agent without PURCHASE permission (e.g. ResearchBot) attempts to initiate financial transactions.',
      expectedDefense: 'Policy Rule 4 checks permission array and immediately rejects transaction.'
    },
    {
      id: 6,
      title: 'Emergency Kill Switch Activation',
      category: 'Fail-Safe Circuit Breaker',
      icon: Power,
      threatDescription: 'Simulates immediate system-wide financial halt when administrator engages the emergency kill switch.',
      expectedDefense: 'Policy Rule 1 hard blocks all active agent transactions with BLOCKED_BY_KILL_SWITCH.'
    }
  ];

  const runSimulation = async (id: number) => {
    setRunningScenarioId(id);
    try {
      const res = await api.post('/security/simulate', { scenario_id: id });
      setResults((prev) => ({ ...prev, [id]: res.data }));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Simulation execution failed');
    } finally {
      setRunningScenarioId(null);
    }
  };

  return (
    <Layout title="Interactive Security Simulation Lab" subtitle="Test AgentVault's defense-in-depth governance against real-world adversarial AI vectors and financial policy violations">
      
      {/* Intro info card */}
      <div className="bg-navy text-white rounded-3xl p-6 border border-slate-800 shadow-xl mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-teal text-xs font-mono font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>HACKATHON DEMO LAB</span>
          </div>
          <h2 className="text-lg font-bold">Live Threat & Governance Verification Suite</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Each scenario executes live backend Python policy and risk algorithms to prove deterministic boundaries, explainable fraud detection, and fail-safe controls.
          </p>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((sc) => {
          const res = results[sc.id];
          const isRunning = runningScenarioId === sc.id;

          return (
            <div 
              key={sc.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800">
                      <sc.icon className="w-5 h-5 text-electric-blue" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                        Scenario #{sc.id}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{sc.title}</h3>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-electric-blue font-bold px-2 py-0.5 rounded-full font-mono">
                    {sc.category}
                  </span>
                </div>

                {/* Threat description */}
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">{sc.threatDescription}</p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 mb-6">
                  <strong className="text-slate-700">Expected Defense: </strong>
                  {sc.expectedDefense}
                </div>
              </div>

              {/* Simulation Run Button */}
              <div>
                {!res ? (
                  <button
                    onClick={() => runSimulation(sc.id)}
                    disabled={isRunning}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-teal" />
                    <span>{isRunning ? 'Running Live Simulation...' : 'Execute Threat Simulation'}</span>
                  </button>
                ) : (
                  <div className="animate-fadeIn">
                    {/* Status Badge */}
                    <div className={`p-3 rounded-xl mb-3 flex items-center justify-between border ${
                      res.status === 'BLOCKED' ? 'bg-red-50 text-red-700 border-red-200' :
                      res.status === 'DETECTED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {res.status === 'BLOCKED' ? <XCircle className="w-4 h-4 text-red-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                        <span className="text-xs font-bold uppercase tracking-wider">{res.status}</span>
                      </div>
                      <span className="text-xs font-mono font-bold">Decision: {res.decision}</span>
                    </div>

                    {/* Explanation */}
                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl mb-3">
                      {res.explanation}
                    </p>

                    {/* Timeline */}
                    {res.timeline && (
                      <div className="space-y-1.5 mb-3 border-t border-slate-100 pt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Execution Trace</span>
                        {res.timeline.map((step: any, i: number) => (
                          <div key={i} className="text-[10px] text-slate-600 flex items-start space-x-1.5">
                            <span className="font-bold text-teal">•</span>
                            <span><strong>{step.step}:</strong> {step.detail}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => runSimulation(sc.id)}
                      className="w-full py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg transition"
                    >
                      Re-run Scenario
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
};

