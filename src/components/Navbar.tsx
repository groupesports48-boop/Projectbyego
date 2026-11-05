import React from 'react';
import {
  Calendar,
  History,
  User as UserIcon,
  Bell,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import {
  EsportsFlame,
  EsportsTelemetry,
  EsportsWhatsApp,
  EsportsProfit,
} from './EsportsIcons';
import { User, AppNotification } from '../types';

interface NavbarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  notifications,
  onOpenNotifications,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: EsportsFlame },
    { id: 'planner', label: 'Match Planner', icon: Calendar },
    { id: 'history', label: 'Match History', icon: History },
    { id: 'profit-loss', label: 'Profit & Loss', icon: EsportsProfit },
    { id: 'analytics', label: 'Analytics', icon: EsportsTelemetry },
    { id: 'whatsapp', label: 'WhatsApp Groups', icon: EsportsWhatsApp },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#08090F]/90 backdrop-blur-xl border-b border-[#1f233a] shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo with 3D Bevel */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleSelectTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] via-[#6D28D9] to-[#3B0764] p-0.5 shadow-[0_4px_16px_rgba(139,92,246,0.5)] flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.7)]">
              <div className="w-full h-full bg-[#08090F] rounded-[10px] flex items-center justify-center border border-white/10">
                <EsportsFlame className="w-5 h-5 text-[#A78BFA] group-hover:text-white transition-colors drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-lg tracking-wider text-white">
                  DESTROYED
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30 shadow-sm font-mono">
                  FF HUB
                </span>
              </div>
              <p className="text-[10px] text-[#9296A8] tracking-widest uppercase font-semibold font-sub">
                eSports Management
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#171A2B] text-white border border-[#8B5CF6]/50 shadow-[0_4px_14px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] font-semibold'
                      : 'text-[#9296A8] hover:text-white hover:bg-[#111321] hover:border hover:border-[#1f233a]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#A78BFA] drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]' : 'text-[#9296A8]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right actions: Notifications & User profile pill */}
          <div className="flex items-center gap-3">
            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl btn-3d-dark text-[#C0C4D0] hover:text-white cursor-pointer"
              title="Notifications"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#8B5CF6] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#08090F] animate-pulse shadow-[0_0_8px_#8B5CF6]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* 3D User Profile Pill */}
            <div
              onClick={() => handleSelectTab('profile')}
              className="hidden sm:flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-[#111321] border border-[#1f233a] hover:border-[#8B5CF6]/50 shadow-sm cursor-pointer transition-all hover:scale-[1.02]"
            >
              <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 overflow-hidden flex items-center justify-center shadow-inner">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-[#A78BFA]" />
                )}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white leading-tight font-mono">
                  {user.ign || user.fullName}
                </p>
                <p className="text-[10px] text-[#A78BFA] leading-tight font-mono">
                  {user.role || 'Player'}
                </p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl btn-3d-dark text-[#9296A8] hover:text-rose-400 hover:border-rose-500/40 cursor-pointer"
              title="Log Out"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl btn-3d-dark text-[#C0C4D0]"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c0e18]/95 backdrop-blur-xl border-b border-[#1f233a] px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#171A2B] text-white border border-[#8B5CF6]/40 shadow-sm font-semibold'
                    : 'text-[#9296A8] hover:text-white hover:bg-[#111321]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#A78BFA]' : 'text-[#9296A8]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
