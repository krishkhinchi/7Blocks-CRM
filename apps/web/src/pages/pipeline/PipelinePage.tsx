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
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Sales Reps</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateDeal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Opportunity</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Bar */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">Total Active Pipeline</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-lg font-bold font-mono text-brand-400">
              {formatCurrency(analytics.totalPipelineValue)}
            </p>
            <span className="text-[10px] text-slate-500">{analytics.activeCount} active deals</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">Weighted Pipeline Forecast</span>
              <Target className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-lg font-bold font-mono text-cyan-400">
              {formatCurrency(analytics.weightedPipelineValue)}
            </p>
            <span className="text-[10px] text-slate-500">Value × Probability</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">Closed Won Revenue</span>
              <Award className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-lg font-bold font-mono text-emerald-400">
              {formatCurrency(analytics.closedWonValue)}
            </p>
            <span className="text-[10px] text-slate-500">{analytics.wonCount} won deals</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">Overall Win Rate</span>
              <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-lg font-bold font-mono text-indigo-400">
              {analytics.winRate}%
            </p>
            <span className="text-[10px] text-slate-500">Avg deal: {formatCurrency(analytics.avgDealSize)}</span>
          </div>
        </div>
      )}

      {/* Kanban Board Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm min-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500 text-xs">
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
