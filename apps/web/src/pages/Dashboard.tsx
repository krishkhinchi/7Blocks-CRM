import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Phone,
  Mail,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckSquare,
  ArrowUpRight,
  UserCheck,
  Building2,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../stores/auth';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { Badge } from '../components/common/Badge';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'today' | '7days' | '30days' | '90days'>('30days');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, [timeframe]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard?timeframe=${timeframe}`);
      setData(res.data?.data || null);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-28 bg-slate-900/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-slate-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const kpi = data?.kpi || {};
  const stageCounts = data?.stageCounts || {};
  const funnel = Array.isArray(data?.funnel) ? data.funnel : [];
  const repPerformance = Array.isArray(data?.repPerformance) ? data.repPerformance : [];
  const recentActivities = Array.isArray(data?.recentActivities) ? data.recentActivities : [];
  const pendingTasks = Array.isArray(data?.pendingTasks) ? data.pendingTasks : [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-brand-950/40 border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            Good morning, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            7BLOCKS Sales Engine · High-conversion pipeline and relationship tracker
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start md:self-auto">
          {(['today', '7days', '30days', '90days'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                timeframe === t
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'today' ? 'Today' : t === '7days' ? '7 Days' : t === '30days' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Leads */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Leads</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{kpi.totalLeads || 0}</p>
          <span className="text-[11px] text-emerald-400 flex items-center gap-0.5 mt-1 font-medium">
            <ArrowUpRight className="w-3 h-3" />
            +{kpi.newLeads || 0} in this period
          </span>
        </div>

        {/* Calls Logged */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Calls Logged</span>
            <Phone className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{kpi.callsMade || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Phone outreach</span>
        </div>

        {/* Emails Sent */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Emails Sent</span>
            <Mail className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{kpi.emailsSent || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Outbound campaigns</span>
        </div>

        {/* Pipeline Value */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Pipeline</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold font-mono text-brand-400">
            {formatCurrency(kpi.totalPipelineValue || 0)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            Weighted: {formatCurrency(kpi.weightedPipelineValue || 0)}
          </span>
        </div>

        {/* Won Revenue / Win Rate */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Closed Won</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-400">
            {formatCurrency(kpi.closedWonRevenue || 0)}
          </p>
          <span className="text-[11px] text-emerald-300/80 mt-1 block">
            {kpi.conversionRate || 0}% Win Rate
          </span>
        </div>
      </div>

      {/* Two Column Layout: Priorities & Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Action Queue & Funnel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Queue: Follow-ups Due */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm text-slate-100">
                  Today's Priorities & Action Queue
                </h3>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
              >
                <span>View all tasks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {pendingTasks.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No pending tasks scheduled.</p>
              ) : (
                pendingTasks.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => t.contactId && navigate(`/contacts/${t.contactId}`)}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-200 group-hover:text-brand-400 truncate">
                          {t.title}
                        </p>
                        {t.contact && (
                          <p className="text-[11px] text-slate-500 truncate">
                            {t.contact.fullName} {t.contact.phone ? `· ${t.contact.phone}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={t.priority === 'URGENT' ? 'danger' : t.priority === 'HIGH' ? 'warning' : 'neutral'} size="sm">
                        {t.priority}
                      </Badge>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(t.dueDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sales Conversion Funnel */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <h3 className="font-semibold text-sm text-slate-100 mb-4">
              Sales Outreach & Conversion Funnel
            </h3>
            <div className="grid grid-cols-5 gap-2 text-center">
              {funnel.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center col-span-5">No funnel stages recorded.</p>
              ) : (
                funnel.map((step: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-medium truncate mb-1">
                      {step.stage}
                    </span>
                    <span className="text-lg font-bold text-slate-100 font-mono">
                      {step.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Performing Reps (Manager/Admin View) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <h3 className="font-semibold text-sm text-slate-100 mb-3">
              Sales Rep Performance & Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Rep</th>
                    <th className="py-2.5 px-3">Leads</th>
                    <th className="py-2.5 px-3">Calls</th>
                    <th className="py-2.5 px-3">Emails</th>
                    <th className="py-2.5 px-3">Won Deals</th>
                    <th className="py-2.5 px-3 text-right">Won Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {repPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500 text-xs">
                        No team activity recorded yet.
                      </td>
                    </tr>
                  ) : (
                    repPerformance.map((rep: any) => (
                      <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center gap-2">
                          {rep.avatar ? (
                            <img src={rep.avatar} alt={rep.name} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                              {rep.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span>{rep.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 font-mono">{rep.leadsAssigned ?? 0}</td>
                        <td className="py-2.5 px-3 text-slate-300 font-mono">{rep.calls ?? 0}</td>
                        <td className="py-2.5 px-3 text-slate-300 font-mono">{rep.emails ?? 0}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-mono font-bold">{rep.wonDeals ?? 0}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">
                          {formatCurrency(rep.wonRevenue || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Activity Stream & Pipeline snapshot */}
        <div className="space-y-6">
          {/* Pipeline by Stage Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-100">Pipeline Snapshot</h3>
              <button
                onClick={() => navigate('/pipeline')}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
              >
                <span>Kanban</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {Object.keys(stageCounts).length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No active deals in pipeline.</p>
              ) : (
                Object.entries(stageCounts).map(([stage, val]: [string, any]) => (
                  <div key={stage} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="font-medium text-slate-300 capitalize">
                      {stage.replace('_', ' ').toLowerCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">{val?.count || 0} deals</span>
                      <span className="font-mono font-semibold text-slate-200">{formatCurrency(val?.totalValue || 0)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Recent Activity Stream */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <h3 className="font-semibold text-sm text-slate-100">Recent Activity Feed</h3>
            <div className="space-y-3 text-xs">
              {recentActivities.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No recent activity logged.</p>
              ) : (
                recentActivities.map((act: any) => (
                  <div key={act.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-800/40 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-200 truncate">{act.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {act.contact ? act.contact.fullName : ''} · by {act.user?.name}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDateTime(act.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
