import React, { useState } from 'react';
import {
  User as UserIcon,
  Camera,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  Mail,
  Sparkles,
} from 'lucide-react';
import { EsportsCrosshair } from './EsportsIcons';
import { User, PlayerRole } from '../types';
import { api } from '../services/api';

interface ProfileViewProps {
  user: User;
  onProfileUpdated: (updatedUser: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onProfileUpdated }) => {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [ign, setIgn] = useState(user.ign || '');
  const [bio, setBio] = useState(user.bio || '');
  const [role, setRole] = useState<PlayerRole>(user.role || 'Rusher');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(user.bannerUrl || '');

  const [saving, setSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles: PlayerRole[] = ['Rusher', 'Sniper', 'IGL', 'Support', 'All-Rounder', 'Flanker'];

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Avatar size exceeds 8MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      alert('Banner size exceeds 12MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBannerUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(false);

    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    setSaving(true);
    try {
      const updated = await api.profile.update({
        fullName: fullName.trim(),
        ign: ign.trim() || undefined,
        bio: bio.trim() || undefined,
        role,
        avatarUrl: avatarUrl || undefined,
        bannerUrl: bannerUrl || undefined,
      });

      onProfileUpdated(updated);
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold font-heading text-white tracking-wide">
          PROFILE MANAGEMENT
        </h1>
        <p className="text-xs text-[#9296A8] mt-1 font-mono">
          Customize your personal Free Fire esports identity, battle tags, custom banners, and avatar.
        </p>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Profile changes saved successfully! Your records will persist across sessions.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 shadow-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3D Profile Card & Preview */}
      <div className="card-3d rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Banner Section */}
        <div className="h-44 sm:h-56 w-full relative bg-gradient-to-r from-[#1b1e35] via-[#241a42] to-[#121424] overflow-hidden">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Custom banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#9296A8]/40">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}

          {/* 3D Banner Upload Button Overlay */}
          <label className="absolute top-4 right-4 px-3 py-1.5 rounded-xl btn-3d-dark text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all">
            <Camera className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>Change Banner</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerFile}
              className="hidden"
            />
          </label>
        </div>

        {/* User Identity Info in Profile Header */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
            {/* 3D Avatar */}
            <div className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#08090F] p-1 border-2 border-[#8B5CF6]/60 shadow-[0_8px_25px_rgba(139,92,246,0.45)] shrink-0">
              <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#111321] flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-[#A78BFA]" />
                )}
              </div>
              <label
                className="absolute inset-1 rounded-[22px] bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-semibold cursor-pointer transition-opacity"
                title="Upload Avatar"
              >
                <Camera className="w-5 h-5 mb-1 text-[#A78BFA]" />
                <span>Change</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-[#111321] border border-[#1f233a] text-xs font-mono text-[#C0C4D0] flex items-center gap-1.5 shadow-inner">
                <EsportsCrosshair className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>Combat Role: <strong className="text-white">{role}</strong></span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#111321] border border-[#1f233a] text-xs font-mono text-[#9296A8] flex items-center gap-1.5 shadow-inner">
                <Mail className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>

          {/* Form for Editing */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1.5 font-mono">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Hunter"
                  className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none shadow-inner"
                />
              </div>

              {/* Free Fire IGN */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1.5 font-mono">
                  In-Game Name (IGN)
                </label>
                <input
                  type="text"
                  value={ign}
                  onChange={(e) => setIgn(e.target.value)}
                  placeholder="e.g. 亗 DESTROYER 亗"
                  className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none font-mono shadow-inner"
                />
              </div>
            </div>

            {/* Combat Role Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-2 font-mono">
                Combat Role / Specialization
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {roles.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer font-mono ${
                      role === r
                        ? 'btn-3d-purple text-white border-transparent'
                        : 'bg-[#111321] text-[#9296A8] border-[#1f233a] hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio / Motto */}
            <div>
              <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1.5 font-mono">
                Player Bio / Combat Note
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write your tournament background, weapon loadout preference, or personal motto..."
                className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none shadow-inner font-sans"
              />
            </div>

            {/* Image URL fallback inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1f233a]">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1 font-mono">
                  Custom Avatar Image URL (or upload above)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.example.com/avatar.png"
                  className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1 font-mono">
                  Custom Banner Image URL (or upload above)
                </label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://images.example.com/banner.png"
                  className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none shadow-inner"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl btn-3d-purple text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <span>Saving Changes...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
