import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useKillSwitch } from '../../context/KillSwitchContext';
import { Power, UserCircle2, Bell, AlertTriangle } from 'lucide-react';

export const TopNav: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const { isActive, toggleKillSwitch } = useKillSwitch();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 flex items-center justify-between px-8 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4">
        {/* Prominent Emergency Kill Switch Button */}
        <button
          onClick={() => toggleKillSwitch(!isActive, 'Manual Kill Switch Triggered from Dashboard')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
            isActive
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30 animate-pulse'
              : 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200'
          }`}
          title={isActive ? 'Click to Resume System Operations' : 'Click to Block All Agent Transactions Immediately'}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isActive ? 'DEACTIVATE KILL SWITCH' : 'EMERGENCY KILL SWITCH'}</span>
        </button>

        {/* User profile */}
        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-teal font-semibold uppercase">{user?.role || 'Admin'}</p>
          </div>
          <button
            onClick={logout}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
            title="Sign Out"
          >
            <UserCircle2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
