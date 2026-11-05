import React, { useState } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Eye,
  X,
  AlertCircle,
  Camera,
} from 'lucide-react';
import {
  EsportsTrophy,
  EsportsDefeat,
  EsportsScan,
} from './EsportsIcons';
import { MatchResult, MatchType, MatchResultStatus } from '../types';
import { api } from '../services/api';

interface MatchHistoryViewProps {
  results: MatchResult[];
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenOcrModal: () => void;
}

export const MatchHistoryView: React.FC<MatchHistoryViewProps> = ({
  results,
  onRefresh,
  onOpenAddModal,
  onOpenOcrModal,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | MatchType>('ALL');
  const [resultFilter, setResultFilter] = useState<'ALL' | MatchResultStatus>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [selectedResult, setSelectedResult] = useState<MatchResult | null>(null);
  const [editingResult, setEditingResult] = useState<MatchResult | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form state
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editType, setEditType] = useState<MatchType>('Squad');
  const [editResult, setEditResult] = useState<MatchResultStatus>('WIN');
  const [editPlacement, setEditPlacement] = useState<number | ''>('');
  const [editKills, setEditKills] = useState<number | ''>('');
  const [editDamage, setEditDamage] = useState<number | ''>('');
  const [editNotes, setEditNotes] = useState('');
  const [editScreenshot, setEditScreenshot] = useState<string>('');
  const [editEntryFee, setEditEntryFee] = useState<number | ''>('');
  const [editPrizeMoney, setEditPrizeMoney] = useState<number | ''>('');
  const [editError, setEditError] = useState<string | null>(null);

  const openEditModal = (r: MatchResult) => {
    setEditingResult(r);
    setEditDate(r.matchDate);
    setEditTime(r.matchTime || '');
    setEditType(r.matchType);
    setEditResult(r.result);
    setEditPlacement(r.placement !== undefined ? r.placement : '');
    setEditKills(r.kills !== undefined ? r.kills : '');
    setEditDamage(r.damage !== undefined ? r.damage : '');
    setEditEntryFee(r.entryFee !== undefined ? r.entryFee : '');
    setEditPrizeMoney(r.prizeMoney !== undefined ? r.prizeMoney : '');
    setEditNotes(r.notes || '');
    setEditScreenshot(r.screenshotUrl || '');
    setEditError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResult) return;

    if (!editDate) {
      setEditError('Match date is required.');
      return;
    }

    setActionLoading(true);
    try {
      await api.results.update(editingResult.id, {
        matchDate: editDate,
        matchTime: editTime || undefined,
        matchType: editType,
        result: editResult,
        placement: editPlacement !== '' ? Number(editPlacement) : undefined,
        kills: editKills !== '' ? Number(editKills) : undefined,
        damage: editDamage !== '' ? Number(editDamage) : undefined,
        entryFee: editEntryFee !== '' ? Math.max(0, Number(editEntryFee)) : undefined,
        prizeMoney: editPrizeMoney !== '' ? Math.max(0, Number(editPrizeMoney)) : undefined,
        notes: editNotes.trim() || undefined,
        screenshotUrl: editScreenshot || undefined,
      });

      setEditingResult(null);
      if (selectedResult?.id === editingResult.id) {
        setSelectedResult(null);
      }
      onRefresh();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update result');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(true);
    try {
      await api.results.delete(id);
      setDeletingId(null);
      if (selectedResult?.id === id) {
        setSelectedResult(null);
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete result');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Search application
  const filteredResults = results.filter((r) => {
    if (typeFilter !== 'ALL' && r.matchType !== typeFilter) return false;
    if (resultFilter !== 'ALL' && r.result !== resultFilter) return false;
    if (dateFilter && r.matchDate !== dateFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTypeMatch = r.matchType.toLowerCase().includes(term);
      const notesMatch = (r.notes || '').toLowerCase().includes(term);
      const dateMatch = r.matchDate.includes(term);
      const resultMatch = r.result.toLowerCase().includes(term);
      if (!matchTypeMatch && !notesMatch && !dateMatch && !resultMatch) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white tracking-wide">
            MATCH HISTORY
          </h1>
          <p className="text-xs text-[#9296A8] mt-1 font-mono">
            Complete archive of confirmed Free Fire battle records with manual & OCR verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenOcrModal}
            className="px-3.5 py-2 rounded-xl btn-3d-dark border border-[#8B5CF6]/40 text-[#A78BFA] hover:text-white font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            <EsportsScan className="w-4 h-4 text-[#A78BFA]" />
            <span>Scan Screenshot</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl btn-3d-purple text-white font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Result</span>
          </button>
        </div>
      </div>

      {/* 3D Search and Filters Bar */}
      <div className="card-3d rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9296A8]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by notes, type, date..."
              className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#505468] outline-none shadow-inner"
            />
          </div>

          {/* Match Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase font-semibold text-[#9296A8] whitespace-nowrap font-mono">
              Type:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-2.5 py-2 text-xs text-white outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="Solo">Solo</option>
              <option value="Duo">Duo</option>
              <option value="Squad">Squad</option>
            </select>
          </div>

          {/* Result Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase font-semibold text-[#9296A8] whitespace-nowrap font-mono">
              Outcome:
            </span>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as any)}
              className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-2.5 py-2 text-xs text-white outline-none"
            >
              <option value="ALL">All Outcomes</option>
              <option value="WIN">Booyah (WIN)</option>
              <option value="LOSS">Defeat (LOSS)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase font-semibold text-[#9296A8] whitespace-nowrap font-mono">
              Date:
            </span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-2.5 py-2 text-xs text-white outline-none"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="p-1 rounded text-[#9296A8] hover:text-white"
                title="Clear date"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary Tags */}
        {(typeFilter !== 'ALL' || resultFilter !== 'ALL' || dateFilter || searchTerm) && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#1f233a] text-xs">
            <span className="text-[#9296A8]">Active Filters:</span>
            <button
              onClick={() => {
                setTypeFilter('ALL');
                setResultFilter('ALL');
                setDateFilter('');
                setSearchTerm('');
              }}
              className="text-[#A78BFA] hover:text-white underline text-[11px] cursor-pointer"
            >
              Reset all filters
            </button>
            <span className="ml-auto text-[#9296A8] text-[11px] font-mono">
              Showing {filteredResults.length} of {results.length} matches
            </span>
          </div>
        )}
      </div>

      {/* 3D Results List */}
      {filteredResults.length > 0 ? (
        <div className="space-y-3">
          {filteredResults.map((item) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl card-3d flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                item.result === 'WIN'
                  ? 'border-emerald-500/25'
                  : 'border-rose-500/25'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                    item.result === 'WIN'
                      ? 'icon-badge-3d-emerald text-emerald-400'
                      : 'icon-badge-3d-rose text-rose-400'
                  }`}
                >
                  {item.result === 'WIN' ? (
                    <EsportsTrophy className="w-5 h-5" />
                  ) : (
                    <EsportsDefeat className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-extrabold font-heading ${
                        item.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.result === 'WIN' ? 'BOOYAH!' : 'DEFEAT'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono bg-[#111321] text-[#A78BFA] border border-[#1f233a]">
                      {item.matchType}
                    </span>
                    {item.placement && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono bg-[#111321] text-white border border-[#1f233a]">
                        Rank #{item.placement}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#9296A8] flex items-center gap-2 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" />
                    <span>{item.matchDate}</span>
                    {item.matchTime && (
                      <>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
                        <span>{item.matchTime} IST</span>
                      </>
                    )}
                  </p>

                  {/* Kills and Damage tags */}
                  <div className="flex items-center gap-3 text-xs pt-0.5">
                    {item.kills !== undefined && item.kills !== null && (
                      <span className="text-[#C0C4D0]">
                        Kills: <strong className="text-white font-mono">{item.kills}</strong>
                      </span>
                    )}
                    {item.damage !== undefined && item.damage !== null && (
                      <span className="text-[#C0C4D0]">
                        Damage: <strong className="text-white font-mono">{item.damage}</strong>
                      </span>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-[#9296A8] line-clamp-1 italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Screenshot preview badge & Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {item.screenshotUrl && (
                  <button
                    onClick={() => setSelectedResult(item)}
                    className="p-2 rounded-xl btn-3d-dark text-[#A78BFA] cursor-pointer"
                    title="View Scoreboard Screenshot"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => setSelectedResult(item)}
                  className="px-3.5 py-1.5 rounded-xl btn-3d-dark text-xs font-semibold text-[#C0C4D0] hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 rounded-xl btn-3d-dark text-[#9296A8] hover:text-white cursor-pointer"
                  title="Edit Result"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingId(item.id)}
                  className="p-2 rounded-xl btn-3d-dark text-[#9296A8] hover:text-rose-400 hover:border-rose-500/40 cursor-pointer"
                  title="Delete Result"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 card-3d rounded-2xl border-dashed">
          <EsportsTrophy className="w-12 h-12 text-[#9296A8]/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Match Records Found</h3>
          <p className="text-xs text-[#9296A8] mt-1 max-w-sm mx-auto">
            {results.length === 0
              ? 'Your match history is currently empty. Record your first Free Fire battle manually or scan a scorecard screenshot.'
              : 'No match records match your current search and filter criteria.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl btn-3d-purple text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Manual Result</span>
            </button>
            <button
              onClick={onOpenOcrModal}
              className="px-4 py-2 rounded-xl btn-3d-dark text-[#A78BFA] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <EsportsScan className="w-4 h-4 text-[#A78BFA]" />
              <span>Scan Screenshot</span>
            </button>
          </div>
        </div>
      )}

      {/* RESULT DETAILS MODAL */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d rounded-2xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedResult(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#9296A8] hover:text-white hover:bg-[#111321]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span
                className={`px-3 py-1 rounded-md text-xs font-extrabold uppercase font-mono ${
                  selectedResult.result === 'WIN'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {selectedResult.result === 'WIN' ? 'BOOYAH! (WIN)' : 'DEFEAT (LOSS)'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#111321] text-[#A78BFA] text-xs font-bold uppercase font-mono border border-[#1f233a]">
                {selectedResult.matchType}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-4 font-heading">Match Record Details</h2>

            <div className="space-y-3 py-3 border-y border-[#1f233a] text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#9296A8]">Date:</span>
                <span className="text-white font-semibold">{selectedResult.matchDate}</span>
              </div>
              {selectedResult.matchTime && (
                <div className="flex justify-between">
                  <span className="text-[#9296A8]">Time (IST):</span>
                  <span className="text-white font-semibold">{selectedResult.matchTime} IST</span>
                </div>
              )}
              {selectedResult.placement && (
                <div className="flex justify-between">
                  <span className="text-[#9296A8]">Final Placement / Rank:</span>
                  <span className="text-white font-semibold">#{selectedResult.placement}</span>
                </div>
              )}
              {selectedResult.kills !== undefined && selectedResult.kills !== null && (
                <div className="flex justify-between">
                  <span className="text-[#9296A8]">Total Kills:</span>
                  <span className="text-white font-semibold">{selectedResult.kills}</span>
                </div>
              )}
              {selectedResult.damage !== undefined && selectedResult.damage !== null && (
                <div className="flex justify-between">
                  <span className="text-[#9296A8]">Total Damage:</span>
                  <span className="text-white font-semibold">{selectedResult.damage}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#1f233a]">
                <span className="text-[#9296A8]">Entry Fee:</span>
                <span className="text-white font-semibold">₹{selectedResult.entryFee || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9296A8]">Prize Won:</span>
                <span className="text-emerald-400 font-semibold">₹{selectedResult.prizeMoney || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9296A8]">Net Profit/Loss:</span>
                <span
                  className={`font-bold ${
                    (selectedResult.prizeMoney || 0) - (selectedResult.entryFee || 0) - (selectedResult.extraExpenses || 0) > 0
                      ? 'text-emerald-400'
                      : (selectedResult.prizeMoney || 0) - (selectedResult.entryFee || 0) - (selectedResult.extraExpenses || 0) < 0
                      ? 'text-rose-400'
                      : 'text-[#C0C4D0]'
                  }`}
                >
                  {(selectedResult.prizeMoney || 0) - (selectedResult.entryFee || 0) - (selectedResult.extraExpenses || 0) > 0 ? '+' : ''}
                  ₹{(selectedResult.prizeMoney || 0) - (selectedResult.entryFee || 0) - (selectedResult.extraExpenses || 0)}
                </span>
              </div>
              {selectedResult.notes && (
                <div className="pt-2 border-t border-[#1f233a]/60">
                  <span className="text-[#9296A8] block mb-1">Notes:</span>
                  <p className="text-[#C0C4D0] bg-[#111321] p-3 rounded-xl font-sans">{selectedResult.notes}</p>
                </div>
              )}
            </div>

            {/* Scoreboard Screenshot Preview if available */}
            {selectedResult.screenshotUrl && (
              <div className="my-4">
                <span className="text-xs font-semibold uppercase text-[#9296A8] block mb-2 font-mono">
                  Scorecard Screenshot:
                </span>
                <div className="rounded-xl overflow-hidden border border-[#1f233a] max-h-56 bg-black shadow-inner">
                  <img
                    src={selectedResult.screenshotUrl}
                    alt="Scoreboard"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const r = selectedResult;
                  setSelectedResult(null);
                  openEditModal(r);
                }}
                className="px-4 py-2 rounded-xl btn-3d-dark text-[#C0C4D0] hover:text-white text-xs font-semibold cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 rounded-xl btn-3d-purple text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d rounded-2xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingResult(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#9296A8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4 font-heading">Edit Match Result</h2>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Outcome: WIN / LOSS */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1.5">
                  Result Outcome *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditResult('WIN')}
                    className={`py-2.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      editResult === 'WIN'
                        ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'bg-[#111321] text-[#9296A8] border border-[#1f233a]'
                    }`}
                  >
                    Booyah! (WIN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditResult('LOSS')}
                    className={`py-2.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      editResult === 'LOSS'
                        ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                        : 'bg-[#111321] text-[#9296A8] border border-[#1f233a]'
                    }`}
                  >
                    Defeat (LOSS)
                  </button>
                </div>
              </div>

              {/* Date & Time */}
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
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
                    Time (IST)
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
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
                          : 'bg-[#111321] text-[#9296A8] border-[#1f233a]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats: Placement, Kills, Damage */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                    Rank/Place
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editPlacement}
                    onChange={(e) => setEditPlacement(e.target.value ? Number(e.target.value) : '')}
                    placeholder="1"
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                    Kills
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editKills}
                    onChange={(e) => setEditKills(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                    Damage
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editDamage}
                    onChange={(e) => setEditDamage(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Financials: Entry Fee & Prize Money */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#111321] border border-[#1f233a]">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                    Entry Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editEntryFee}
                    onChange={(e) => setEditEntryFee(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                    Prize Won (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editPrizeMoney}
                    onChange={(e) => setEditPrizeMoney(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
                  Optional Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Zone rotation worked great, clutched 1v2"
                  className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingResult(null)}
                  className="px-4 py-2 rounded-xl btn-3d-dark text-[#9296A8] hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl btn-3d-purple text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d border-rose-500/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white font-heading">Delete Match Record?</h3>
            <p className="text-xs text-[#9296A8] mt-1 mb-5">
              This will remove this result from your stats and update the performance graph.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl btn-3d-dark text-[#9296A8] hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
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
