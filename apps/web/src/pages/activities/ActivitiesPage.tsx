import React, { useState, useEffect } from 'react';
import { History, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { ActivityTimeline } from '../../components/timeline/ActivityTimeline';
import { LogCallModal } from '../../components/forms/LogCallModal';

export const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogCall, setShowLogCall] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activities?limit=100');
      const raw = res.data?.data ?? res.data;
      setActivities(Array.isArray(raw) ? raw : []);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5 tracking-tight">
            <History className="w-5 h-5 text-accent-blue" />
            <span>Master Activity & Communication Stream</span>
          </h1>
          <p className="text-[13px] text-slate-400 mt-1">
            Append-only audit trail of cold calls, outreach emails, client replies, and meetings.
          </p>
        </div>

        <button
          onClick={() => setShowLogCall(true)}
          className="px-4 py-2 rounded-lg bg-white hover:bg-slate-200 text-slate-900 text-[13px] font-semibold shadow-sm transition-colors"
        >
          + Log Call
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-[13px]">Loading activity stream...</div>
        ) : (
          <ActivityTimeline
            activities={activities}
            onLogCall={() => setShowLogCall(true)}
          />
        )}
      </div>

      <LogCallModal
        isOpen={showLogCall}
        onClose={() => setShowLogCall(false)}
        onSuccess={fetchActivities}
      />
    </div>
  );
};
