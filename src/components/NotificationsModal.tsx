import React from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppNotification } from '../types';
import { api } from '../services/api';

interface NotificationsModalProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  isOpen,
  onClose,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markRead();
      onRefresh();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    try {
      await api.notifications.clear();
      onRefresh();
    } catch (err: any) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card-3d max-w-md w-full max-h-[85vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#1f233a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="icon-badge-3d-purple">
              <Bell className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-heading tracking-wide">
                In-App Notifications
              </h2>
              <p className="text-[11px] text-[#9296A8]">
                {unreadCount} unread • Match schedules & reminders in IST
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

        {/* Action Bar */}
        <div className="px-5 py-2.5 bg-[#111321] border-b border-[#1f233a] flex items-center justify-between text-xs">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="text-[#A78BFA] hover:text-white flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="text-[#9296A8] hover:text-rose-400 flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear list</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  notif.read
                    ? 'bg-[#111321]/60 border-[#1f233a] text-[#9296A8]'
                    : 'bg-[#111321] border-[#8B5CF6]/50 text-white shadow-[0_4px_16px_rgba(139,92,246,0.15)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {notif.type === 'schedule' ? (
                      <Calendar className="w-4 h-4 text-[#A78BFA]" />
                    ) : notif.type === 'reminder' ? (
                      <Clock className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#C0C4D0] leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-[#9296A8] font-mono pt-0.5">
                      {new Date(notif.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-[#9296A8]">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold text-white">No notifications</p>
              <p className="text-[11px] mt-0.5">You are all caught up.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#111321] border-t border-[#1f233a] flex justify-end">
          <button
            onClick={onClose}
            className="btn-3d-dark px-4 py-1.5 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
