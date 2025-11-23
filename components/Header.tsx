import React from 'react';
import { ShieldCheck, CarFront } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-slate-950 border-b border-slate-800/60 p-4 sticky top-0 z-50 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/80">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
            <CarFront className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              AutoDamage <span className="text-blue-500">Analyst</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Enterprise Edition v3.0</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
           <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase px-4 py-1.5 border border-slate-800 rounded-full bg-slate-900">
              <ShieldCheck className="w-3 h-3 text-green-500" />
              <span>System Secure</span>
           </div>
           <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
              CX
           </div>
        </div>
      </div>
    </header>
  );
};