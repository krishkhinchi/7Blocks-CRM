import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: {
    id: string;
    fullName: string;
    firstName: string;
    email: string | null;
    company?: { name: string; website?: string | null } | null;
    website?: string | null;
  };
  onSuccess?: () => void;
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  contact,
  onSuccess
}) => {
  const [to, setTo] = useState(contact?.email || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (contact?.email) setTo(contact.email);
      api.get('/emails/status').then(res => setIsConfigured(res.data.data.isConfigured)).catch(() => {});
      api.get('/emails/templates').then(res => setTemplates(res.data.data)).catch(() => {});
    }
  }, [isOpen, contact]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;

    const t = templates.find(item => item.id === templateId);
    if (!t) return;

    const vars: Record<string, string> = {
      firstName: contact?.firstName || contact?.fullName?.split(' ')[0] || 'there',
      companyName: contact?.company?.name || 'your gym',
      website: contact?.company?.website || contact?.website || 'your website',
      senderName: 'Krish Khinchi'
    };

    let renderedSubject = t.subject;
    let renderedBody = t.body;

    for (const [k, v] of Object.entries(vars)) {
      const reg = new RegExp(`{{${k}}}`, 'g');
      renderedSubject = renderedSubject.replace(reg, v);
      renderedBody = renderedBody.replace(reg, v);
    }

    setSubject(renderedSubject);
    setBody(renderedBody);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !body.trim()) {
      error('Recipient, Subject and Email Body are required.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/emails/send', {
        to,
        subject,
        body,
        contactId: contact?.id
      });
      success('Email sent successfully', 'Logged to activity timeline.');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose & Send Email"
      subtitle={contact ? `Sending outreach email to ${contact.fullName}` : 'Compose sales email'}
      maxWidth="lg"
    >
      <form onSubmit={handleSend} className="space-y-5 text-[13px]">
        {isConfigured === false && (
          <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose">
            <p className="font-semibold text-[13px]">Email Integration Not Configured</p>
            <p className="text-[12px] opacity-90 mt-1">
              SMTP or SendGrid credentials are not set in .env. Outbound sending is simulated or paused until configured in Settings.
            </p>
          </div>
        )}

        {/* Template Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Email Template</label>
          <select
            value={selectedTemplate}
            onChange={e => handleTemplateChange(e.target.value)}
            className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none transition-colors"
          >
            <option value="">Choose a pre-built template or write custom...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* To */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">To *</label>
          <input
            type="email"
            required
            placeholder="client@example.com"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none transition-colors placeholder:text-slate-600"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject *</label>
          <input
            type="text"
            required
            placeholder="Email subject line..."
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none font-medium transition-colors placeholder:text-slate-600"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Message Body *</label>
          <textarea
            rows={8}
            required
            placeholder="Write your email body..."
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none resize-none font-sans leading-relaxed transition-colors placeholder:text-slate-600"
          />
        </div>

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
            disabled={loading || isConfigured === false}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-900 font-bold transition-colors disabled:opacity-50 text-[13px] shadow-sm"
          >
            {loading ? 'Sending...' : 'Send Outreach Email'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
