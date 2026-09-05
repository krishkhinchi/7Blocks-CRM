import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className
}) => {
  const variants = {
    default: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    neutral: 'bg-slate-500/10 text-slate-300 border-slate-500/20 dark:text-slate-400'
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-md border font-sans tracking-wide',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'NEW':
      return <Badge variant="neutral">New</Badge>;
    case 'CONTACTED':
      return <Badge variant="info">Contacted</Badge>;
    case 'INTERESTED':
      return <Badge variant="success">Interested</Badge>;
    case 'CALLBACK_SCHEDULED':
      return <Badge variant="warning">Callback Due</Badge>;
    case 'DEMO_SCHEDULED':
      return <Badge variant="purple">Demo Scheduled</Badge>;
    case 'MEETING_SCHEDULED':
      return <Badge variant="purple">Meeting Scheduled</Badge>;
    case 'PROPOSAL_SENT':
      return <Badge variant="info">Proposal Sent</Badge>;
    case 'NEGOTIATION':
      return <Badge variant="warning">Negotiation</Badge>;
    case 'WON':
    case 'CLOSED_WON':
      return <Badge variant="success">Won</Badge>;
    case 'LOST':
    case 'CLOSED_LOST':
      return <Badge variant="danger">Lost</Badge>;
    case 'DO_NOT_CONTACT':
      return <Badge variant="danger">Do Not Contact</Badge>;
    case 'UNRESPONSIVE':
      return <Badge variant="neutral">Unresponsive</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};
