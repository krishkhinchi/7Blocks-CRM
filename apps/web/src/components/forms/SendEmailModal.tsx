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
      <form onSubmit={handleSend} className="space-y-4 text-xs">
        {isConfigured === false && (
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200">
            <p className="font-semibold text-xs">Email Integration Not Configured</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              SMTP or SendGrid credentials are not set in .env. Outbound sending is simulated or paused until configured in Settings.
            </p>
          </div>
        )}

        {/* Template Selector */}
        <div>
          <label className="block font-semibold text-slate-300 mb-1">Select Email Template</label>
          <select
            value={selectedTemplate}
            onChange={e => handleTemplateChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
          >
            <option value="">Choose a pre-built template or write custom...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* To */}
        <div>
          <label className="block font-semibold text-slate-300 mb-1">To *</label>
          <input
            type="email"
            required
            placeholder="client@example.com"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block font-semibold text-slate-300 mb-1">Subject *</label>
          <input
            type="text"
            required
            placeholder="Email subject line..."
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none font-medium"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block font-semibold text-slate-300 mb-1">Message Body *</label>
          <textarea
            rows={8}
            required
            placeholder="Write your email body..."
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-brand-500 focus:outline-none resize-none font-sans leading-relaxed"
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
            disabled={loading || isConfigured === false}
            className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Outreach Email'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
