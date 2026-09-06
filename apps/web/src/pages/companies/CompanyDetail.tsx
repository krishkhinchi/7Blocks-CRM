import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Globe, MapPin, Users, ArrowLeft, ExternalLink, Plus, Kanban, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';
import { useAuth } from '../../stores/auth';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../../components/common/Badge';

export const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { error, success } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies/${id}`);
      setCompany(res.data?.data || null);
    } catch {
      error('Failed to load company');
      navigate('/companies');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/companies/${id}`);
      success(`${company?.name || 'Company'} deleted successfully`);
      navigate('/companies');
    } catch {
      error('Failed to delete company');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading || !company) {
    return <div className="p-8 text-center text-slate-500 text-xs">Loading company details...</div>;
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <button
          onClick={() => navigate('/companies')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Companies</span>
        </button>
      </div>

      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{company.name}</h1>
            <div className="flex items-center gap-3 text-[13px] text-slate-400 mt-2 font-medium">
              {company.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {company.city}, {company.state || 'India'}
                </span>
              )}
              {company.industry && <span>· {company.industry}</span>}
              {company.size && <span>· {company.size} employees</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-800/60 bg-slate-950 text-accent-cyan hover:underline text-[13px] font-semibold transition-colors shadow-sm"
              >
                <Globe className="w-4 h-4" />
                <span>Visit Website</span>
              </a>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-800/60 bg-slate-900 text-accent-rose hover:bg-slate-800 text-[13px] font-semibold transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Associated Contacts */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-5">
          <h3 className="font-semibold text-[15px] text-slate-100 flex items-center gap-2 tracking-tight">
            <Users className="w-4 h-4 text-accent-blue" />
            <span>Contacts at {company.name} ({company.contacts?.length || 0})</span>
          </h3>

          <div className="space-y-2 text-[13px]">
            {!company.contacts || company.contacts.length === 0 ? (
              <p className="text-slate-500 py-6 text-center">No contacts listed.</p>
            ) : (
              company.contacts.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/contacts/${c.id}`)}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:border-slate-700 hover:bg-slate-900/80 cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div>
                    <span className="font-medium text-[13px] text-slate-200 group-hover:text-white transition-colors">
                      {c.fullName}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{c.jobTitle || 'Representative'} · {c.phone || c.email}</p>
                  </div>
                  <Badge variant="neutral" size="sm">{c.leadStatus}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Associated Deals */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/60 shadow-sm space-y-5">
          <h3 className="font-semibold text-[15px] text-slate-100 flex items-center gap-2 tracking-tight">
            <Kanban className="w-4 h-4 text-accent-orange" />
            <span>Opportunities & Deals ({company.deals?.length || 0})</span>
          </h3>

          <div className="space-y-2 text-[13px]">
            {!company.deals || company.deals.length === 0 ? (
              <p className="text-slate-500 py-6 text-center">No deals in pipeline.</p>
            ) : (
              company.deals.map((d: any) => (
                <div
                  key={d.id}
                  onClick={() => navigate('/pipeline')}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:border-slate-700 hover:bg-slate-900/80 cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div>
                    <span className="font-medium text-[13px] text-slate-200 group-hover:text-white transition-colors">{d.name}</span>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Stage: {d.stage}</p>
                  </div>
                  <span className="font-bold font-mono text-[13px] text-slate-100 tracking-tight">
                    {formatCurrency(d.value)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rose-950/60 border border-rose-800/50">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <h2 className="text-base font-bold text-slate-100">Delete Company</h2>
            </div>
            <p className="text-sm text-slate-400">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-200">{company?.name}</span>?
              This action cannot be undone. Contacts and deals linked to this company will be unlinked.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500 transition-colors disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Company</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
