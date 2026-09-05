import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  History,
  CheckSquare,
  Calendar,
  Mail,
  BarChart3,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../stores/auth';
import { useTheme } from '../../stores/theme';
import { cn } from '../../lib/utils';
import { Badge } from '../common/Badge';

export const Sidebar: React.FC = () => {
  const { user, logout, isManager, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/contacts', label: 'Contacts', icon: Users },
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/pipeline', label: 'Pipeline', icon: Kanban },
    { to: '/activities', label: 'Activities', icon: History },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/emails', label: 'Email Outreach', icon: Mail },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/imports', label: 'Excel Import', icon: FileSpreadsheet },
    ...(isManager ? [{ to: '/audit', label: 'Audit Logs', icon: ShieldAlert }] : []),
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 select-none z-20">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white shadow-md shadow-brand-600/30">
            7B
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-slate-100 uppercase">
              7BLOCKS CRM
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              ENTERPRISE SALES
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group',
                    isActive
                      ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Actions */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 space-y-2">
        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 border border-slate-800">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-xs text-slate-200">
              {user?.name?.slice(0, 2).toUpperCase() || '7B'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant={user?.role === 'ADMIN' ? 'danger' : user?.role === 'MANAGER' ? 'warning' : 'info'} size="sm">
                {user?.role?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="capitalize">{theme} Mode</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded-md hover:bg-rose-950/30 transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
