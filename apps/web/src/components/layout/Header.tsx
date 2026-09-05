import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, Check, Phone, UserPlus, Briefcase, CheckSquare, ExternalLink } from 'lucide-react';
import { useAuth } from '../../stores/auth';
import { api } from '../../lib/api';
import { Badge } from '../common/Badge';

interface HeaderProps {
  onOpenCommandBar: () => void;
  onOpenQuickCreate: (type: 'contact' | 'call' | 'deal' | 'task') => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommandBar,
  onOpenQuickCreate,
  title
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const d = res.data?.data;
      const notifs = Array.isArray(d) ? d : Array.isArray(d?.notifications) ? d.notifications : [];
      setNotifications(notifs);
      setUnreadCount(typeof d?.unreadCount === 'number' ? d.unreadCount : notifs.filter((n: any) => !n.isRead).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 px-8 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
      {/* Title / Breadcrumb */}
      <div>
        <h2 className="text-base font-semibold text-slate-100">{title || 'Command Center'}</h2>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-3">
        {/* Global Search Button */}
        <button
          onClick={onOpenCommandBar}
          className="flex items-center gap-3 px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-400 text-xs transition-all w-64 shadow-inner"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span className="flex-1 text-left">Search CRM...</span>
          <span className="font-mono text-[10px] bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60">
            ⌘K
          </span>
        </button>

        {/* Quick Create Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>

          {showQuickMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowQuickMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1 z-30 text-xs animate-in zoom-in-95">
                <button
                  onClick={() => { setShowQuickMenu(false); onOpenQuickCreate('call'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                >
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Log Call</span>
                </button>
                <button
                  onClick={() => { setShowQuickMenu(false); onOpenQuickCreate('contact'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>New Contact</span>
                </button>
                <button
                  onClick={() => { setShowQuickMenu(false); onOpenQuickCreate('deal'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Deal</span>
                </button>
                <button
                  onClick={() => { setShowQuickMenu(false); onOpenQuickCreate('task'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>New Task</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-800 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-30 text-xs animate-in zoom-in-95">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/90">
                  <span className="font-semibold text-slate-200">Notifications ({unreadCount})</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-brand-400 hover:text-brand-300"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {!Array.isArray(notifications) || notifications.length === 0 ? (
                    <p className="p-4 text-center text-slate-500">No notifications.</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-3 transition-colors ${n.isRead ? 'opacity-60 hover:opacity-100' : 'bg-brand-950/20'}`}
                      >
                        <p className="font-semibold text-slate-200">{n.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
