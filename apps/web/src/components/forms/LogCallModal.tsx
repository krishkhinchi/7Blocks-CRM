import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';

interface LogCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId?: string;
  contactName?: string;
  onSuccess?: () => void;
}

export const LogCallModal: React.FC<LogCallModalProps> = ({
  isOpen,
  onClose,
  contactId: defaultContactId,
  contactName: defaultContactName,
  onSuccess
}) => {
  const [contactId, setContactId] = useState(defaultContactId || '');
  const [contacts, setContacts] = useState<any[]>([]);
  const [callType, setCallType] = useState<'COLD_CALL' | 'WARM_CALL'>('COLD_CALL');
  const [outcome, setOutcome] = useState('CALLBACK_REQUESTED');
  const [durationMinutes, setDurationMinutes] = useState(3);
  const [notes, setNotes] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(true);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTaskTitle, setFollowUpTaskTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    if (defaultContactId) {
      setContactId(defaultContactId);
    } else if (isOpen) {
      api.get('/contacts?limit=50').then(res => setContacts(res.data.data)).catch(() => {});
    }
  }, [defaultContactId, isOpen]);

  useEffect(() => {
    if (outcome === 'CALLBACK_REQUESTED') {
      setFollowUpRequired(true);
      if (!followUpTaskTitle && defaultContactName) {
        setFollowUpTaskTitle(`Call back ${defaultContactName}`);
      }
    }
  }, [outcome, defaultContactName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) {
      error('Please select a contact.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/activities/call', {
        contactId,
        callType,
        outcome,
        durationSeconds: durationMinutes * 60,
        notes,
        followUpRequired,
        followUpDate: followUpRequired && followUpDate ? new Date(followUpDate).toISOString() : undefined,
        followUpTaskTitle: followUpRequired ? followUpTaskTitle : undefined
      });

      success('Call logged successfully', followUpRequired ? 'Follow-up task scheduled.' : undefined);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to log call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Call Interaction"
      subtitle={defaultContactName ? `Recording call with ${defaultContactName}` : 'Record call outcome, duration & schedule follow-up'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Contact Picker if not provided */}
        {!defaultContactId && (
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Select Contact *</label>
            <select
              value={contactId}
              onChange={e => setContactId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
              required
            >
              <option value="">Choose a contact...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.fullName} {c.company ? `(${c.company.name})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Call Type */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Call Type</label>
            <select
              value={callType}
              onChange={e => setCallType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              <option value="COLD_CALL">Cold Call</option>
              <option value="WARM_CALL">Follow-up Call</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Duration (minutes)</label>
            <input
              type="number"
              min="0"
              max="120"
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Outcome */}
        <div>
          <label className="block font-semibold text-slate-300 mb-1">Call Outcome *</label>
          <select
            value={outcome}
            onChange={e => setOutcome(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none font-medium"
          >
            <option value="INTERESTED">Interested (Lead score +20)</option>
            <option value="CALLBACK_REQUESTED">Callback Requested (Follow-up scheduled)</option>
            <option value="DEMO_REQUESTED">Demo Requested (Send deck/video)</option>
            <option value="MEETING_REQUESTED">Meeting Requested (Schedule consultation)</option>
            <option value="BUSY">Busy / Asked to call back later</option>
            <option value="NO_ANSWER">No Answer / Call not received</option>
            <option value="NOT_INTERESTED">Not Interested</option>
            <option value="ALREADY_HAS_SOLUTION">Already Has Solution / Software</option>
            <option value="DO_NOT_CONTACT">Do Not Contact / Blocked</option>
            <option value="WRONG_NUMBER">Wrong Number</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold text-slate-300 mb-1">Call Notes & Client Remarks</label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Discussed website update. Boss requested callback at 5:30 PM with pricing..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-brand-500 focus:outline-none resize-none"
          />
        </div>

        {/* Follow-up Section */}
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={followUpRequired}
              onChange={e => setFollowUpRequired(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-brand-500"
            />
            <span className="font-semibold text-slate-200">Follow-up Required (Automatically creates task)</span>
          </label>

          {followUpRequired && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Follow-up Date & Time *</label>
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                  required={followUpRequired}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Task Title</label>
                <input
                  type="text"
                  value={followUpTaskTitle}
                  onChange={e => setFollowUpTaskTitle(e.target.value)}
                  placeholder="e.g. Call back boss at 5:30 PM"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
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
            {loading ? 'Logging...' : 'Save Call & Next Action'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
