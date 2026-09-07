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
import { BrandLogo } from '../common/BrandLogo';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const { user, logout, isManager } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/contacts', label: 'Contacts', icon: Users },
    { to: '/pipeline', label: 'Pipeline', icon: Kanban },
    { to: '/activities', label: 'Activities', icon: History },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/emails', label: 'Email Outreach', icon: Mail },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/imports', label: 'Data Import', icon: FileSpreadsheet },
    ...(isManager ? [{ to: '/audit', label: 'Audit Logs', icon: ShieldAlert }] : []),
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-[260px] shrink-0 bg-slate-950 border-r border-slate-800/50 flex flex-col justify-between h-screen sticky top-0 select-none z-20">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-slate-800/50">
          <BrandLogo size="md" showText={true} subtitle="ENTERPRISE SALES" />
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-12rem)] scrollbar-hide">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-slate-800/80 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("w-[18px] h-[18px] shrink-0 transition-transform", isActive ? "text-brand-400" : "group-hover:scale-105")} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Actions */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-950 space-y-3">
        {/* User Card */}
        <div className="flex items-center gap-3">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-medium text-sm text-slate-300">
              {user?.name?.slice(0, 2).toUpperCase() || '7B'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
