import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  Bot, 
  ArrowLeftRight, 
  SlidersHorizontal, 
  CheckSquare, 
  ShieldAlert, 
  FileText, 
  Settings, 
  Power,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useKillSwitch } from '../../context/KillSwitchContext';

export const Sidebar: React.FC = () => {
  const { isActive } = useKillSwitch();

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Wallets & Budgets', path: '/wallets', icon: Wallet },
    { name: 'AI Agents', path: '/agents', icon: Bot },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Policy Studio', path: '/policy', icon: SlidersHorizontal },
    { name: 'Approval Center', path: '/approvals', icon: CheckSquare },
    { name: 'Security Lab', path: '/security-lab', icon: ShieldAlert },
    { name: 'Audit Ledger', path: '/ledger', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-navy flex flex-col h-screen fixed left-0 top-0 text-slate-300 border-r border-slate-800 z-30 select-none">
      {/* Brand */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-blue to-teal flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight">AgentVault</h1>
            <p className="text-[10px] text-teal font-medium uppercase tracking-wider">Gov & Control</p>
          </div>
        </div>
      </div>

      {/* Kill Switch Status Banner in Sidebar */}
      <div className={`mx-3 my-3 p-3 rounded-xl border flex items-center justify-between transition-all ${
        isActive 
          ? 'bg-red-500/10 border-red-500/40 text-red-400' 
          : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-red-500 animate-ping' : 'bg-teal'}`} />
          <span className="text-xs font-semibold">{isActive ? 'KILL SWITCH ENGAGED' : 'SYSTEM ACTIVE'}</span>
        </div>
        <Radio className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-teal'}`} />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive: isLinkActive }) =>
              `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isLinkActive
                  ? 'bg-electric-blue text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-navy-secondary text-xs text-slate-500">
        <p className="font-semibold text-slate-400">AgentVault v1.0.0</p>
        <p className="text-[11px] mt-0.5">Autonomous Intelligence. Human-Controlled Finance.</p>
      </div>
    </aside>
  );
};

