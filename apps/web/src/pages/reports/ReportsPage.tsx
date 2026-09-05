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
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            <span>Sales Analytics & Executive Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real PostgreSQL aggregations: conversion ratios, pipeline velocity, and team rankings.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          {['7days', '30days', '90days', 'all'].map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize ${
                timeframe === t ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === '7days' ? '7 Days' : t === '30days' ? '30 Days' : t === '90days' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Pipeline Value</span>
          <span className="text-xl font-bold font-mono text-brand-400">{formatCurrency(kpi.totalPipelineValue)}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Closed Won Revenue</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{formatCurrency(kpi.closedWonRevenue)}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Win Rate</span>
          <span className="text-xl font-bold font-mono text-indigo-400">{kpi.conversionRate}%</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Outreach Touches</span>
          <span className="text-xl font-bold font-mono text-cyan-400">{kpi.callsMade + kpi.emailsSent}</span>
        </div>
      </div>

      {/* Stage Breakdown & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Value breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-slate-100">Pipeline by Deal Stage</h3>
          <div className="space-y-3 text-xs">
            {Object.entries(stageCounts).map(([stage, val]: [string, any]) => (
              <div key={stage} className="space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-medium capitalize">{stage.replace('_', ' ').toLowerCase()}</span>
                  <span className="font-mono font-bold">{formatCurrency(val.totalValue)} ({val.count})</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{ width: `${kpi.totalPipelineValue > 0 ? (val.totalValue / (kpi.totalPipelineValue + kpi.closedWonRevenue)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-slate-100">Conversion Funnel</h3>
          <div className="space-y-3 text-xs">
            {funnel.map((item: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <span className="font-semibold text-slate-300">{item.stage}</span>
                <span className="font-mono text-lg font-bold text-slate-100">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Rep Performance Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm text-slate-100">Team Activity & Closed Deals Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Sales Representative</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Leads Assigned</th>
                <th className="py-2.5 px-3">Calls Made</th>
                <th className="py-2.5 px-3">Emails Sent</th>
                <th className="py-2.5 px-3">Closed Won Deals</th>
                <th className="py-2.5 px-3 text-right">Won Revenue (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {repPerformance.map((rep: any) => (
                <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-100 flex items-center gap-2">
                    {rep.avatar ? (
                      <img src={rep.avatar} alt={rep.name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                        {rep.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span>{rep.name}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{rep.role}</td>
                  <td className="py-3 px-3 font-mono text-slate-300">{rep.leadsAssigned}</td>
                  <td className="py-3 px-3 font-mono text-slate-300">{rep.calls}</td>
                  <td className="py-3 px-3 font-mono text-slate-300">{rep.emails}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">{rep.wonDeals}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400 text-right">
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
