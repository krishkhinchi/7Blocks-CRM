import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Building2, Kanban, CheckSquare, History, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

interface SearchResults {
  contacts: any[];
  companies: any[];
  deals: any[];
  tasks: any[];
  activities: any[];
}

export const CommandPalette: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    contacts: [],
    companies: [],
    deals: [],
    tasks: [],
    activities: []
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ contacts: [], companies: [], deals: [], tasks: [], activities: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ contacts: [], companies: [], deals: [], tasks: [], activities: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
        const d = res.data?.data || {};
        setResults({
          contacts: Array.isArray(d.contacts) ? d.contacts : [],
          companies: Array.isArray(d.companies) ? d.companies : [],
          deals: Array.isArray(d.deals) ? d.deals : [],
          tasks: Array.isArray(d.tasks) ? d.tasks : [],
          activities: Array.isArray(d.activities) ? d.activities : []
        });
      } catch (err) {
        console.error('Search error:', err);
        setResults({ contacts: [], companies: [], deals: [], tasks: [], activities: [] });
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  if (!isOpen) return null;

  const contactsList = Array.isArray(results?.contacts) ? results.contacts : [];
  const companiesList = Array.isArray(results?.companies) ? results.companies : [];
  const dealsList = Array.isArray(results?.deals) ? results.deals : [];
  const tasksList = Array.isArray(results?.tasks) ? results.tasks : [];

  const hasResults =
    contactsList.length > 0 ||
    companiesList.length > 0 ||
    dealsList.length > 0 ||
    tasksList.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800/60 rounded-xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800/60 bg-slate-900">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search contacts, gyms, deals, tasks... (e.g. Kunal, Powai, Redesign)"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            autoFocus
          />
          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
            ESC
          </span>
        </div>

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          {loading && (
            <div className="text-center py-6 text-slate-500 text-sm">Searching CRM...</div>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <div className="text-center py-6 text-slate-500 text-sm">
              No matching records found for "{query}".
            </div>
          )}

          {/* Contacts */}
          {contactsList.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-accent-blue" />
                <span>Contacts ({contactsList.length})</span>
              </div>
              <div className="space-y-1">
                {contactsList.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(`/contacts/${c.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 text-left transition-colors group"
                  >
                    <div>
                      <span className="font-medium text-slate-100 group-hover:text-accent-blue">
                        {c.fullName}
                      </span>
                      {c.company && (
                        <span className="text-slate-400 ml-2">· {c.company.name}</span>
                      )}
                      <p className="text-[11px] text-slate-500">{c.phone || c.email || 'No contact info'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Companies */}
          {companiesList.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-accent-emerald" />
                <span>Companies / Gyms ({companiesList.length})</span>
              </div>
              <div className="space-y-1">
                {companiesList.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(`/companies/${c.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 text-left transition-colors group"
                  >
                    <div>
                      <span className="font-medium text-slate-100 group-hover:text-accent-emerald">
                        {c.name}
                      </span>
                      {c.city && <span className="text-slate-400 ml-2">· {c.city}</span>}
                      {c.domain && <p className="text-[11px] text-slate-500">{c.domain}</p>}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Deals */}
          {dealsList.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                <Kanban className="w-3.5 h-3.5 text-accent-orange" />
                <span>Deals ({dealsList.length})</span>
              </div>
              <div className="space-y-1">
                {dealsList.map(d => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect('/pipeline')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 text-left transition-colors group"
                  >
                    <div>
                      <span className="font-medium text-slate-100 group-hover:text-accent-orange">
                        {d.name}
                      </span>
                      {d.company && <span className="text-slate-400 ml-2">· {d.company.name}</span>}
                      <p className="text-[11px] text-slate-500">₹{d.value?.toLocaleString('en-IN')} · {d.stage}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasksList.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-accent-purple" />
                <span>Tasks ({tasksList.length})</span>
              </div>
              <div className="space-y-1">
                {tasksList.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect('/tasks')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 text-left transition-colors group"
                  >
                    <div>
                      <span className="font-medium text-slate-100 group-hover:text-accent-purple">
                        {t.title}
                      </span>
                      <p className="text-[11px] text-slate-500">Priority: {t.priority} · Status: {t.status}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Navigate with mouse or Tab</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
