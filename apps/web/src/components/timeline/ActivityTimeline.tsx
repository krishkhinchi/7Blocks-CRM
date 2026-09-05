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
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1">
          {(['ALL', 'CALLS', 'EMAILS', 'MEETINGS', 'NOTES'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                filter === tab
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab === 'ALL' ? `All (${safeActivities.length})` : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {onLogCall && (
            <button
              onClick={onLogCall}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors"
            >
              + Log Call
            </button>
          )}
          {onSendEmail && (
            <button
              onClick={onSendEmail}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors"
            >
              + Send Email
            </button>
          )}
        </div>
      </div>

      {/* Feed List */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500 py-6">No activity recorded for this filter.</p>
        ) : (
          filtered.map(act => {
            const isExpanded = expandedId === act.id;
            return (
              <div key={act.id} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                  {getActivityIcon(act.type)}
                </div>

                {/* Content Box */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-slate-100">{act.title}</span>
                      {getOutcomeBadge(act.outcome)}
                      {act.duration && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3" />
                          {Math.floor(act.duration / 60)}m {act.duration % 60}s
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {formatDateTime(act.createdAt)}
                    </span>
                  </div>

                  {act.description && (
                    <p className="text-xs text-slate-300 leading-relaxed">{act.description}</p>
                  )}

                  {/* Notes snippet or toggle */}
                  {act.notes && (
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 mt-2">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                        Remarks & Context
                      </p>
                      <p className="leading-relaxed italic">"{act.notes}"</p>
                    </div>
                  )}

                  {/* User footer */}
                  {act.user && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                      <span>Logged by</span>
                      <span className="font-medium text-slate-400">{act.user.name}</span>
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
