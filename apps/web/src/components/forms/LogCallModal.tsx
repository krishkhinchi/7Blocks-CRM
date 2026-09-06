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
      <form onSubmit={handleSubmit} className="space-y-5 text-[13px]">
        {/* Contact Picker if not provided */}
        {!defaultContactId && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Contact *</label>
            <select
              value={contactId}
              onChange={e => setContactId(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none transition-colors"
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

        <div className="grid grid-cols-2 gap-4">
          {/* Call Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Call Type</label>
            <select
              value={callType}
              onChange={e => setCallType(e.target.value as any)}
              className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none transition-colors"
            >
              <option value="COLD_CALL">Cold Call</option>
              <option value="WARM_CALL">Follow-up Call</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Duration (minutes)</label>
            <input
              type="number"
              min="0"
              max="120"
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Outcome */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Call Outcome *</label>
          <select
            value={outcome}
            onChange={e => setOutcome(e.target.value)}
            className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none font-medium transition-colors"
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
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Call Notes & Client Remarks</label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Discussed website update. Boss requested callback at 5:30 PM with pricing..."
            className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none resize-none transition-colors placeholder:text-slate-600"
          />
        </div>

        {/* Follow-up Section */}
        <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/60 space-y-4 shadow-sm">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={followUpRequired}
              onChange={e => setFollowUpRequired(e.target.checked)}
              className="rounded bg-slate-950/60 border-slate-700 text-accent-blue focus:ring-accent-blue w-4 h-4"
            />
            <span className="font-semibold text-[13px] text-slate-200">Follow-up Required (Automatically creates task)</span>
          </label>

          {followUpRequired && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Follow-up Date & Time *</label>
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-slate-100 focus:border-accent-blue focus:outline-none transition-colors text-[13px] text-slate-300"
                  required={followUpRequired}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Task Title</label>
                <input
                  type="text"
                  value={followUpTaskTitle}
                  onChange={e => setFollowUpTaskTitle(e.target.value)}
                  placeholder="e.g. Call back boss at 5:30 PM"
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-slate-100 focus:border-accent-blue focus:outline-none transition-colors text-[13px] placeholder:text-slate-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors font-semibold text-[13px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-900 font-bold transition-colors disabled:opacity-50 text-[13px] shadow-sm"
          >
            {loading ? 'Logging...' : 'Save Call & Next Action'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
