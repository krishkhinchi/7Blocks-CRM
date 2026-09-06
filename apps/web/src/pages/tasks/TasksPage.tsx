import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Building2,
  Trash2
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';
import { Badge } from '../../components/common/Badge';
import { formatDateTime, formatDate } from '../../lib/utils';
import { CreateTaskModal } from '../../components/forms/CreateTaskModal';

export const TasksPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'upcoming' | 'completed'>('today');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks/categorized');
      const d = res.data?.data || {};
      const normalizedData = {
        overdue: Array.isArray(d.overdue) ? d.overdue : [],
        today: Array.isArray(d.today) ? d.today : [],
        tomorrow: Array.isArray(d.tomorrow) ? d.tomorrow : [],
        thisWeek: Array.isArray(d.thisWeek) ? d.thisWeek : [],
        upcoming: Array.isArray(d.upcoming) ? d.upcoming : [],
        completed: Array.isArray(d.completed) ? d.completed : [],
        stats: d.stats || { overdueCount: 0, todayCount: 0, totalPending: 0, completedCount: 0 }
      };
      setData(normalizedData);
      // Auto switch to overdue if today is empty and overdue has items
      if (normalizedData.today.length === 0 && normalizedData.overdue.length > 0) {
        setActiveTab('overdue');
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (taskId: string) => {
    try {
      await api.patch(`/tasks/${taskId}/toggle`);
      success('Task status updated');
      fetchTasks();
    } catch (err: any) {
      error('Failed to update task');
    }
  };

  const handleDelete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/tasks/${taskId}`);
      success('Task removed');
      fetchTasks();
    } catch {
      error('Failed to delete task');
    }
  };

  const tasksList = data ? data[activeTab] || [] : [];
  const stats = data?.stats || { overdueCount: 0, todayCount: 0, totalPending: 0, completedCount: 0 };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5 tracking-tight">
            <CheckSquare className="w-6 h-6 text-accent-emerald" />
            <span>Tasks & Follow-up Engine</span>
          </h1>
          <p className="text-[13px] text-slate-400 mt-1">
            Never lose a lead: track scheduled callbacks, demo dispatches, and meetings.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-200 text-[13px] font-semibold text-slate-900 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Categorized Tabs Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800/60 overflow-x-auto text-[13px] shadow-sm">
        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-colors shrink-0 ${
            activeTab === 'overdue'
              ? 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-accent-rose" />
          <span>Overdue</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${activeTab === 'overdue' ? 'bg-accent-rose/20' : 'bg-slate-800/60 text-slate-300'}`}>
            {stats.overdueCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-colors shrink-0 ${
            activeTab === 'today'
              ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <Clock className="w-4 h-4 text-accent-blue" />
          <span>Due Today</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${activeTab === 'today' ? 'bg-accent-blue/20' : 'bg-slate-800/60 text-slate-300'}`}>
            {stats.todayCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tomorrow')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-colors shrink-0 ${
            activeTab === 'tomorrow'
              ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <span>Tomorrow</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${activeTab === 'tomorrow' ? 'bg-accent-blue/20' : 'bg-slate-800/60 text-slate-300'}`}>
            {data?.tomorrow?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('thisWeek')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-colors shrink-0 ${
            activeTab === 'thisWeek'
              ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <span>This Week</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${activeTab === 'thisWeek' ? 'bg-accent-blue/20' : 'bg-slate-800/60 text-slate-300'}`}>
            {data?.thisWeek?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-colors shrink-0 ${
            activeTab === 'upcoming'
              ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <span>Later / Upcoming</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${activeTab === 'upcoming' ? 'bg-accent-blue/20' : 'bg-slate-800/60 text-slate-300'}`}>
            {data?.upcoming?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-colors shrink-0 ${
            activeTab === 'completed'
              ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <span>Completed</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${activeTab === 'completed' ? 'bg-accent-emerald/20' : 'bg-slate-800/60 text-slate-300'}`}>
            {stats.completedCount}
          </span>
        </button>
      </div>

      {/* Task Cards List */}
      <div className="space-y-4">
        {loading && !data ? (
          <div className="p-12 text-center text-slate-500 text-[13px]">Loading tasks...</div>
        ) : tasksList.length === 0 ? (
          <div className="p-12 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-[13px]">
            No tasks in this category. All caught up!
          </div>
        ) : (
          tasksList.map((task: any) => (
            <div
              key={task.id}
              onClick={() => task.contactId && navigate(`/contacts/${task.contactId}`)}
              className={`p-4 rounded-xl border border-slate-800/60 bg-slate-900 shadow-sm hover:border-slate-700 hover:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors group ${
                task.status === 'COMPLETED' ? 'opacity-60 bg-slate-950/40' : ''
              }`}
            >
              <div className="flex items-start gap-4 min-w-0">
                <input
                  type="checkbox"
                  checked={task.status === 'COMPLETED'}
                  onChange={e => {
                    e.stopPropagation();
                    handleToggle(task.id);
                  }}
                  className="rounded bg-slate-950 border-slate-700 text-accent-emerald focus:ring-accent-emerald mt-1 cursor-pointer w-4 h-4"
                />

                <div className="min-w-0 space-y-1.5">
                  <p className={`font-semibold text-[15px] text-slate-200 group-hover:text-accent-blue transition-colors tracking-tight ${task.status === 'COMPLETED' ? 'line-through text-slate-500' : ''}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-[13px] text-slate-400 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap mt-1">
                    {task.contact && (
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {task.contact.fullName}
                      </span>
                    )}
                    {task.company && (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {task.company.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 font-mono text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Due {formatDateTime(task.dueDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <Badge variant={task.priority === 'URGENT' ? 'danger' : task.priority === 'HIGH' ? 'warning' : 'neutral'} size="sm">
                  {task.priority}
                </Badge>
                <button
                  onClick={e => handleDelete(task.id, e)}
                  className="p-1.5 text-slate-500 hover:text-accent-rose hover:bg-slate-800 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchTasks}
      />
    </div>
  );
};
