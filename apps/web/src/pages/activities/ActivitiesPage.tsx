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
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-400" />
            <span>Master Activity & Communication Stream</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-only audit trail of cold calls, outreach emails, client replies, and meetings.
          </p>
        </div>

        <button
          onClick={() => setShowLogCall(true)}
          className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          + Log Call
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading activity stream...</div>
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
