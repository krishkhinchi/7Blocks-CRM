import React from 'react';
import { LucideIcon, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-14 text-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/40">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-300 mb-5 shadow-sm">
        <Icon className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="text-[13px] text-slate-400 max-w-sm mt-1.5 mb-6 leading-relaxed">
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-4 py-2 text-[13px] font-semibold rounded-lg bg-white hover:bg-slate-200 text-slate-900 shadow-sm transition-colors"
            >
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2 text-[13px] font-medium rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
