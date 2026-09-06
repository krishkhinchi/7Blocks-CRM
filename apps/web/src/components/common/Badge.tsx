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
    default: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
    success: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
    warning: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
    danger: 'bg-accent-rose/10 text-accent-rose border-accent-rose/20',
    info: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
    purple: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700/50'
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
