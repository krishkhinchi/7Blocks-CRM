import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Plus, ExternalLink, Globe, MapPin, Users, Kanban } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../stores/toast';

export const CompaniesList: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    website: '',
    industry: 'Fitness & Wellness',
    size: '10-25',
    city: 'Mumbai',
    address: ''
  });

  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, [search]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies?search=${encodeURIComponent(search)}&limit=50`);
      const raw = res.data?.data ?? res.data?.companies ?? res.data;
      const list = Array.isArray(raw) ? raw : [];
      setCompanies(list);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name.trim()) return;

    try {
      await api.post('/companies', newCompany);
      success('Company created successfully');
      setShowCreateModal(false);
      setNewCompany({ name: '', website: '', industry: 'Fitness & Wellness', size: '10-25', city: 'Mumbai', address: '' });
      fetchCompanies();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to create company');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-400" />
            <span>Companies & Gym Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Accounts, facilities, and fitness chains tracked across India.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by gym name, domain, city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
        />
      </div>

      {/* Grid of Company Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-500 text-xs">Loading companies...</div>
        ) : !Array.isArray(companies) || companies.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No companies found matching your query.
          </div>
        ) : (
          companies.map(comp => (
            <div
              key={comp.id}
              onClick={() => navigate(`/companies/${comp.id}`)}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-colors cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-slate-100 group-hover:text-brand-400 transition-colors line-clamp-1">
                    {comp.name}
                  </h3>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 shrink-0" />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {comp.city && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {comp.city}
                    </span>
                  )}
                  {comp.domain && (
                    <span className="flex items-center gap-1 text-[11px] text-cyan-400 font-mono truncate">
                      <Globe className="w-3 h-3" />
                      {comp.domain}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-500" />
                  {comp._count?.contacts || 0} Contacts
                </span>
                <span className="flex items-center gap-1">
                  <Kanban className="w-3 h-3 text-slate-500" />
                  {comp._count?.deals || 0} Deals
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Company Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Company / Gym"
        subtitle="Record facility details, website domain, and location"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Company / Gym Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Iron Paradise Fitness"
              value={newCompany.name}
              onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Website URL</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={newCompany.website}
                onChange={e => setNewCompany({ ...newCompany, website: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">City / Location</label>
              <input
                type="text"
                placeholder="e.g. Mumbai, Thane, Pune"
                value={newCompany.city}
                onChange={e => setNewCompany({ ...newCompany, city: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Industry</label>
              <input
                type="text"
                value={newCompany.industry}
                onChange={e => setNewCompany({ ...newCompany, industry: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Company Size</label>
              <select
                value={newCompany.size}
                onChange={e => setNewCompany({ ...newCompany, size: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="1-10">1-10 employees</option>
                <option value="10-25">10-25 employees</option>
                <option value="25-50">25-50 employees</option>
                <option value="50+">50+ employees</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors"
            >
              Create Company
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
