import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/auth';
import { useToast } from '../../stores/toast';
import { BrandLogo } from '../../components/common/BrandLogo';
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-2">
            <BrandLogo size="xl" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            7BLOCKS CRM
          </h1>
          <p className="text-[13px] text-slate-400">
            Internal Sales & Relationship-Management Platform
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800/60 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5 text-[13px]">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@7block.in"
                  className="w-full bg-slate-950/60 border border-slate-800/60 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:border-accent-blue focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/60 border border-slate-800/60 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:border-accent-blue focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-white hover:bg-slate-200 text-slate-900 font-bold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
