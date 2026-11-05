import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle,
  Eye,
  AlertCircle,
  X,
  Timer,
} from 'lucide-react';
import {
  EsportsWhatsApp,
  EsportsSwords,
} from './EsportsIcons';
import { MatchSchedule, MatchType, WhatsAppGroup } from '../types';
import { getMatchCountdown, isTodayIST, isTomorrowIST } from '../utils/analytics';
import { api } from '../services/api';

interface MatchPlannerViewProps {
  matches: MatchSchedule[];
  groups: WhatsAppGroup[];
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onOpenWhatsAppManager: () => void;
}

export const MatchPlannerView: React.FC<MatchPlannerViewProps> = ({
  matches,
  groups,
  onRefresh,
  onOpenCreateModal,
  onOpenWhatsAppManager,
}) => {
  const [filterTab, setFilterTab] = useState<'today' | 'tomorrow' | 'upcoming' | 'completed'>('today');
  const [selectedMatch, setSelectedMatch] = useState<MatchSchedule | null>(null);
  const [editingMatch, setEditingMatch] = useState<MatchSchedule | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit modal form states (strictly requested: Name optional, Date, Time, Type + WhatsApp group assignment)
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editType, setEditType] = useState<MatchType>('Squad');
  const [editGroupId, setEditGroupId] = useState('');
  const [editCustomUrl, setEditCustomUrl] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Live countdown ticker
  const [, setTicker] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTicker((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const openEditModal = (m: MatchSchedule) => {
    setEditingMatch(m);
    setEditName(m.name || '');
    setEditDate(m.matchDate);
    setEditTime(m.matchTime);
    setEditType(m.matchType);
    setEditGroupId(m.whatsappGroupId || '');
    setEditCustomUrl(m.whatsappUrl || '');
    setEditError(null);
  };

  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    if (!editDate || !editTime) {
      setEditError('Match Date and Time (IST) are required.');
      return;
    }

    // Determine final WhatsApp group URL
    let finalUrl = editCustomUrl.trim();
    if (editGroupId) {
      const g = groups.find((grp) => grp.id === editGroupId);
      if (g) finalUrl = g.url;
    }

    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    setActionLoading(true);
    try {
      await api.matches.update(editingMatch.id, {
        name: editName.trim() || undefined,
        matchDate: editDate,
        matchTime: editTime,
        matchType: editType,
        whatsappGroupId: editGroupId || undefined,
        whatsappUrl: finalUrl || undefined,
      });
      setEditingMatch(null);
      if (selectedMatch?.id === editingMatch.id) {
        setSelectedMatch(null);
      }
      onRefresh();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update match');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    setActionLoading(true);
    try {
      await api.matches.delete(id);
      setDeletingId(null);
      if (selectedMatch?.id === id) {
        setSelectedMatch(null);
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete match');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleComplete = async (m: MatchSchedule) => {
    setActionLoading(true);
    try {
      await api.matches.update(m.id, { isCompleted: !m.isCompleted });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logic
  const filteredMatches = matches.filter((m) => {
    if (filterTab === 'completed') {
      return m.isCompleted;
    }
    if (m.isCompleted) return false;

    if (filterTab === 'today') {
      return isTodayIST(m.matchDate);
    }
    if (filterTab === 'tomorrow') {
      return isTomorrowIST(m.matchDate);
    }
    if (filterTab === 'upcoming') {
      return true; // All non-completed matches
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & 3D Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white tracking-wide">
            MATCH PLANNER
          </h1>
          <p className="text-xs text-[#9296A8] mt-1 font-mono">
            Indian Standard Time (IST) • Live Countdown Active
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenWhatsAppManager}
            className="px-3.5 py-2 rounded-xl btn-3d-dark text-emerald-400 font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            <EsportsWhatsApp className="w-4 h-4 text-emerald-400" />
            <span>Manage WhatsApp Links</span>
          </button>
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-xl btn-3d-purple text-white font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Plan New Match</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[#171A2B] border border-[#1f233a] rounded-2xl shadow-inner overflow-x-auto">
        <button
          onClick={() => setFilterTab('today')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filterTab === 'today'
              ? 'btn-3d-purple text-white'
              : 'text-[#9296A8] hover:text-white hover:bg-[#111321]'
          }`}
        >
          Today's Matches ({matches.filter((m) => !m.isCompleted && isTodayIST(m.matchDate)).length})
        </button>
        <button
          onClick={() => setFilterTab('tomorrow')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filterTab === 'tomorrow'
              ? 'btn-3d-purple text-white'
              : 'text-[#9296A8] hover:text-white hover:bg-[#111321]'
          }`}
        >
          Tomorrow ({matches.filter((m) => !m.isCompleted && isTomorrowIST(m.matchDate)).length})
        </button>
        <button
          onClick={() => setFilterTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filterTab === 'upcoming'
              ? 'btn-3d-purple text-white'
              : 'text-[#9296A8] hover:text-white hover:bg-[#111321]'
          }`}
        >
          All Upcoming ({matches.filter((m) => !m.isCompleted).length})
        </button>
        <button
          onClick={() => setFilterTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filterTab === 'completed'
              ? 'btn-3d-purple text-white'
              : 'text-[#9296A8] hover:text-white hover:bg-[#111321]'
          }`}
        >
          Completed ({matches.filter((m) => m.isCompleted).length})
        </button>
      </div>

      {/* 3D Match Cards Grid */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((match) => {
            const countdown = getMatchCountdown(match.matchDate, match.matchTime);

            return (
              <div
                key={match.id}
                className={`card-3d rounded-2xl p-5 flex flex-col justify-between relative group ${
                  match.isCompleted
                    ? 'opacity-80 border-[#1f233a]'
                    : ''
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider font-mono bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30 shadow-sm">
                      {match.matchType}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(match)}
                        className="p-1.5 rounded-lg text-[#9296A8] hover:text-white hover:bg-[#111321] transition-colors"
                        title="Edit Match"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(match.id)}
                        className="p-1.5 rounded-lg text-[#9296A8] hover:text-rose-400 hover:bg-[#111321] transition-colors"
                        title="Delete Match"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Match Name and Click to View Details */}
                  <div
                    onClick={() => setSelectedMatch(match)}
                    className="cursor-pointer"
                  >
                    <h3 className="text-base font-bold text-white group-hover:text-[#A78BFA] transition-colors line-clamp-1 font-heading">
                      {match.name || `${match.matchType} Free Fire Scrim`}
                    </h3>
                    <p className="text-xs text-[#9296A8] mt-1.5 flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>{match.matchDate}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>{match.matchTime} IST</span>
                    </p>
                  </div>

                  {/* 3D Countdown Timer */}
                  {!match.isCompleted && (
                    <div className="mt-4 p-3 rounded-xl bg-[#111321] border border-[#1f233a] shadow-inner">
                      <div className="flex items-center justify-between text-[11px] text-[#9296A8] mb-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 text-[#A78BFA]" />
                          <span>Countdown:</span>
                        </span>
                        <span
                          className={`font-bold ${
                            countdown.isPast ? 'text-amber-400' : 'text-[#A78BFA] text-glow'
                          }`}
                        >
                          {countdown.formatted}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: WhatsApp Group & Actions */}
                <div className="mt-5 pt-4 border-t border-[#1f233a] flex flex-col gap-2.5">
                  {match.whatsappUrl ? (
                    <a
                      href={match.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <EsportsWhatsApp className="w-4 h-4 text-emerald-400" />
                      <span>Join WhatsApp Group</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                    </a>
                  ) : (
                    <div className="text-[11px] text-[#9296A8] italic text-center py-1">
                      No WhatsApp group assigned
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedMatch(match)}
                      className="px-3 py-1.5 rounded-xl btn-3d-dark text-xs font-semibold text-[#C0C4D0] hover:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => handleToggleComplete(match)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        match.isCompleted
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{match.isCompleted ? 'Mark Active' : 'Mark Done'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 card-3d rounded-2xl border-dashed">
          <Calendar className="w-12 h-12 text-[#9296A8]/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No matches found in this view</h3>
          <p className="text-xs text-[#9296A8] mt-1 max-w-sm mx-auto">
            {filterTab === 'today'
              ? 'No matches scheduled for today (IST). Schedule a match to get ready.'
              : filterTab === 'tomorrow'
              ? 'No matches scheduled for tomorrow (IST).'
              : filterTab === 'completed'
              ? 'No completed matches yet. Mark scheduled matches complete as you finish them.'
              : 'You have not scheduled any upcoming matches yet.'}
          </p>
          <button
            onClick={onOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-3d-purple text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Match Now</span>
          </button>
        </div>
      )}

      {/* MATCH DETAILS MODAL (3D Glassmorphism) */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#9296A8] hover:text-white hover:bg-[#111321]"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-1 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] text-xs font-bold uppercase font-mono border border-[#8B5CF6]/30">
                {selectedMatch.matchType}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono ${
                  selectedMatch.isCompleted
                    ? 'bg-zinc-800 text-zinc-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {selectedMatch.isCompleted ? 'Completed' : 'Upcoming'}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2 font-heading">
              {selectedMatch.name || `${selectedMatch.matchType} Free Fire Scrim`}
            </h2>

            <div className="space-y-3 py-3 border-y border-[#1f233a] my-4 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#9296A8]">Match Date:</span>
                <span className="text-white font-semibold">{selectedMatch.matchDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9296A8]">Match Time (IST):</span>
                <span className="text-white font-semibold">{selectedMatch.matchTime} IST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9296A8]">Match Type:</span>
                <span className="text-white font-semibold">{selectedMatch.matchType}</span>
              </div>
              {selectedMatch.notes && (
                <div className="pt-2 border-t border-[#1f233a]/60">
                  <span className="text-[#9296A8] block mb-1">Notes:</span>
                  <p className="text-[#C0C4D0] bg-[#111321] p-2.5 rounded-xl font-sans">{selectedMatch.notes}</p>
                </div>
              )}
            </div>

            {/* WhatsApp Group in Details */}
            {selectedMatch.whatsappUrl ? (
              <a
                href={selectedMatch.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md mb-4"
              >
                <EsportsWhatsApp className="w-4 h-4" />
                <span>Join Match WhatsApp Group</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <p className="text-xs text-[#9296A8] italic text-center mb-4">
                No WhatsApp group link attached to this match.
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  const m = selectedMatch;
                  setSelectedMatch(null);
                  openEditModal(m);
                }}
                className="px-4 py-2 rounded-xl btn-3d-dark text-[#C0C4D0] hover:text-white text-xs font-semibold cursor-pointer"
              >
                Edit Match
              </button>
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 rounded-xl btn-3d-purple text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MATCH MODAL */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingMatch(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#9296A8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4 font-heading">Edit Scheduled Match</h2>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateMatch} className="space-y-4">
              {/* Match Name (Optional) */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
                  Match Name <span className="text-[#9296A8] lowercase font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Scrims Round 1"
                  className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              {/* Match Date & Time (IST) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
                    Match Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
                    Time (IST) *
                  </label>
                  <input
                    type="time"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>

              {/* Match Type */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
                  Match Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Solo', 'Duo', 'Squad'] as MatchType[]).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setEditType(type)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        editType === type
                          ? 'btn-3d-purple text-white border-transparent'
                          : 'bg-[#111321] text-[#9296A8] border-[#1f233a] hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Group Assignment */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
                  WhatsApp Group Link <span className="text-[#9296A8] lowercase font-normal">(optional)</span>
                </label>
                {groups.length > 0 && (
                  <select
                    value={editGroupId}
                    onChange={(e) => {
                      setEditGroupId(e.target.value);
                      if (e.target.value) {
                        const g = groups.find((grp) => grp.id === e.target.value);
                        if (g) setEditCustomUrl(g.url);
                      }
                    }}
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none mb-2"
                  >
                    <option value="">-- Select Saved WhatsApp Group --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="url"
                  value={editCustomUrl}
                  onChange={(e) => setEditCustomUrl(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="px-4 py-2 rounded-xl btn-3d-dark text-[#9296A8] hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl btn-3d-purple text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d border-red-500/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white font-heading">Delete Scheduled Match?</h3>
            <p className="text-xs text-[#9296A8] mt-1 mb-5">
              This action cannot be undone. Are you sure you want to remove this match schedule?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl btn-3d-dark text-[#9296A8] hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMatch(deletingId)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-md"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
