import React from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useKillSwitch } from '../../context/KillSwitchContext';
import { AlertOctagon } from 'lucide-react';

interface LayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ title, subtitle, children }) => {
  const { isActive, reason } = useKillSwitch();

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <TopNav title={title} subtitle={subtitle} />
        
        {/* Global Emergency Kill Switch Warning Banner */}
        {isActive && (
          <div className="bg-red-600 text-white px-8 py-3 flex items-center justify-between text-sm font-semibold shadow-md animate-fadeIn">
            <div className="flex items-center space-x-3">
              <AlertOctagon className="w-5 h-5 text-white animate-bounce" />
              <span>EMERGENCY KILL SWITCH ENGAGED: All autonomous agent purchases and financial actions are strictly BLOCKED.</span>
              {reason && <span className="text-xs bg-red-700 px-2 py-0.5 rounded font-mono">[{reason}]</span>}
            </div>
            <span className="text-xs text-red-100 uppercase tracking-widest font-mono">System Halt Active</span>
          </div>
        )}

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

