import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle2, Eye, MessageSquare, AlertCircle, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';
import { Badge } from '../../components/common/Badge';
import { formatDateTime } from '../../lib/utils';
import { SendEmailModal } from '../../components/forms/SendEmailModal';

export const EmailsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const { success, error } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, tmplRes, logsRes] = await Promise.all([
        api.get('/emails/status'),
        api.get('/emails/templates'),
        api.get('/emails/logs')
      ]);
      setIsConfigured(statusRes.data?.data?.isConfigured ?? false);
      const tmpls = Array.isArray(tmplRes.data?.data) ? tmplRes.data.data : [];
      const rawLogs = Array.isArray(logsRes.data?.data) ? logsRes.data.data : [];
      setTemplates(tmpls);
      setLogs(rawLogs);
      if (tmpls.length > 0) {
        setSelectedTemplate(tmpls[0]);
      }
    } catch {
      setTemplates([]);
      setLogs([]);
    }
  };

  // Test webhook simulation
  const simulateEvent = async (event: 'open' | 'reply', email: string) => {
    try {
      await api.post('/emails/webhook', {
        event,
        email,
        timestamp: Date.now()
      });
      success(`Simulated '${event}' webhook`, `Processed event for ${email}`);
      fetchData();
    } catch {
      error('Webhook simulation failed');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-400" />
            <span>Email Outreach & Campaign History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage cold email outreach, track delivery, opens, and client replies.
          </p>
        </div>

        <button
          onClick={() => setShowSendModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Compose Email</span>
        </button>
      </div>

      {/* Integration Status Notice */}
      <div className="p-4 rounded-xl border bg-slate-900/80 flex items-start gap-3">
        {isConfigured ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-200">Email Gateway Connected</span>
              <p className="text-slate-400 mt-0.5">
                SMTP / SendGrid provider configured. Outbound emails are tracked with real-time webhooks.
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-200">Email Credentials Not Configured</span>
              <p className="text-slate-400 mt-0.5">
                SMTP or SendGrid keys are currently unconfigured in .env. Outbound emails will display a setup alert. You can still preview templates, log communication, and simulate webhook delivery.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Two Columns: Sent Log & Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sent Logs (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-slate-100">Outreach Dispatch Log</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Sent Time</th>
                  <th className="py-2.5 px-3 text-right">Webhook Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                      No emails sent yet.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-200 truncate max-w-[140px]">
                        {log.to}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans truncate max-w-[180px]">
                        {log.subject}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={log.status === 'REPLIED' ? 'success' : log.status === 'OPENED' ? 'info' : 'neutral'}
                          size="sm"
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 font-sans">
                          <button
                            onClick={() => simulateEvent('open', log.to)}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800 hover:bg-cyan-900/60"
                            title="Simulate open webhook"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => simulateEvent('reply', log.to)}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60"
                            title="Simulate reply webhook"
                          >
                            Reply
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Templates Library (1 col) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-slate-100">Template Library</h3>
          <div className="space-y-2 text-xs">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`w-full p-3 rounded-xl border text-left transition-colors ${
                  selectedTemplate?.id === t.id
                    ? 'bg-brand-950/40 border-brand-500 text-slate-100'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <p className="font-semibold">{t.name}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{t.subject}</p>
              </button>
            ))}
          </div>

          {selectedTemplate && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Template Preview
              </span>
              <p className="font-semibold text-slate-200">Subject: {selectedTemplate.subject}</p>
              <pre className="text-[11px] text-slate-400 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {selectedTemplate.body}
              </pre>
            </div>
          )}
        </div>
      </div>

      <SendEmailModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};
