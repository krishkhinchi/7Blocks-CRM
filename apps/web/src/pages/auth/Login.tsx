import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/auth';
import { useToast } from '../../stores/toast';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      success('Welcome to 7BLOCKS CRM', 'Logged in successfully.');
      navigate('/');
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white font-bold text-xl shadow-lg shadow-brand-600/30 mb-2">
            7B
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            7BLOCKS CRM
          </h1>
          <p className="text-xs text-slate-400">
            Internal Sales & Relationship-Management Platform
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@7block.in"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md shadow-brand-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to CRM'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Security badge */}
        <p className="text-center text-[11px] text-slate-500">
          Protected by JWT authentication, role permission guards & audit logging.
        </p>
      </div>
    </div>
  );
};
