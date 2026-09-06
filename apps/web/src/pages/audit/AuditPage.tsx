import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Clock, User, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge } from '../../components/common/Badge';
import { formatDateTime } from '../../lib/utils';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, entityType]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit)
      });
      if (entityType) params.append('entityType', entityType);

      const res = await api.get(`/audit?${params.toString()}`);
      const raw = res.data?.data ?? res.data;
      setLogs(Array.isArray(raw) ? raw : []);
      if (res.data?.pagination) setPagination(res.data.pagination);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5 tracking-tight">
          <ShieldAlert className="w-6 h-6 text-accent-rose" />
          <span>Security & System Mutation Audit Logs</span>
        </h1>
        <p className="text-[13px] text-slate-400 mt-1">
          Manager & Admin trace history: complete audit of who changed what, when, and previous values.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3">
        <select
          value={entityType}
          onChange={e => {
            setEntityType(e.target.value);
            setPagination(p => ({ ...p, page: 1 }));
          }}
          className="bg-slate-950/40 border border-slate-800/60 rounded-xl px-4 py-2.5 text-[13px] text-slate-100 focus:border-accent-blue focus:outline-none transition-colors shadow-sm"
        >
          <option value="">All Entities</option>
          <option value="Contact">Contacts</option>
          <option value="Company">Companies</option>
          <option value="Deal">Deals</option>
          <option value="Task">Tasks</option>
          <option value="ImportBatch">Imports</option>
          <option value="User">Users</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/60">
              <tr>
                <th className="py-3.5 px-5">Action</th>
                <th className="py-3.5 px-5">Entity</th>
                <th className="py-3.5 px-5">Triggered By</th>
                <th className="py-3.5 px-5">Changes & Values</th>
                <th className="py-3.5 px-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading && (!Array.isArray(logs) || logs.length === 0) ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-[13px]">Loading audit history...</td>
                </tr>
              ) : !Array.isArray(logs) || logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-[13px]">No audit events recorded.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-5">
                      <Badge variant={log.action.includes('DELETED') ? 'danger' : log.action.includes('CREATED') ? 'success' : 'info'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {log.entityType} <span className="text-[10px] text-slate-500 font-mono font-normal">({log.entityId.slice(0, 8)}...)</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 text-slate-300">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>{log.user?.name || 'System / Batch'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-[11px] font-mono text-slate-400 max-w-xs truncate">
                      {log.newValues ? JSON.stringify(log.newValues) : '—'}
                    </td>
                    <td className="py-4 px-5 text-right font-mono text-slate-500 text-[11px]">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
