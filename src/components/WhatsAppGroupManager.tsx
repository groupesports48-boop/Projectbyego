import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Copy,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { WhatsAppGroup } from '../types';
import { api } from '../services/api';
import { EsportsWhatsApp } from './EsportsIcons';

interface WhatsAppGroupManagerProps {
  groups: WhatsAppGroup[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const WhatsAppGroupManager: React.FC<WhatsAppGroupManagerProps> = ({
  groups,
  isOpen,
  onClose,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingGroup, setEditingGroup] = useState<WhatsAppGroup | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editNote, setEditNote] = useState('');

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = (id: string, groupUrl: string) => {
    navigator.clipboard.writeText(groupUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !url.trim()) {
      setError('Group name and valid WhatsApp URL are required.');
      return;
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      new URL(formattedUrl);
    } catch {
      setError('Please provide a valid URL (e.g., https://chat.whatsapp.com/...)');
      return;
    }

    setLoading(true);
    try {
      await api.whatsapp.create({
        name: name.trim(),
        url: formattedUrl,
        note: note.trim() || undefined,
      });

      setName('');
      setUrl('');
      setNote('');
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to save WhatsApp group link.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (g: WhatsAppGroup) => {
    setEditingGroup(g);
    setEditName(g.name);
    setEditUrl(g.url);
    setEditNote(g.note || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    let formattedUrl = editUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      new URL(formattedUrl);
    } catch {
      alert('Invalid URL format.');
    }

    setLoading(true);
    try {
      await api.whatsapp.update(editingGroup.id, {
        name: editName.trim(),
        url: formattedUrl,
        note: editNote.trim() || undefined,
      });

      setEditingGroup(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update WhatsApp group.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this WhatsApp group?')) return;
    try {
      await api.whatsapp.delete(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete group');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card-3d max-w-2xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#1f233a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-badge-3d-emerald">
              <EsportsWhatsApp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-heading tracking-wide">
                WhatsApp Group Management
              </h2>
              <p className="text-xs text-[#9296A8]">
                Store, edit, and link official WhatsApp tournament and scrim groups.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9296A8] hover:text-white hover:bg-[#111321] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Add New Group Form */}
          <div className="p-4 rounded-xl bg-[#111321] border border-[#1f233a]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#C0C4D0] mb-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add New WhatsApp Group Link</span>
            </h3>

            {error && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Squad Scrims Lobby A"
                    className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                    WhatsApp Link *
                  </label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                  Optional Note
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Scrim schedule drops at 6:30 PM"
                  className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Group Link</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Groups List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9296A8] mb-3">
              Saved WhatsApp Groups ({groups.length})
            </h3>

            {groups.length > 0 ? (
              <div className="space-y-3">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-xl bg-[#111321] border border-[#1f233a] hover:border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:translate-y-[-1px] shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <EsportsWhatsApp className="w-4 h-4 text-emerald-400 shrink-0" />
                        <h4 className="text-sm font-bold text-white">{g.name}</h4>
                      </div>
                      <p className="text-xs text-[#9296A8] font-mono truncate max-w-sm">
                        {g.url}
                      </p>
                      {g.note && (
                        <p className="text-[11px] text-[#C0C4D0] italic">
                          Note: {g.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleCopyUrl(g.id, g.url)}
                        className="p-2 rounded-lg bg-[#171A2B] text-[#9296A8] hover:text-white border border-[#1f233a] transition-all hover:scale-105 active:scale-95"
                        title="Copy link"
                      >
                        {copiedId === g.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleStartEdit(g)}
                        className="p-2 rounded-lg bg-[#171A2B] text-[#9296A8] hover:text-white border border-[#1f233a] transition-all hover:scale-105 active:scale-95"
                        title="Edit group"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="p-2 rounded-lg bg-[#171A2B] text-[#9296A8] hover:text-red-400 border border-[#1f233a] transition-all hover:scale-105 active:scale-95"
                        title="Delete group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={g.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all hover:translate-y-[-1px]"
                      >
                        <span>Join</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 rounded-xl bg-[#111321] border border-dashed border-[#1f233a] text-xs text-[#9296A8]">
                No WhatsApp groups saved yet. Add one above to link it to your Free Fire matches.
              </div>
            )}
          </div>
        </div>

        {/* Edit Group Inline Modal / Overlay */}
        {editingGroup && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm p-6 flex flex-col justify-center z-20">
            <div className="card-3d border border-emerald-500/40 p-5 max-w-md mx-auto w-full">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span>Edit WhatsApp Group Link</span>
              </h3>
              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    required
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                    Note
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingGroup(null)}
                    className="btn-3d-dark px-3 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-[#111321] border-t border-[#1f233a] flex justify-end">
          <button
            onClick={onClose}
            className="btn-3d-dark px-5 py-2 text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
