import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  Briefcase,
  Building2,
  Globe,
  Tag,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  FileText
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { formatCurrency, formatDateTime, formatDate } from '../../lib/utils';
import { ActivityTimeline } from '../../components/timeline/ActivityTimeline';
import { LogCallModal } from '../../components/forms/LogCallModal';
import { SendEmailModal } from '../../components/forms/SendEmailModal';
import { CreateDealModal } from '../../components/forms/CreateDealModal';
import { CreateTaskModal } from '../../components/forms/CreateTaskModal';

export const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showLogCall, setShowLogCall] = useState(false);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchContact();
  }, [id]);

  const fetchContact = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/contacts/${id}`);
      setContact(res.data?.data || null);
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to load contact');
      navigate('/contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await api.patch(`/tasks/${taskId}/toggle`);
      success('Task status updated');
      fetchContact();
    } catch (err: any) {
      error('Failed to update task');
    }
  };

  if (loading || !contact) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-10 w-32 bg-slate-800/60 rounded-lg animate-pulse" />
        <div className="h-40 bg-slate-900/60 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-slate-900/60 rounded-2xl animate-pulse" />
          <div className="h-96 bg-slate-900/60 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Determine Next Action
  const nextTask = contact.tasks?.find((t: any) => t.status === 'TODO');
  const upcomingMeeting = contact.meetings?.find((m: any) => m.status === 'SCHEDULED' && new Date(m.startTime) > new Date());

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/contacts')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Contacts</span>
        </button>
      </div>

      {/* Command Center Contact Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-xl font-bold text-brand-400 shrink-0">
              {contact.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-100">{contact.fullName}</h1>
                <StatusBadge status={contact.leadStatus} />
                <Badge variant="purple" size="sm">{contact.lifecycleStage}</Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                {contact.jobTitle && <span>{contact.jobTitle}</span>}
                {contact.company && (
                  <button
                    onClick={() => navigate(`/companies/${contact.company.id}`)}
                    className="flex items-center gap-1 text-slate-300 hover:text-brand-400 transition-colors font-medium"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{contact.company.name}</span>
                  </button>
                )}
                {contact.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowLogCall(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Log Call</span>
            </button>
            <button
              onClick={() => setShowSendEmail(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email</span>
            </button>
            <button
              onClick={() => setShowCreateTask(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Task</span>
            </button>
            <button
              onClick={() => setShowCreateDeal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Deal</span>
            </button>
          </div>
        </div>

        {/* Contact Info Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Direct Phone</span>
            <span className="font-mono font-semibold text-slate-200">{contact.phone || '—'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Direct Email</span>
            <span className="font-mono text-slate-200 truncate block">{contact.email || '—'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Assigned Rep</span>
            <span className="text-slate-200 font-medium">{contact.owner?.name || 'Unassigned'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Lead Source</span>
            <span className="text-slate-200 font-medium">{contact.leadSource?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Prominent NEXT BEST ACTION Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/40 via-slate-900 to-slate-900 border border-brand-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider block">
              Next Action
            </span>
            {nextTask ? (
              <p className="font-semibold text-sm text-slate-100">
                {nextTask.title} — Due {formatDateTime(nextTask.dueDate)}
              </p>
            ) : upcomingMeeting ? (
              <p className="font-semibold text-sm text-slate-100">
                Meeting: {upcomingMeeting.title} at {formatDateTime(upcomingMeeting.startTime)}
              </p>
            ) : contact.nextFollowUpAt ? (
              <p className="font-semibold text-sm text-slate-100">
                Follow up scheduled for {formatDateTime(contact.nextFollowUpAt)}
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                No next follow-up action scheduled. Ensure continuity by scheduling a task.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowCreateTask(true)}
          className="px-3 py-1.5 rounded-lg bg-brand-600/20 text-brand-300 hover:bg-brand-600/30 border border-brand-500/40 text-xs font-semibold shrink-0 transition-colors"
        >
          {nextTask ? 'Edit Task' : '+ Schedule Follow-up'}
        </button>
      </div>

      {/* Main Dual-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Activity Timeline Feed */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-100">
            Complete Relationship History & Timeline
          </h2>
          <ActivityTimeline
            activities={contact.activities || []}
            onLogCall={() => setShowLogCall(true)}
            onSendEmail={() => setShowSendEmail(true)}
          />
        </div>

        {/* Right 1 Col: Score, Deals, Tasks, Company details */}
        <div className="space-y-6">
          {/* Lead Scoring Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Lead Score & Health</span>
              </span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {contact.computedScore || contact.leadScore}/100
              </span>
            </div>

            {/* Score Progress Bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                style={{ width: `${contact.computedScore || contact.leadScore}%` }}
              />
            </div>

            {/* Explainable Factors */}
            <div className="space-y-1.5 pt-1 text-[11px] text-slate-400 font-mono">
              {(contact.scoreBreakdown || ['+10 Base profile created']).map((factor: string, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Deals / Opportunities */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span>Pipeline Deals ({contact.deals?.length || 0})</span>
              </span>
              <button
                onClick={() => setShowCreateDeal(true)}
                className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold"
              >
                + Add Deal
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {!contact.deals || contact.deals.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No active deals for this contact.</p>
              ) : (
                contact.deals.map((deal: any) => (
                  <div
                    key={deal.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-200 truncate">{deal.name}</span>
                      <span className="font-mono font-bold text-brand-400">
                        {formatCurrency(deal.value)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <Badge variant="info" size="sm">{deal.stage}</Badge>
                      <span>{deal.probability}% prob</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tasks & Action Items */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Tasks ({contact.tasks?.length || 0})</span>
              </span>
              <button
                onClick={() => setShowCreateTask(true)}
                className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold"
              >
                + Add Task
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {!contact.tasks || contact.tasks.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No tasks scheduled.</p>
              ) : (
                contact.tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'COMPLETED'}
                      onChange={() => handleToggleTask(task.id)}
                      className="rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-brand-500 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-xs truncate ${task.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Due {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Company Details */}
          {contact.company && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{contact.company.name}</span>
                </span>
                <button
                  onClick={() => navigate(`/companies/${contact.company.id}`)}
                  className="text-slate-400 hover:text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1 text-slate-400 text-[11px]">
                {contact.company.city && <p>Location: {contact.company.city}</p>}
                {contact.company.industry && <p>Industry: {contact.company.industry}</p>}
                {contact.company.size && <p>Size: {contact.company.size} employees</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LogCallModal
        isOpen={showLogCall}
        onClose={() => setShowLogCall(false)}
        contactId={contact.id}
        contactName={contact.fullName}
        onSuccess={fetchContact}
      />

      <SendEmailModal
        isOpen={showSendEmail}
        onClose={() => setShowSendEmail(false)}
        contact={contact}
        onSuccess={fetchContact}
      />

      <CreateDealModal
        isOpen={showCreateDeal}
        onClose={() => setShowCreateDeal(false)}
        defaultContactId={contact.id}
        defaultCompanyId={contact.companyId}
        onSuccess={fetchContact}
      />

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        defaultContactId={contact.id}
        defaultContactName={contact.fullName}
        onSuccess={fetchContact}
      />
    </div>
  );
};
