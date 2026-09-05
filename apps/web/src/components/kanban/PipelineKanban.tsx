import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  DragEndEvent
} from '@dnd-kit/core';
import { Building2, Calendar, User, CheckSquare } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Badge } from '../common/Badge';

export interface Deal {
  id: string;
  name: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expectedCloseDate?: string | null;
  serviceType?: string | null;
  company?: { name: string } | null;
  contact?: { fullName: string } | null;
  owner?: { name: string; avatar?: string | null } | null;
  tasks?: Array<{ id: string; title: string; dueDate: string }> | null;
}

export interface KanbanColumn {
  stage: string;
  title: string;
  count: number;
  totalValue: number;
  weightedValue: number;
  deals: Deal[];
}

interface PipelineKanbanProps {
  columns: KanbanColumn[];
  onStageChange: (dealId: string, newStage: string) => Promise<void>;
  onDealClick?: (deal: Deal) => void;
}

// Draggable Deal Card
const DealCard: React.FC<{ deal: Deal; onClick?: () => void }> = ({ deal, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal }
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : 1
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 shadow-sm cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'opacity-50 ring-2 ring-brand-500 shadow-xl' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-xs text-slate-100 line-clamp-2 leading-snug">
          {deal.name}
        </h4>
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="font-mono font-bold text-sm text-brand-400">
          {formatCurrency(deal.value, deal.currency)}
        </span>
        <Badge variant={deal.probability >= 80 ? 'success' : deal.probability >= 50 ? 'info' : 'neutral'} size="sm">
          {deal.probability}%
        </Badge>
      </div>

      <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
        {deal.company && (
          <div className="flex items-center gap-1.5 truncate">
            <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate text-slate-300">{deal.company.name}</span>
          </div>
        )}
        {deal.contact && (
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">{deal.contact.fullName}</span>
          </div>
        )}
        {deal.expectedCloseDate && (
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
            <span>Close: {formatDate(deal.expectedCloseDate)}</span>
          </div>
        )}
      </div>

      {/* Next Task Indicator */}
      {deal.tasks && deal.tasks.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center gap-1.5 text-[10px] text-amber-400">
          <CheckSquare className="w-3 h-3 shrink-0" />
          <span className="truncate">{deal.tasks[0].title}</span>
        </div>
      )}
    </div>
  );
};

// Droppable Column
const DroppableColumn: React.FC<{
  column: KanbanColumn;
  onDealClick?: (deal: Deal) => void;
}> = ({ column, onDealClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.stage
  });

  // Guard: ensure deals is always an array
  const deals: Deal[] = Array.isArray(column.deals) ? column.deals : [];

  const getStageAccent = (stage: string) => {
    switch (stage) {
      case 'PROSPECTING':
        return 'border-t-slate-500';
      case 'QUALIFICATION':
        return 'border-t-indigo-500';
      case 'PROPOSAL':
        return 'border-t-cyan-500';
      case 'NEGOTIATION':
        return 'border-t-amber-500';
      case 'CLOSED_WON':
        return 'border-t-emerald-500';
      case 'CLOSED_LOST':
        return 'border-t-rose-500';
      default:
        return 'border-t-slate-500';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 flex flex-col rounded-xl border border-slate-800/80 bg-slate-950/40 border-t-2 ${getStageAccent(
        column.stage
      )} transition-colors ${isOver ? 'bg-slate-900/60 ring-1 ring-brand-500/50' : ''}`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-200">{column.title}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
            {deals.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
          <span>{formatCurrency(column.totalValue || 0)}</span>
          <span className="text-[10px] text-slate-500">
            W: {formatCurrency(column.weightedValue || 0)}
          </span>
        </div>
      </div>

      {/* Cards Scroll Area */}
      <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-14rem)] min-h-[12rem]">
        {deals.map(deal => (
          <DealCard key={deal.id} deal={deal} onClick={() => onDealClick && onDealClick(deal)} />
        ))}
      </div>
    </div>
  );
};

export const PipelineKanban: React.FC<PipelineKanbanProps> = ({
  columns,
  onStageChange,
  onDealClick
}) => {
  const [kanbanCols, setKanbanCols] = useState(columns);

  React.useEffect(() => {
    setKanbanCols(columns);
  }, [columns]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const dealId = String(active.id);
    const targetStage = String(over.id);

    // Find deal's current stage
    let sourceStage = '';
    for (const col of kanbanCols) {
      const colDeals = Array.isArray(col.deals) ? col.deals : [];
      if (colDeals.some(d => d.id === dealId)) {
        sourceStage = col.stage;
        break;
      }
    }

    if (!sourceStage || sourceStage === targetStage) return;

    // Optimistic UI update
    setKanbanCols(prevCols => {
      const nextCols = JSON.parse(JSON.stringify(prevCols));
      let movedDeal: any = null;

      for (const col of nextCols) {
        if (col.stage === sourceStage) {
          const idx = col.deals.findIndex((d: any) => d.id === dealId);
          if (idx !== -1) {
            movedDeal = col.deals.splice(idx, 1)[0];
            col.count--;
            col.totalValue -= movedDeal.value;
          }
        }
      }

      if (movedDeal) {
        movedDeal.stage = targetStage;
        for (const col of nextCols) {
          if (col.stage === targetStage) {
            col.deals.push(movedDeal);
            col.count++;
            col.totalValue += movedDeal.value;
          }
        }
      }

      return nextCols;
    });

    // Call API
    try {
      await onStageChange(dealId, targetStage);
    } catch {
      // Revert if error
      setKanbanCols(columns);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {kanbanCols.map(col => (
          <DroppableColumn key={col.stage} column={col} onDealClick={onDealClick} />
        ))}
      </div>
    </DndContext>
  );
};
