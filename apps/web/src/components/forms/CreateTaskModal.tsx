import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultContactId?: string;
  defaultContactName?: string;
  onSuccess?: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  defaultContactId,
  defaultContactName,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM',
    contactId: defaultContactId || ''
  });

  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Default due date to tomorrow 11:00 AM
      const tomorrow = new Date(Date.now() + 86400000);
      tomorrow.setHours(11, 0, 0, 0);
      const tzOffset = tomorrow.getTimezoneOffset() * 60000;
      const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);

      setFormData(prev => ({ ...prev, dueDate: localISOTime }));

      if (!defaultContactId) {
        api.get('/contacts?limit=50').then(res => setContacts(res.data.data)).catch(() => {});
      }
    }
  }, [isOpen, defaultContactId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dueDate) {
      error('Title and Due Date are required.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/tasks', {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString()
      });
      success('Task scheduled successfully');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Task / Follow-up"
      subtitle={defaultContactName ? `Schedule task for ${defaultContactName}` : 'Set a reminder or action item for yourself'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-300 mb-1">Task Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Call back boss regarding proposal milestones"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Due Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none font-medium"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {!defaultContactId && (
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Associated Contact</label>
            <select
              value={formData.contactId}
              onChange={e => setFormData({ ...formData, contactId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              <option value="">None / General Task</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.fullName} {c.company ? `(${c.company.name})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-300 mb-1">Description / Details</label>
          <textarea
            rows={3}
            placeholder="Context, requirements, links or discussion notes..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Scheduling...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
