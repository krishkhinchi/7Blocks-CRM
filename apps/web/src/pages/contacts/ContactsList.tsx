import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Download,
  Phone,
  Mail,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Tag,
  Building2,
  Trash2,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';
import { useAuth } from '../../stores/auth';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateTime, formatDate } from '../../lib/utils';
import { LogCallModal } from '../../components/forms/LogCallModal';
import { SendEmailModal } from '../../components/forms/SendEmailModal';
import { CreateContactModal } from '../../components/forms/CreateContactModal';

export const ContactsList: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [leadStatus, setLeadStatus] = useState('');
  const [lifecycleStage, setLifecycleStage] = useState('');
  const [serviceInterest, setServiceInterest] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');

  // Modals state
  const [logCallContact, setLogCallContact] = useState<any>(null);
  const [sendEmailContact, setSendEmailContact] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { success, error } = useToast();
  const { user, isManager } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [pagination.page, search, leadStatus, lifecycleStage, serviceInterest, ownerId]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setUsers(list);
    } catch {
      setUsers([]);
    }
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit)
      });
      if (search) params.append('search', search);
      if (leadStatus) params.append('leadStatus', leadStatus);
      if (lifecycleStage) params.append('lifecycleStage', lifecycleStage);
      if (serviceInterest) params.append('serviceInterest', serviceInterest);
      if (ownerId) params.append('ownerId', ownerId);

      const res = await api.get(`/contacts?${params.toString()}`);
      const raw = res.data?.data ?? res.data?.contacts ?? res.data;
      const list = Array.isArray(raw) ? raw : [];
      setContacts(list);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(contacts.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    try {
      await api.post('/contacts/bulk', {
        contactIds: selectedIds,
        leadStatus: bulkStatus
      });
      success(`Updated status for ${selectedIds.length} contacts.`);
      setSelectedIds([]);
      setBulkStatus('');
      fetchContacts();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Bulk update failed');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} contacts?`)) {
      return;
    }
    try {
      await api.post('/contacts/bulk', {
        contactIds: selectedIds,
        delete: true
      });
      success(`Deleted ${selectedIds.length} contacts.`);
      setSelectedIds([]);
      fetchContacts();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Bulk deletion failed');
    }
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    window.open(`/api/exports/contacts?format=${format}`, '_blank');
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>Contacts & Leads Directory</span>
            <span className="text-xs font-normal text-slate-400 font-mono">
              ({pagination.total} total)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your sales pipeline leads, communication records, and next follow-up actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, phone, gym... (e.g. Kunal, Powai)"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Lead Status */}
          <div>
            <select
              value={leadStatus}
              onChange={e => {
                setLeadStatus(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="INTERESTED">Interested</option>
              <option value="CALLBACK_SCHEDULED">Callback Due</option>
              <option value="DEMO_SCHEDULED">Demo Scheduled</option>
              <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
              <option value="PROPOSAL_SENT">Proposal Sent</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
              <option value="DO_NOT_CONTACT">Do Not Contact</option>
            </select>
          </div>

          {/* Service Interest */}
          <div>
            <select
              value={serviceInterest}
              onChange={e => {
                setServiceInterest(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Services</option>
              <option value="WEBSITE_NEW">Website (New)</option>
              <option value="WEBSITE_REDESIGN">Website Redesign</option>
              <option value="WEB_APP">Web App</option>
              <option value="MOBILE_APP">Mobile App</option>
              <option value="AUTOMATION">Automation</option>
              <option value="SAAS">SaaS Product</option>
              <option value="CUSTOM_SOFTWARE">Custom Software</option>
            </select>
          </div>

          {/* Sales Rep / Owner */}
          <div>
            <select
              value={ownerId}
              onChange={e => {
                setOwnerId(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Reps</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions Floating Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-brand-950/40 border border-brand-500/30 text-xs text-brand-200">
            <span className="font-semibold">{selectedIds.length} contacts selected</span>
            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-100 text-xs focus:outline-none"
              >
                <option value="">Change Status...</option>
                <option value="CONTACTED">Mark Contacted</option>
                <option value="INTERESTED">Mark Interested</option>
                <option value="LOST">Mark Lost</option>
                <option value="DO_NOT_CONTACT">Do Not Contact</option>
              </select>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatus}
                className="px-2.5 py-1 rounded-md bg-brand-600 hover:bg-brand-500 text-white font-semibold disabled:opacity-50 transition-colors"
              >
                Apply
              </button>
              {isManager && (
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-8">
                  <input
                    type="checkbox"
                    checked={Array.isArray(contacts) && contacts.length > 0 && selectedIds.length === contacts.length}
                    onChange={handleSelectAll}
                    className="rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="py-3 px-4">Contact & Company</th>
                <th className="py-3 px-4">Direct Contact</th>
                <th className="py-3 px-4">Status & Score</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Next Action / Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && (!Array.isArray(contacts) || contacts.length === 0) ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading contacts...
                  </td>
                </tr>
              ) : !Array.isArray(contacts) || contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      title="No contacts found"
                      description="No records match your active search or filter criteria. Add your first lead or import from spreadsheet."
                      actionLabel="+ Add Contact"
                      onAction={() => setShowCreateModal(true)}
                      secondaryActionLabel="Import Excel"
                      onSecondaryAction={() => navigate('/imports')}
                    />
                  </td>
                </tr>
              ) : (
                contacts.map(c => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isSelected ? 'bg-brand-950/15' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(c.id)}
                          className="rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-brand-500"
                        />
                      </td>

                      {/* Contact & Company */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/contacts/${c.id}`)}
                          className="text-left font-semibold text-slate-100 hover:text-brand-400 transition-colors block text-xs"
                        >
                          {c.fullName}
                        </button>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          {c.company ? (
                            <span className="flex items-center gap-1 truncate text-slate-300">
                              <Building2 className="w-3 h-3 text-slate-500" />
                              {c.company.name}
                            </span>
                          ) : (
                            <span>{c.jobTitle || 'Lead'}</span>
                          )}
                        </div>
                      </td>

                      {/* Direct Phone / Email */}
                      <td className="py-3 px-4 text-[11px] font-mono">
                        {c.phone && (
                          <span className="text-slate-200 block">{c.phone}</span>
                        )}
                        {c.email && (
                          <span className="text-slate-400 block truncate max-w-xs">{c.email}</span>
                        )}
                        {!c.phone && !c.email && (
                          <span className="text-slate-600">No details</span>
                        )}
                      </td>

                      {/* Status & Score */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={c.leadStatus} />
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                            c.leadScore >= 70 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                            c.leadScore >= 40 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {c.leadScore} pts
                          </span>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          {c.owner?.avatar ? (
                            <img src={c.owner.avatar} alt={c.owner.name} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px]">
                              {c.owner?.name?.slice(0, 2).toUpperCase() || '7B'}
                            </div>
                          )}
                          <span className="truncate max-w-[100px]">{c.owner?.name || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Next Action / Due */}
                      <td className="py-3 px-4 text-[11px]">
                        {c.tasks && c.tasks.length > 0 ? (
                          <div className="flex items-center gap-1 text-amber-400 font-medium truncate max-w-[180px]">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span className="truncate">{c.tasks[0].title}</span>
                          </div>
                        ) : c.nextFollowUpAt ? (
                          <span className="text-slate-400">
                            Due {formatDate(c.nextFollowUpAt)}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">No action set</span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setLogCallContact(c)}
                            title="Log Call"
                            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-indigo-400 hover:bg-indigo-950/40 hover:border-indigo-500/40 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSendEmailContact(c)}
                            title="Send Email"
                            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-cyan-400 hover:bg-cyan-950/40 hover:border-cyan-500/40 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/contacts/${c.id}`)}
                            title="View Contact Detail"
                            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} leads
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs text-slate-200">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {logCallContact && (
        <LogCallModal
          isOpen={Boolean(logCallContact)}
          onClose={() => setLogCallContact(null)}
          contactId={logCallContact.id}
          contactName={logCallContact.fullName}
          onSuccess={fetchContacts}
        />
      )}

      {sendEmailContact && (
        <SendEmailModal
          isOpen={Boolean(sendEmailContact)}
          onClose={() => setSendEmailContact(null)}
          contact={sendEmailContact}
          onSuccess={fetchContacts}
        />
      )}

      {showCreateModal && (
        <CreateContactModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchContacts}
        />
      )}
    </div>
  );
};
