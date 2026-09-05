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
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-300 mb-1">Deal Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Gold Coast Gym Website Redesign & SEO"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Deal Value (₹ INR) *</label>
            <input
              type="number"
              min="0"
              required
              placeholder="e.g. 85000"
              value={formData.value}
              onChange={e => setFormData({ ...formData, value: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Pipeline Stage</label>
            <select
              value={formData.stage}
              onChange={e => setFormData({ ...formData, stage: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none font-medium"
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Service Type</label>
            <select
              value={formData.serviceType}
              onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
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
            <label className="block font-semibold text-slate-300 mb-1">Expected Close Date</label>
            <input
              type="date"
              value={formData.expectedCloseDate}
              onChange={e => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {!defaultContactId && (
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Associated Contact</label>
            <select
              value={formData.contactId}
              onChange={e => setFormData({ ...formData, contactId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              <option value="">Select a contact...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.fullName} {c.company ? `(${c.company.name})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-300 mb-1">Notes / Deal Context</label>
          <textarea
            rows={2}
            placeholder="Key deliverables, timeline expectations, tech stack..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none resize-none"
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
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Deal'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
