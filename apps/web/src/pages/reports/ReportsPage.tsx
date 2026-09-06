import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Award, Target, Filter } from 'lucide-react';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30days');

  useEffect(() => {
    fetchReports();
  }, [timeframe]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard?timeframe=${timeframe}`);
      setData(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div className="p-8 text-center text-slate-500 text-xs">Loading analytics...</div>;
  }

  const kpi = data?.kpi || {};
  const repPerformance = Array.isArray(data?.repPerformance) ? data.repPerformance : [];
  const funnel = Array.isArray(data?.funnel) ? data.funnel : [];
  const stageCounts = data?.stageCounts || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5 tracking-tight">
            <BarChart3 className="w-6 h-6 text-accent-blue" />
            <span>Sales Analytics & Executive Reports</span>
          </h1>
          <p className="text-[13px] text-slate-400 mt-1">
            Real PostgreSQL aggregations: conversion ratios, pipeline velocity, and team rankings.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/60 shadow-sm rounded-xl p-1.5 text-[13px]">
          {['7days', '30days', '90days', 'all'].map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize transition-all ${
                timeframe === t ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {t === '7days' ? '7 Days' : t === '30days' ? '30 Days' : t === '90days' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <span className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Total Pipeline Value</span>
          <span className="text-2xl font-bold font-mono text-accent-blue">{formatCurrency(kpi.totalPipelineValue)}</span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <span className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Closed Won Revenue</span>
          <span className="text-2xl font-bold font-mono text-accent-emerald">{formatCurrency(kpi.closedWonRevenue)}</span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <span className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Win Rate</span>
          <span className="text-2xl font-bold font-mono text-accent-purple">{kpi.conversionRate}%</span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
          <span className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Outreach Touches</span>
          <span className="text-2xl font-bold font-mono text-accent-cyan">{kpi.callsMade + kpi.emailsSent}</span>
        </div>
      </div>

      {/* Stage Breakdown & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Value breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-5">
          <h3 className="font-semibold text-[15px] text-slate-100 tracking-tight">Pipeline by Deal Stage</h3>
          <div className="space-y-4 text-[13px]">
            {Object.entries(stageCounts).map(([stage, val]: [string, any]) => (
              <div key={stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-medium capitalize">{stage.replace('_', ' ').toLowerCase()}</span>
                  <span className="font-mono font-bold text-slate-200">{formatCurrency(val.totalValue)} ({val.count})</span>
                </div>
                <div className="w-full bg-slate-950/60 h-2.5 rounded-full overflow-hidden border border-slate-800/60">
                  <div
                    className="h-full bg-accent-blue rounded-full"
                    style={{ width: `${kpi.totalPipelineValue > 0 ? (val.totalValue / (kpi.totalPipelineValue + kpi.closedWonRevenue)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-5">
          <h3 className="font-semibold text-[15px] text-slate-100 tracking-tight">Conversion Funnel</h3>
          <div className="space-y-3 text-[13px]">
            {funnel.map((item: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/40 shadow-sm flex items-center justify-between">
                <span className="font-medium text-slate-300">{item.stage}</span>
                <span className="font-mono text-xl font-bold text-slate-100">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Rep Performance Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-4">
        <h3 className="font-semibold text-[15px] text-slate-100 tracking-tight">Team Activity & Closed Deals Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/60">
              <tr>
                <th className="py-3 px-3">Sales Representative</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Leads Assigned</th>
                <th className="py-3 px-3">Calls Made</th>
                <th className="py-3 px-3">Emails Sent</th>
                <th className="py-3 px-3">Closed Won Deals</th>
                <th className="py-3 px-3 text-right">Won Revenue (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {repPerformance.map((rep: any) => (
                <tr key={rep.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3.5 px-3 font-medium text-slate-200 flex items-center gap-3">
                    {rep.avatar ? (
                      <img src={rep.avatar} alt={rep.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                        {rep.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="group-hover:text-white transition-colors">{rep.name}</span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">{rep.role}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-300">{rep.leadsAssigned}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-300">{rep.calls}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-300">{rep.emails}</td>
                  <td className="py-3.5 px-3 font-mono font-bold text-accent-emerald">{rep.wonDeals}</td>
                  <td className="py-3.5 px-3 font-mono font-bold text-accent-emerald text-right">
                    {formatCurrency(rep.wonRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
