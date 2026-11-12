import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';
import api from '../api/client';

export const Login: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@agentvault.ai');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.access_token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await demoLogin();
      navigate('/');
    } catch (err: any) {
      setError('Demo login failed. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute w-[500px] h-[500px] bg-electric-blue/15 rounded-full blur-3xl -top-32 -left-32 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-teal/10 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

      <div className="w-full max-w-md bg-navy-secondary border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-white">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-electric-blue to-teal mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AgentVault</h1>
          <p className="text-xs text-teal font-medium mt-1">Autonomous Intelligence. Human-Controlled Finance.</p>
          <p className="text-xs text-slate-400 mt-2">Sign in to access your governance dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Demo Fast Login Button (One-Click) */}
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full py-3.5 px-4 mb-6 bg-gradient-to-r from-electric-blue to-blue-600 hover:from-blue-600 hover:to-electric-blue text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-teal" />
          <span>One-Click Demo Login (Judge Mode)</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-slate-700/60 w-full" />
          <span className="bg-navy-secondary px-3 text-xs text-slate-500 uppercase tracking-wider">or sign in with password</span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-navy border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
                placeholder="admin@agentvault.ai"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-navy border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Demo Credentials: <span className="text-slate-300 font-mono">demo@agentvault.ai / demo123</span>
        </div>
      </div>
    </div>
  );
};
