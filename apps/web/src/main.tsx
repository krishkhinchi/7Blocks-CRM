import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Purge any legacy mock store artifacts from browser localStorage
try {
  const legacyMockKeys = [
    '7blocks_users_store',
    '7blocks_contacts_store',
    '7blocks_companies_store',
    '7blocks_deals_store',
    '7blocks_activities_store',
    '7blocks_tasks_store',
    '7blocks_meetings_store'
  ];
  legacyMockKeys.forEach(k => localStorage.removeItem(k));
} catch {}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
