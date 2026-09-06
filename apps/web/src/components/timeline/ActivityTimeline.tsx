import React, { useState } from 'react';
import {
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  RefreshCw,
  MessageSquare,
  Video,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatDateTime } from '../../lib/utils';

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  duration?: number | null;
  outcome?: string | null;
  notes?: string | null;
  createdAt: string;
  user?: { id: string; name: string; avatar?: string | null } | null;
  metadata?: any;
}

interface ActivityTimelineProps {
  activities: Activity[];
  onLogCall?: () => void;
  onSendEmail?: () => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  onLogCall,
  onSendEmail
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CALLS' | 'EMAILS' | 'MEETINGS' | 'NOTES'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const safeActivities = Array.isArray(activities) ? activities : [];

  const filtered = safeActivities.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'CALLS') return a.type.includes('CALL');
    if (filter === 'EMAILS') return a.type.includes('EMAIL');
    if (filter === 'MEETINGS') return a.type.includes('MEETING');
    if (filter === 'NOTES') return a.type === 'NOTE';
    return true;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'COLD_CALL':
      case 'WARM_CALL':
        return <Phone className="w-3.5 h-3.5 text-indigo-400" />;
      case 'EMAIL_SENT':
      case 'EMAIL_OPENED':
      case 'EMAIL_REPLIED':
        return <Mail className="w-3.5 h-3.5 text-cyan-400" />;
      case 'MEETING_SCHEDULED':
      case 'MEETING_COMPLETED':
        return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
      case 'TASK_COMPLETED':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'STATUS_CHANGE':
        return <RefreshCw className="w-3.5 h-3.5 text-amber-400" />;
      case 'WHATSAPP':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'DEMO_SENT':
        return <Video className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getOutcomeBadge = (outcome?: string | null) => {
    if (!outcome) return null;
    switch (outcome) {
      case 'INTERESTED':
      case 'POSITIVE':
        return <Badge variant="success">Interested</Badge>;
      case 'CALLBACK_REQUESTED':
        return <Badge variant="warning">Callback Due</Badge>;
      case 'MEETING_REQUESTED':
        return <Badge variant="purple">Meeting Requested</Badge>;
      case 'DEMO_REQUESTED':
        return <Badge variant="info">Demo Requested</Badge>;
      case 'NOT_INTERESTED':
      case 'NEGATIVE':
        return <Badge variant="danger">Not Interested</Badge>;
      case 'NO_ANSWER':
        return <Badge variant="neutral">No Answer</Badge>;
      case 'BUSY':
        return <Badge variant="neutral">Busy</Badge>;
      case 'ALREADY_HAS_SOLUTION':
        return <Badge variant="danger">Has Solution</Badge>;
      case 'DO_NOT_CONTACT':
        return <Badge variant="danger">Blocked</Badge>;
      default:
        return <Badge variant="neutral">{outcome.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'CALLS', 'EMAILS', 'MEETINGS', 'NOTES'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors shrink-0 ${
                filter === tab
                  ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              {tab === 'ALL' ? `All (${safeActivities.length})` : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onLogCall && (
            <button
              onClick={onLogCall}
              className="px-3 py-1.5 text-[13px] font-semibold rounded-lg bg-accent-purple/10 text-accent-purple border border-accent-purple/20 hover:bg-accent-purple/20 transition-colors shadow-sm"
            >
              + Log Call
            </button>
          )}
          {onSendEmail && (
            <button
              onClick={onSendEmail}
              className="px-3 py-1.5 text-[13px] font-semibold rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 hover:bg-accent-cyan/20 transition-colors shadow-sm"
            >
              + Send Email
            </button>
          )}
        </div>
      </div>

      {/* Feed List */}
      <div className="relative pl-7 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-px before:bg-slate-800/60 mt-4">
        {filtered.length === 0 ? (
          <p className="text-[13px] text-slate-500 py-6">No activity recorded for this filter.</p>
        ) : (
          filtered.map(act => {
            const isExpanded = expandedId === act.id;
            return (
              <div key={act.id} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-[27px] top-1.5 w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-sm z-10">
                  {getActivityIcon(act.type)}
                </div>

                {/* Content Box */}
                <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-950/40 hover:bg-slate-900/60 hover:border-slate-700 transition-colors space-y-2.5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-semibold text-[13px] text-slate-200">{act.title}</span>
                      {getOutcomeBadge(act.outcome)}
                      {act.duration && (
                        <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {Math.floor(act.duration / 60)}m {act.duration % 60}s
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 font-mono mt-0.5">
                      {formatDateTime(act.createdAt)}
                    </span>
                  </div>

                  {act.description && (
                    <p className="text-[13px] text-slate-300 leading-relaxed">{act.description}</p>
                  )}

                  {/* Notes snippet or toggle */}
                  {act.notes && (
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[13px] text-slate-300 mt-3">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Remarks & Context
                      </p>
                      <p className="leading-relaxed italic">"{act.notes}"</p>
                    </div>
                  )}

                  {/* User footer */}
                  {act.user && (
                    <div className="flex items-center gap-1.5 pt-2 text-[11px] text-slate-500 font-medium">
                      <span>Logged by</span>
                      <span className="font-semibold text-slate-400">{act.user.name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
