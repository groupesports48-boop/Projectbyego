import React from 'react';
import { Calendar, History, User as UserIcon } from 'lucide-react';
import { EsportsFlame, EsportsTelemetry, EsportsProfit } from './EsportsIcons';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dash', icon: EsportsFlame },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'history', label: 'History', icon: History },
    { id: 'profit-loss', label: 'P&L', icon: EsportsProfit },
    { id: 'analytics', label: 'Stats', icon: EsportsTelemetry },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08090F]/95 backdrop-blur-xl border-t border-[#1f233a] px-3 py-1.5 shadow-[0_-8px_25px_rgba(0,0,0,0.8)] safe-area-pb">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative ${
                isActive
                  ? 'text-white'
                  : 'text-[#9296A8] hover:text-white'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 w-7 h-1 bg-[#8B5CF6] rounded-full shadow-[0_0_10px_#8B5CF6]" />
              )}
              <div className={`p-1 rounded-lg transition-transform ${isActive ? 'bg-[#8B5CF6]/20 scale-105' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#A78BFA] drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]' : ''}`} />
              </div>
              <span className={`text-[10px] mt-0.5 font-semibold ${isActive ? 'text-white' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
