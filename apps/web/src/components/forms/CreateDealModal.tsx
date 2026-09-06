import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultContactId?: string;
  defaultCompanyId?: string;
  onSuccess?: () => void;
}

export const CreateDealModal: React.FC<CreateDealModalProps> = ({
  isOpen,
  onClose,
  defaultContactId,
  defaultCompanyId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    currency: 'INR',
    stage: 'PROSPECTING',
    probability: 10,
    expectedCloseDate: '',
    serviceType: 'WEBSITE_NEW',
    contactId: defaultContactId || '',
    companyId: defaultCompanyId || '',
    description: ''
  });

  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (!defaultContactId) {
        api.get('/contacts?limit=50').then(res => setContacts(res.data.data)).catch(() => {});
      }
      if (!defaultCompanyId) {
        api.get('/companies?limit=50').then(res => setCompanies(res.data.data)).catch(() => {});
      }
    }
  }, [isOpen, defaultContactId, defaultCompanyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Deal name is required.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/deals', {
        ...formData,
        value: Number(formData.value) || 0,
        expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate).toISOString() : undefined
      });
      success('Deal added to pipeline successfully');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Deal / Opportunity"
      subtitle="Track proposal value, stage, and revenue probability"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-[13px]">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Deal Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Gold Coast Gym Website Redesign & SEO"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none transition-colors placeholder:text-slate-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Deal Value (₹ INR) *</label>
            <input
              type="number"
              min="0"
              required
              placeholder="e.g. 85000"
              value={formData.value}
              onChange={e => setFormData({ ...formData, value: e.target.value })}
              className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none font-mono transition-colors placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Pipeline Stage</label>
            <select
              value={formData.stage}
              onChange={e => setFormData({ ...formData, stage: e.target.value })}
              className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none font-medium transition-colors"
            >
              <option value="PROSPECTING">Prospecting (10%)</option>
              <option value="QUALIFICATION">Qualification (30%)</option>
              <option value="PROPOSAL">Proposal (60%)</option>
              <option value="NEGOTIATION">Negotiation (80%)</option>
              <option value="CLOSED_WON">Closed Won (100%)</option>
              <option value="CLOSED_LOST">Closed Lost (0%)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Service Type</label>
            <select
              value={formData.serviceType}
              onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
              className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none transition-colors"
            >
              <option value="WEBSITE_NEW">Website (New)</option>
              <option value="WEBSITE_REDESIGN">Website Redesign</option>
              <option value="WEB_APP">Web Application</option>
              <option value="MOBILE_APP">Mobile App</option>
              <option value="AUTOMATION">Automation & CRM</option>
              <option value="SAAS">SaaS Product</option>
              <option value="CUSTOM_SOFTWARE">Custom Software</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Expected Close Date</label>
            <input
              type="date"
              value={formData.expectedCloseDate}
              onChange={e => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none transition-colors text-slate-400"
            />
          </div>
        </div>

        {!defaultContactId && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Associated Contact</label>
            <select
              value={formData.contactId}
              onChange={e => setFormData({ ...formData, contactId: e.target.value })}
              className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none transition-colors"
            >
              <option value="">Select a contact...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.fullName} {c.company ? `(${c.company.name})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes / Deal Context</label>
          <textarea
            rows={2}
            placeholder="Key deliverables, timeline expectations, tech stack..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-accent-blue focus:outline-none resize-none transition-colors placeholder:text-slate-600"
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
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-900 font-bold transition-colors disabled:opacity-50 text-[13px] shadow-sm"
          >
            {loading ? 'Creating...' : 'Create Deal'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
