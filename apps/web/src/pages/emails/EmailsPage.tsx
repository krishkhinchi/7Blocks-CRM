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
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5 tracking-tight">
            <Mail className="w-6 h-6 text-accent-cyan" />
            <span>Email Outreach & Campaign History</span>
          </h1>
          <p className="text-[13px] text-slate-400 mt-1">
            Manage cold email outreach, track delivery, opens, and client replies.
          </p>
        </div>

        <button
          onClick={() => setShowSendModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-200 text-[13px] font-semibold text-slate-900 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Compose Email</span>
        </button>
      </div>

      {/* Integration Status Notice */}
      <div className="p-4 rounded-xl border bg-slate-900/60 shadow-sm flex items-start gap-3">
        {isConfigured ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-accent-emerald shrink-0 mt-0.5" />
            <div className="text-[13px]">
              <span className="font-semibold text-slate-200">Email Gateway Connected</span>
              <p className="text-slate-400 mt-0.5">
                SMTP / SendGrid provider configured. Outbound emails are tracked with real-time webhooks.
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-accent-rose shrink-0 mt-0.5" />
            <div className="text-[13px]">
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
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-4">
          <h3 className="font-semibold text-[15px] text-slate-100 tracking-tight">Outreach Dispatch Log</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left">
              <thead className="text-[11px] font-semibold tracking-wider text-slate-400 border-b border-slate-800/60">
                <tr>
                  <th className="py-3 px-3 uppercase">Recipient</th>
                  <th className="py-3 px-3 uppercase">Subject</th>
                  <th className="py-3 px-3 uppercase">Status</th>
                  <th className="py-3 px-3 uppercase">Sent Time</th>
                  <th className="py-3 px-3 text-right uppercase">Webhook Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No emails sent yet.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3.5 px-3 font-medium text-slate-200 truncate max-w-[140px] group-hover:text-white transition-colors">
                        {log.to}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 truncate max-w-[180px]">
                        {log.subject}
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={log.status === 'REPLIED' ? 'success' : log.status === 'OPENED' ? 'info' : 'neutral'}
                          size="sm"
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 text-[11px] font-mono">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => simulateEvent('open', log.to)}
                            className="px-2 py-1 text-[11px] font-medium rounded text-slate-400 hover:text-accent-cyan hover:bg-slate-800 transition-colors"
                            title="Simulate open webhook"
                          >
                            Simulate Open
                          </button>
                          <button
                            onClick={() => simulateEvent('reply', log.to)}
                            className="px-2 py-1 text-[11px] font-medium rounded text-slate-400 hover:text-accent-emerald hover:bg-slate-800 transition-colors"
                            title="Simulate reply webhook"
                          >
                            Simulate Reply
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
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-4">
          <h3 className="font-semibold text-[15px] text-slate-100 tracking-tight">Template Library</h3>
          <div className="space-y-2 text-[13px]">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                  selectedTemplate?.id === t.id
                    ? 'bg-accent-blue/10 border-accent-blue/40 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <p className={`font-semibold ${selectedTemplate?.id === t.id ? 'text-accent-blue' : 'text-slate-200'}`}>{t.name}</p>
                <p className="text-[12px] text-slate-400 truncate mt-1">{t.subject}</p>
              </button>
            ))}
          </div>

          {selectedTemplate && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[13px] space-y-3 mt-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Template Preview
              </span>
              <p className="font-medium text-slate-200">Subject: {selectedTemplate.subject}</p>
              <pre className="text-[13px] text-slate-300 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto mt-2">
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
