import React, { useState, useEffect, useCallback } from 'react';
import { User, MatchSchedule, WhatsAppGroup, MatchResult, AppNotification } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { MatchPlannerView } from './components/MatchPlannerView';
import { MatchHistoryView } from './components/MatchHistoryView';
import { ProfitLossView } from './components/ProfitLossView';
import { AnalyticsView } from './components/AnalyticsView';
import { WhatsAppGroupManager } from './components/WhatsAppGroupManager';
import { ProfileView } from './components/ProfileView';
import { CreateMatchModal } from './components/CreateMatchModal';
import { AddResultModal } from './components/AddResultModal';
import { ScreenshotOcrModal } from './components/ScreenshotOcrModal';
import { NotificationsModal } from './components/NotificationsModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // App Data
  const [matches, setMatches] = useState<MatchSchedule[]>([]);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals
  const [createMatchOpen, setCreateMatchOpen] = useState(false);
  const [addResultOpen, setAddResultOpen] = useState(false);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [whatsappManagerOpen, setWhatsappManagerOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  // Load Current User on Mount
  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }

    api.auth
      .me()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        api.clearToken();
        setUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  // Fetch all user-specific data
  const loadAllData = useCallback(async () => {
    if (!user) return;
    try {
      const [mList, gList, rList, nList] = await Promise.all([
        api.matches.list(),
        api.whatsapp.list(),
        api.results.list(),
        api.notifications.list(),
      ]);

      setMatches(mList || []);
      setGroups(gList || []);
      setResults(rList || []);
      setNotifications(nList || []);
    } catch (err) {
      console.error('Error loading esports data:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
    setMatches([]);
    setGroups([]);
    setResults([]);
    setNotifications([]);
    setActiveTab('dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08090F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6] rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-[#9296A8] font-mono">
            Loading DESTROYED eSports...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />;
  }

  return (
    <div className="min-h-screen bg-[#08090F] text-white flex flex-col font-sans pb-16 md:pb-0">
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            user={user}
            matches={matches}
            results={results}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenCreateMatch={() => setCreateMatchOpen(true)}
            onOpenAddResult={() => setAddResultOpen(true)}
            onOpenOcr={() => setOcrModalOpen(true)}
            onSelectMatch={() => setActiveTab('planner')}
          />
        )}

        {activeTab === 'planner' && (
          <MatchPlannerView
            matches={matches}
            groups={groups}
            onRefresh={loadAllData}
            onOpenCreateModal={() => setCreateMatchOpen(true)}
            onOpenWhatsAppManager={() => setWhatsappManagerOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <MatchHistoryView
            results={results}
            onRefresh={loadAllData}
            onOpenAddModal={() => setAddResultOpen(true)}
            onOpenOcrModal={() => setOcrModalOpen(true)}
          />
        )}

        {activeTab === 'profit-loss' && (
          <ProfitLossView
            results={results}
            onRefresh={loadAllData}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            results={results}
            onOpenAddModal={() => setAddResultOpen(true)}
            onOpenOcrModal={() => setOcrModalOpen(true)}
          />
        )}

        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold font-heading text-white">
                  WHATSAPP SCRIM GROUPS
                </h1>
                <p className="text-xs text-[#9296A8] mt-1">
                  Manage official Free Fire scrim, lobby, and guild tournament WhatsApp groups.
                </p>
              </div>
              <button
                onClick={() => setWhatsappManagerOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                + Add / Manage Links
              </button>
            </div>

            <div className="bg-[#171A2B] border border-[#1f233a] rounded-2xl p-6">
              {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map((g) => (
                    <div
                      key={g.id}
                      className="p-4 rounded-xl bg-[#111321] border border-[#1f233a] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-white">{g.name}</h3>
                        <p className="text-xs text-[#9296A8] font-mono truncate mt-0.5">{g.url}</p>
                        {g.note && (
                          <p className="text-[11px] text-[#C0C4D0] italic mt-1">{g.note}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#1f233a]">
                        <span className="text-[10px] text-[#9296A8] font-mono">
                          Saved: {new Date(g.createdAt).toLocaleDateString()}
                        </span>
                        <a
                          href={g.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <span>Open Group</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#9296A8]">
                  <p className="text-sm font-semibold text-white">No WhatsApp groups saved</p>
                  <p className="text-xs mt-1">
                    Add group invite links to easily assign them to your upcoming matches.
                  </p>
                  <button
                    onClick={() => setWhatsappManagerOpen(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-semibold cursor-pointer"
                  >
                    Add WhatsApp Group
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            onProfileUpdated={(updated) => setUser(updated)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MODALS */}
      <CreateMatchModal
        groups={groups}
        isOpen={createMatchOpen}
        onClose={() => setCreateMatchOpen(false)}
        onMatchCreated={loadAllData}
      />

      <AddResultModal
        isOpen={addResultOpen}
        onClose={() => setAddResultOpen(false)}
        onResultAdded={loadAllData}
      />

      <ScreenshotOcrModal
        isOpen={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
        onResultSaved={loadAllData}
      />

      <WhatsAppGroupManager
        groups={groups}
        isOpen={whatsappManagerOpen}
        onClose={() => setWhatsappManagerOpen(false)}
        onRefresh={loadAllData}
      />

      <NotificationsModal
        notifications={notifications}
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        onRefresh={loadAllData}
      />
    </div>
  );
}
