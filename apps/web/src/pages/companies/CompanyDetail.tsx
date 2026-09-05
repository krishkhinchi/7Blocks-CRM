import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Globe, MapPin, Users, ArrowLeft, ExternalLink, Plus, Kanban } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../stores/toast';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../../components/common/Badge';

export const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { error } = useToast();
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
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">{company.name}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              {company.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {company.city}, {company.state || 'India'}
                </span>
              )}
              {company.industry && <span>· {company.industry}</span>}
              {company.size && <span>· {company.size} employees</span>}
            </div>
          </div>

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-cyan-400 hover:underline text-xs"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Visit Website</span>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Associated Contacts */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-400" />
            <span>Contacts at {company.name} ({company.contacts?.length || 0})</span>
          </h3>

          <div className="space-y-2 text-xs">
            {!company.contacts || company.contacts.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">No contacts listed.</p>
            ) : (
              company.contacts.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/contacts/${c.id}`)}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div>
                    <span className="font-semibold text-slate-100 group-hover:text-brand-400">
                      {c.fullName}
                    </span>
                    <p className="text-[11px] text-slate-500">{c.jobTitle || 'Representative'} · {c.phone || c.email}</p>
                  </div>
                  <Badge variant="neutral" size="sm">{c.leadStatus}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Associated Deals */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
            <Kanban className="w-4 h-4 text-amber-400" />
            <span>Opportunities & Deals ({company.deals?.length || 0})</span>
          </h3>

          <div className="space-y-2 text-xs">
            {!company.deals || company.deals.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">No deals in pipeline.</p>
            ) : (
              company.deals.map((d: any) => (
                <div
                  key={d.id}
                  onClick={() => navigate('/pipeline')}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-semibold text-slate-200">{d.name}</span>
                    <p className="text-[11px] text-slate-500 font-mono">Stage: {d.stage}</p>
                  </div>
                  <span className="font-bold font-mono text-brand-400">
                    {formatCurrency(d.value)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
