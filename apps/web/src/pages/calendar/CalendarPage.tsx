import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Video, MapPin, CheckSquare, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';
import { formatDateTime, formatDate } from '../../lib/utils';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const CalendarPage: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [view, setView] = useState<'agenda' | 'month'>('agenda');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    contactId: '',
    startTime: '',
    endTime: '',
    location: 'Google Meet',
    meetingLink: '',
    notes: ''
  });

  const { success, error } = useToast();

  useEffect(() => {
    fetchEvents();
    api.get('/contacts?limit=50')
      .then(res => setContacts(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setContacts([]));
  }, []);

  const fetchEvents = async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        api.get('/meetings'),
        api.get('/tasks')
      ]);
      const rawMeetings = Array.isArray(mRes.data?.data) ? mRes.data.data : [];
      const rawTasks = Array.isArray(tRes.data?.data) ? tRes.data.data : [];
      setMeetings(rawMeetings);
      setTasks(rawTasks.filter((t: any) => t?.status === 'TODO'));
    } catch {
      setMeetings([]);
      setTasks([]);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title.trim() || !newMeeting.startTime) return;

    try {
      const end = newMeeting.endTime || new Date(new Date(newMeeting.startTime).getTime() + 45 * 60000).toISOString();
      await api.post('/meetings', {
        ...newMeeting,
        startTime: new Date(newMeeting.startTime).toISOString(),
        endTime: new Date(end).toISOString()
      });
      success('Meeting scheduled successfully');
      setShowScheduleModal(false);
      setNewMeeting({ title: '', contactId: '', startTime: '', endTime: '', location: 'Google Meet', meetingLink: '', notes: '' });
      fetchEvents();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to schedule meeting');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5 tracking-tight">
            <CalendarIcon className="w-6 h-6 text-accent-blue" />
            <span>Sales Calendar & Meeting Scheduler</span>
          </h1>
          <p className="text-[13px] text-slate-400 mt-1">
            Internal meeting planner and scheduled callback timelines.
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-200 text-[13px] font-semibold text-slate-900 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Meeting</span>
        </button>
      </div>

      {/* Agenda Feed View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meetings Section */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/60 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[15px] text-slate-100 flex items-center gap-2 tracking-tight">
              <Video className="w-5 h-5 text-accent-purple" />
              <span>Upcoming Client Meetings ({meetings.length})</span>
            </h3>
          </div>

          <div className="space-y-3 text-[13px]">
            {meetings.length === 0 ? (
              <p className="text-slate-500 py-6 text-center">No meetings scheduled.</p>
            ) : (
              meetings.map(m => (
                <div key={m.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:bg-slate-900/80 hover:border-slate-700 transition-all group space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-slate-100 text-[15px] tracking-tight group-hover:text-white transition-colors">{m.title}</span>
                    <Badge variant={m.status === 'COMPLETED' ? 'success' : 'purple'} size="sm">
                      {m.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-slate-400 text-[11px] font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {formatDateTime(m.startTime)}
                    </span>
                    {m.location && (
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {m.location}
                      </span>
                    )}
                  </div>

                  {m.contact && (
                    <div className="flex items-center gap-1.5 pt-2 text-[11px] text-accent-blue font-medium">
                      <User className="w-3.5 h-3.5" />
                      <span>{m.contact.fullName}</span>
                    </div>
                  )}

                  {m.meetingLink && (
                    <div className="pt-2">
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] text-accent-cyan hover:underline font-semibold"
                      >
                        <span>Join Meeting Link</span>
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scheduled Tasks / Action Items */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/60 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[15px] text-slate-100 flex items-center gap-2 tracking-tight">
              <CheckSquare className="w-5 h-5 text-accent-emerald" />
              <span>Pending Action Items & Follow-ups ({tasks.length})</span>
            </h3>
          </div>

          <div className="space-y-3 text-[13px]">
            {tasks.length === 0 ? (
              <p className="text-slate-500 py-6 text-center">No action items due.</p>
            ) : (
              tasks.slice(0, 8).map(t => (
                <div key={t.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:bg-slate-900/80 hover:border-slate-700 transition-all group flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium text-[15px] text-slate-200 truncate tracking-tight group-hover:text-white transition-colors">{t.title}</p>
                    {t.contact && (
                      <p className="text-[11px] text-slate-400 truncate font-medium">
                        Contact: {t.contact.fullName}
                      </p>
                    )}
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                      Due: {formatDateTime(t.dueDate)}
                    </span>
                  </div>

                  <Badge variant={t.priority === 'URGENT' ? 'danger' : t.priority === 'HIGH' ? 'warning' : 'neutral'} size="sm">
                    {t.priority}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Client Meeting"
        subtitle="Book online video consultation or in-person review"
        maxWidth="md"
      >
        <form onSubmit={handleSchedule} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Meeting Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Website Redesign & Portfolio Demo"
              value={newMeeting.title}
              onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Contact</label>
            <select
              value={newMeeting.contactId}
              onChange={e => setNewMeeting({ ...newMeeting, contactId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              <option value="">Select a contact...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.fullName} {c.company ? `(${c.company.name})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Start Time *</label>
              <input
                type="datetime-local"
                required
                value={newMeeting.startTime}
                onChange={e => setNewMeeting({ ...newMeeting, startTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Location</label>
              <input
                type="text"
                placeholder="Google Meet / Zoom / Offline"
                value={newMeeting.location}
                onChange={e => setNewMeeting({ ...newMeeting, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Meeting Link</label>
            <input
              type="url"
              placeholder="https://meet.google.com/xyz-7blk-crm"
              value={newMeeting.meetingLink}
              onChange={e => setNewMeeting({ ...newMeeting, meetingLink: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors"
            >
              Schedule Meeting
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
