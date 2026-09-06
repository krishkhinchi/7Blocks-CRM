import React, { useState, useEffect } from 'react';
import { Kanban, Plus, Filter, TrendingUp, DollarSign, Award, Target } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';
import { formatCurrency } from '../../lib/utils';
import { PipelineKanban, KanbanColumn, Deal } from '../../components/kanban/PipelineKanban';
import { CreateDealModal } from '../../components/forms/CreateDealModal';

export const PipelinePage: React.FC = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [ownerId, setOwnerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateDeal, setShowCreateDeal] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchKanban();
  }, [ownerId]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setUsers([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/deals/analytics');
      setAnalytics(res.data?.data || null);
    } catch {
      setAnalytics(null);
    }
  };

  const fetchKanban = async () => {
    setLoading(true);
    try {
      const url = ownerId ? `/deals/kanban?ownerId=${ownerId}` : '/deals/kanban';
      const res = await api.get(url);
      const raw = res.data?.data ?? res.data;
      setColumns(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Failed to load kanban:', err);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (dealId: string, newStage: string) => {
    try {
      await api.patch(`/deals/${dealId}/stage`, { stage: newStage });
      success('Deal moved to ' + newStage.replace('_', ' '));
      fetchAnalytics();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to move deal');
      fetchKanban();
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-full mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Kanban className="w-5 h-5 text-brand-400" />
            <span>Deal Pipeline & Kanban Board</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track opportunity progress through Prospecting, Proposal, and Negotiation stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Owner Filter */}
          <select
            value={ownerId}
            onChange={e => setOwnerId(e.target.value)}
            className="bg-slate-900 border border-slate-800/60 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-slate-600 focus:outline-none shadow-sm"
          >
            <option value="">All Sales Reps</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateDeal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-200 text-xs font-semibold text-slate-900 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Opportunity</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Bar — always visible; shows 0 when no DB data */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Active Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-accent-orange/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-accent-orange" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-slate-100 tracking-tight">
            {formatCurrency(analytics?.totalPipelineValue ?? 0)}
          </p>
          <span className="text-[11px] text-slate-500 mt-2 block font-medium">{analytics?.activeCount ?? 0} active deals</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Weighted Forecast</span>
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-accent-cyan" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-slate-100 tracking-tight">
            {formatCurrency(analytics?.weightedPipelineValue ?? 0)}
          </p>
          <span className="text-[11px] text-slate-500 mt-2 block font-medium">Value × Probability</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Closed Won Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-accent-emerald/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-accent-emerald" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-slate-100 tracking-tight">
            {formatCurrency(analytics?.closedWonValue ?? 0)}
          </p>
          <span className="text-[11px] text-slate-500 mt-2 block font-medium">{analytics?.wonCount ?? 0} won deals</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Overall Win Rate</span>
            <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-accent-purple" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-slate-100 tracking-tight">
            {analytics?.winRate ?? 0}%
          </p>
          <span className="text-[11px] text-slate-500 mt-2 block font-medium truncate">Avg deal: {formatCurrency(analytics?.avgDealSize ?? 0)}</span>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="rounded-2xl border border-slate-800/40 bg-slate-950/40 p-4 shadow-sm min-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500 text-[13px]">
            Loading pipeline deals...
          </div>
        ) : (
          <PipelineKanban
            columns={columns}
            onStageChange={handleStageChange}
          />
        )}
      </div>

      <CreateDealModal
        isOpen={showCreateDeal}
        onClose={() => setShowCreateDeal(false)}
        onSuccess={() => {
          fetchKanban();
          fetchAnalytics();
        }}
      />
    </div>
  );
};
