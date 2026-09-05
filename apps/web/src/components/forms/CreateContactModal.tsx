import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateContactModal: React.FC<CreateContactModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    companyId: '',
    jobTitle: '',
    website: '',
    leadStatus: 'NEW',
    serviceInterest: 'WEBSITE_NEW',
    leadSource: 'COLD_OUTREACH'
  });

  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      api.get('/companies?limit=50').then(res => setCompanies(res.data.data)).catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      error('Full Name is required.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/contacts', formData);
      success('Contact created successfully');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to create contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Lead / Contact"
      subtitle="Add a new potential client or relationship to the CRM"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Kunal Sharma"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Job Title</label>
            <input
              type="text"
              placeholder="e.g. Founder & Head Coach"
              value={formData.jobTitle}
              onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="e.g. kunal@gymnacity.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="e.g. 097533 37771 or +91 9753337771"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Company / Gym</label>
            <select
              value={formData.companyId}
              onChange={e => setFormData({ ...formData, companyId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              <option value="">None / Independent</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Website URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={formData.website}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Service Interest</label>
            <select
              value={formData.serviceInterest}
              onChange={e => setFormData({ ...formData, serviceInterest: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              <option value="WEBSITE_NEW">Website (Brand New)</option>
              <option value="WEBSITE_REDESIGN">Website Redesign</option>
              <option value="WEB_APP">Web Application</option>
              <option value="MOBILE_APP">Mobile App</option>
              <option value="AUTOMATION">Automation</option>
              <option value="SAAS">SaaS Platform</option>
              <option value="CUSTOM_SOFTWARE">Custom Software</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Lead Status</label>
            <select
              value={formData.leadStatus}
              onChange={e => setFormData({ ...formData, leadStatus: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="INTERESTED">Interested</option>
              <option value="CALLBACK_SCHEDULED">Callback Due</option>
              <option value="DEMO_SCHEDULED">Demo Scheduled</option>
              <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Lead Source</label>
            <select
              value={formData.leadSource}
              onChange={e => setFormData({ ...formData, leadSource: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              <option value="COLD_OUTREACH">Cold Outreach</option>
              <option value="REFERRAL">Referral</option>
              <option value="WEBSITE">Inbound Website</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="EVENT">Event</option>
              <option value="EXCEL_IMPORT">Excel Import</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
            {loading ? 'Creating...' : 'Create Contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
