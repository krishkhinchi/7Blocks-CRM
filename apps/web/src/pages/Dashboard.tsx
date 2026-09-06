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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Good morning, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-[13px] text-slate-400 mt-1">
            7BLOCKS Sales Engine · High-conversion pipeline and relationship tracker
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800/60 self-start md:self-auto shadow-inner">
          {(['today', '7days', '30days', '90days'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === t
                  ? 'bg-slate-800 text-white shadow-sm'
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
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Leads</span>
            <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-accent-blue" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100 tracking-tight">{kpi.totalLeads || 0}</p>
          <span className="text-[11px] text-accent-emerald flex items-center gap-0.5 mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +{kpi.newLeads || 0} in this period
          </span>
        </div>

        {/* Calls Logged */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Calls Logged</span>
            <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
              <Phone className="w-4 h-4 text-accent-purple" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100 tracking-tight">{kpi.callsMade || 0}</p>
          <span className="text-[11px] text-slate-500 mt-2 block font-medium">Phone outreach</span>
        </div>

        {/* Emails Sent */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Emails Sent</span>
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-accent-cyan" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100 tracking-tight">{kpi.emailsSent || 0}</p>
          <span className="text-[11px] text-slate-500 mt-2 block font-medium">Outbound campaigns</span>
        </div>

        {/* Pipeline Value */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Active Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-accent-orange/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-accent-orange" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-accent-orange tracking-tight truncate">
            {formatCurrency(kpi.totalPipelineValue || 0)}
          </p>
          <span className="text-[11px] text-slate-500 mt-2 block font-mono font-medium truncate">
            Wgt: {formatCurrency(kpi.weightedPipelineValue || 0)}
          </span>
        </div>

        {/* Won Revenue / Win Rate */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Closed Won</span>
            <div className="w-8 h-8 rounded-lg bg-accent-emerald/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-accent-emerald" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-accent-emerald tracking-tight truncate">
            {formatCurrency(kpi.closedWonRevenue || 0)}
          </p>
          <span className="text-[11px] text-accent-emerald mt-2 block font-medium">
            {kpi.conversionRate || 0}% Win Rate
          </span>
        </div>
      </div>

      {/* Two Column Layout: Priorities & Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Action Queue & Funnel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Queue: Follow-ups Due */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent-yellow" />
                <h3 className="font-semibold text-[15px] text-slate-100 tracking-tight">
                  Action Queue
                </h3>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-[13px] text-slate-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {pendingTasks.length === 0 ? (
                <p className="text-[13px] text-slate-500 py-6 text-center">No pending tasks scheduled.</p>
              ) : (
                pendingTasks.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => t.contactId && navigate(`/contacts/${t.contactId}`)}
                    className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:border-slate-700 hover:bg-slate-900/80 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-accent-blue opacity-80 shrink-0 group-hover:opacity-100" />
                      <div className="min-w-0">
                        <p className="font-medium text-[13px] text-slate-200 group-hover:text-white truncate transition-colors">
                          {t.title}
                        </p>
                        {t.contact && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {t.contact.fullName} {t.contact.phone ? `· ${t.contact.phone}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
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
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
            <h3 className="font-semibold text-[15px] text-slate-100 tracking-tight mb-5">
              Sales Outreach & Conversion Funnel
            </h3>
            <div className="grid grid-cols-5 gap-3 text-center">
              {funnel.length === 0 ? (
                <p className="text-[13px] text-slate-500 py-4 col-span-5">No funnel stages recorded.</p>
              ) : (
                funnel.map((step: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/40 hover:bg-slate-950 hover:border-slate-800 transition-all flex flex-col items-center justify-center gap-1.5">
                    <span className="text-xl font-bold text-slate-100 font-mono tracking-tight">
                      {step.count}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium truncate w-full">
                      {step.stage}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Performing Reps (Manager/Admin View) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
            <h3 className="font-semibold text-[15px] text-slate-100 tracking-tight mb-4">
              Team Performance & Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60">
                  <tr>
                    <th className="py-3 px-3 font-medium">Rep</th>
                    <th className="py-3 px-3 font-medium">Leads</th>
                    <th className="py-3 px-3 font-medium">Calls</th>
                    <th className="py-3 px-3 font-medium">Emails</th>
                    <th className="py-3 px-3 font-medium">Won Deals</th>
                    <th className="py-3 px-3 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-[13px]">
                  {repPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No team activity recorded yet.
                      </td>
                    </tr>
                  ) : (
                    repPerformance.map((rep: any) => (
                      <tr key={rep.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3 px-3 font-medium text-slate-200 flex items-center gap-2.5">
                          {rep.avatar ? (
                            <img src={rep.avatar} alt={rep.name} className="w-6 h-6 rounded-full object-cover border border-slate-700/50" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-300">
                              {rep.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="group-hover:text-white transition-colors">{rep.name}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono">{rep.leadsAssigned ?? 0}</td>
                        <td className="py-3 px-3 text-slate-400 font-mono">{rep.calls ?? 0}</td>
                        <td className="py-3 px-3 text-slate-400 font-mono">{rep.emails ?? 0}</td>
                        <td className="py-3 px-3 text-accent-emerald font-mono font-medium">{rep.wonDeals ?? 0}</td>
                        <td className="py-3 px-3 text-right font-mono text-accent-emerald font-bold tracking-tight">
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
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[15px] text-slate-100 tracking-tight">Pipeline Snapshot</h3>
              <button
                onClick={() => navigate('/pipeline')}
                className="text-[13px] text-slate-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
              >
                <span>Kanban</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {Object.keys(stageCounts).length === 0 ? (
                <p className="text-[13px] text-slate-500 py-6 text-center">No active deals in pipeline.</p>
              ) : (
                Object.entries(stageCounts).map(([stage, val]: [string, any]) => (
                  <div key={stage} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:bg-slate-950 hover:border-slate-800 transition-all">
                    <span className="font-medium text-[13px] text-slate-300 capitalize">
                      {stage.replace('_', ' ').toLowerCase()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 font-mono">{val?.count || 0} deals</span>
                      <span className="font-mono text-[13px] font-semibold text-slate-100 tracking-tight">{formatCurrency(val?.totalValue || 0)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Recent Activity Stream */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-4">
            <h3 className="font-semibold text-[15px] text-slate-100 tracking-tight">Activity Feed</h3>
            <div className="space-y-1">
              {recentActivities.length === 0 ? (
                <p className="text-[13px] text-slate-500 py-6 text-center">No recent activity logged.</p>
              ) : (
                recentActivities.map((act: any) => (
                  <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-950/60 transition-colors group">
                    <div className="w-2 h-2 rounded-full bg-accent-blue/80 mt-2 shrink-0 group-hover:bg-accent-blue transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[13px] text-slate-200 group-hover:text-white truncate transition-colors">{act.title}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {act.contact ? act.contact.fullName : ''} · by {act.user?.name}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block">
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
