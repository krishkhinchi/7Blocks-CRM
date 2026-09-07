import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './stores/auth';
import { ThemeProvider } from './stores/theme';
import { ToastProvider } from './stores/toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { BrandLogo } from './components/common/BrandLogo';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CommandPalette } from './components/layout/CommandPalette';

// Pages
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/Dashboard';
import { ContactsList } from './pages/contacts/ContactsList';
import { ContactDetail } from './pages/contacts/ContactDetail';
import { CompaniesList } from './pages/companies/CompaniesList';
import { CompanyDetail } from './pages/companies/CompanyDetail';
import { PipelinePage } from './pages/pipeline/PipelinePage';
import { ActivitiesPage } from './pages/activities/ActivitiesPage';
import { TasksPage } from './pages/tasks/TasksPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { EmailsPage } from './pages/emails/EmailsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ImportsPage } from './pages/imports/ImportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AuditPage } from './pages/audit/AuditPage';

// Quick Modals
import { LogCallModal } from './components/forms/LogCallModal';
import { CreateContactModal } from './components/forms/CreateContactModal';
import { CreateDealModal } from './components/forms/CreateDealModal';
import { CreateTaskModal } from './components/forms/CreateTaskModal';

// Authenticated Layout wrapper
const AppLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [commandBarOpen, setCommandBarOpen] = useState(false);

  // Quick Create Modals
  const [quickCreateType, setQuickCreateType] = useState<'contact' | 'call' | 'deal' | 'task' | null>(null);

  // Global Keyboard shortcuts: Ctrl+K or Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandBarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-sm gap-4">
        <BrandLogo size="lg" />
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Starting 7BLOCKS CRM...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenCommandBar={() => setCommandBarOpen(true)}
          onOpenQuickCreate={type => setQuickCreateType(type)}
        />
        <main className="flex-1 pb-16">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/contacts" element={<ContactsList />} />
              <Route path="/contacts/:id" element={<ContactDetail />} />
              <Route path="/companies" element={<CompaniesList />} />
              <Route path="/companies/:id" element={<CompanyDetail />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/emails" element={<EmailsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/imports" element={<ImportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Command Bar */}
      <CommandPalette
        isOpen={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
      />

      {/* Global Quick Create Modals */}
      {quickCreateType === 'call' && (
        <LogCallModal
          isOpen={true}
          onClose={() => setQuickCreateType(null)}
        />
      )}
      {quickCreateType === 'contact' && (
        <CreateContactModal
          isOpen={true}
          onClose={() => setQuickCreateType(null)}
        />
      )}
      {quickCreateType === 'deal' && (
        <CreateDealModal
          isOpen={true}
          onClose={() => setQuickCreateType(null)}
        />
      )}
      {quickCreateType === 'task' && (
        <CreateTaskModal
          isOpen={true}
          onClose={() => setQuickCreateType(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<AppLayout />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
