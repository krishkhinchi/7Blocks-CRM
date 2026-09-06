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
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-xl font-bold text-accent-blue shrink-0">
              {contact.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{contact.fullName}</h1>
                <StatusBadge status={contact.leadStatus} />
                <Badge variant="purple" size="sm">{contact.lifecycleStage}</Badge>
              </div>

              <div className="flex items-center gap-3 text-[13px] text-slate-400 mt-2 flex-wrap font-medium">
                {contact.jobTitle && <span>{contact.jobTitle}</span>}
                {contact.company && (
                  <button
                    onClick={() => navigate(`/companies/${contact.company.id}`)}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-accent-blue transition-colors font-medium"
                  >
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>{contact.company.name}</span>
                  </button>
                )}
                {contact.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-accent-cyan hover:underline"
                  >
                    <Globe className="w-4 h-4" />
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-slate-950 text-[13px] font-semibold shadow-sm transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Log Call</span>
            </button>
            <button
              onClick={() => setShowSendEmail(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-cyan hover:bg-accent-cyan/90 text-slate-950 text-[13px] font-semibold shadow-sm transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Send Email</span>
            </button>
            <button
              onClick={() => setShowCreateTask(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[13px] font-semibold text-slate-200 transition-colors shadow-sm"
            >
              <CheckSquare className="w-4 h-4 text-accent-yellow" />
              <span>Task</span>
            </button>
            <button
              onClick={() => setShowCreateDeal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[13px] font-semibold text-slate-200 transition-colors shadow-sm"
            >
              <Briefcase className="w-4 h-4 text-accent-orange" />
              <span>Deal</span>
            </button>
          </div>
        </div>

        {/* Contact Info Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-5 border-t border-slate-800/60 text-[13px]">
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/40">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Direct Phone</span>
            <span className="font-mono font-medium text-slate-200">{contact.phone || '—'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/40">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Direct Email</span>
            <span className="font-mono font-medium text-slate-200 truncate block">{contact.email || '—'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/40">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Assigned Rep</span>
            <span className="text-slate-200 font-medium">{contact.owner?.name || 'Unassigned'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/40">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Lead Source</span>
            <span className="text-slate-200 font-medium">{contact.leadSource?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Prominent NEXT BEST ACTION Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-yellow/10 border border-accent-yellow/20 flex items-center justify-center text-accent-yellow shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-accent-yellow uppercase tracking-wider block mb-1">
              Next Action
            </span>
            {nextTask ? (
              <p className="font-medium text-[15px] text-slate-100 tracking-tight">
                {nextTask.title} — Due {formatDateTime(nextTask.dueDate)}
              </p>
            ) : upcomingMeeting ? (
              <p className="font-medium text-[15px] text-slate-100 tracking-tight">
                Meeting: {upcomingMeeting.title} at {formatDateTime(upcomingMeeting.startTime)}
              </p>
            ) : contact.nextFollowUpAt ? (
              <p className="font-medium text-[15px] text-slate-100 tracking-tight">
                Follow up scheduled for {formatDateTime(contact.nextFollowUpAt)}
              </p>
            ) : (
              <p className="text-[13px] text-slate-400">
                No next follow-up action scheduled. Ensure continuity by scheduling a task.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowCreateTask(true)}
          className="px-4 py-2 rounded-lg bg-accent-yellow/10 text-accent-yellow hover:bg-accent-yellow/20 border border-accent-yellow/30 text-[13px] font-semibold shrink-0 transition-colors shadow-sm"
        >
          {nextTask ? 'Edit Task' : '+ Schedule Follow-up'}
        </button>
      </div>

      {/* Main Dual-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Activity Timeline Feed */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-5">
          <h2 className="text-[15px] font-semibold text-slate-100 tracking-tight">
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
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-yellow" />
                <span>Lead Score & Health</span>
              </span>
              <span className="text-lg font-bold font-mono text-accent-emerald">
                {contact.computedScore || contact.leadScore}/100
              </span>
            </div>

            {/* Score Progress Bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/60">
              <div
                className="h-full bg-gradient-to-r from-accent-yellow to-accent-emerald rounded-full"
                style={{ width: `${contact.computedScore || contact.leadScore}%` }}
              />
            </div>

            {/* Explainable Factors */}
            <div className="space-y-1.5 pt-2 text-[11px] text-slate-400 font-mono">
              {(contact.scoreBreakdown || ['+10 Base profile created']).map((factor: string, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Deals / Opportunities */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-200 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-accent-orange" />
                <span>Pipeline Deals ({contact.deals?.length || 0})</span>
              </span>
              <button
                onClick={() => setShowCreateDeal(true)}
                className="text-[11px] text-slate-400 hover:text-white font-semibold transition-colors"
              >
                + Add Deal
              </button>
            </div>

            <div className="space-y-2 text-[13px]">
              {!contact.deals || contact.deals.length === 0 ? (
                <p className="text-[13px] text-slate-500 py-4 text-center">No active deals for this contact.</p>
              ) : (
                contact.deals.map((deal: any) => (
                  <div
                    key={deal.id}
                    className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium text-[13px] text-slate-200 truncate">{deal.name}</span>
                      <span className="font-mono font-bold text-[13px] text-slate-100 tracking-tight">
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
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-200 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-accent-emerald" />
                <span>Tasks ({contact.tasks?.length || 0})</span>
              </span>
              <button
                onClick={() => setShowCreateTask(true)}
                className="text-[11px] text-slate-400 hover:text-white font-semibold transition-colors"
              >
                + Add Task
              </button>
            </div>

            <div className="space-y-2 text-[13px]">
              {!contact.tasks || contact.tasks.length === 0 ? (
                <p className="text-[13px] text-slate-500 py-4 text-center">No tasks scheduled.</p>
              ) : (
                contact.tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/40"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'COMPLETED'}
                      onChange={() => handleToggleTask(task.id)}
                      className="rounded bg-slate-900 border-slate-700 text-accent-emerald focus:ring-accent-emerald mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-[13px] truncate ${task.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </p>
                      <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
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
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-4 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>{contact.company.name}</span>
                </span>
                <button
                  onClick={() => navigate(`/companies/${contact.company.id}`)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5 text-slate-400 text-[11px] font-medium">
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
