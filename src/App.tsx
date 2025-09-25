import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientsManager from './components/ClientsManager';
import UniqueJobsManager from './components/UniqueJobsManager';
import InvoicesManager from './components/InvoicesManager';
import QuotesManager from './components/QuotesManager';
import CredentialsVault from './components/CredentialsVault';
import TaskBoard from './components/TaskBoard';
import PostingCalendar from './components/PostingCalendar';
import MonthlyCalendar from './components/MonthlyCalendar';
import { CRMProvider, useCRM } from './context/CRMContext';

const AppContent = () => {
  const { isAuthenticated, user, logoutUser } = useCRM();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Auto-logout on window close or refresh for security
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear session data when window/tab is closed
      logoutUser();
    };

    const handleVisibilityChange = () => {
      // Auto-logout when tab becomes hidden for extended period
      if (document.hidden) {
        const timer = setTimeout(() => {
          if (document.hidden && isAuthenticated) {
            console.log('🔒 Auto-logout por inatividade (aba oculta)');
            logoutUser();
          }
        }, 30 * 60 * 1000); // 30 minutes of inactivity
        
        return () => clearTimeout(timer);
      }
    };

    // Auto-logout after 2 hours of total session time for security
    const sessionTimer = setTimeout(() => {
      if (isAuthenticated) {
        alert('Sessão expirada por segurança. Faça login novamente.');
        logoutUser();
      }
    }, 2 * 60 * 60 * 1000); // 2 hours

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(sessionTimer);
    };
  }, [isAuthenticated, logoutUser]);

  const handleLogin = (success: boolean) => {
    // Login logic is now handled in the context
    console.log('Login handled by context');
  };

  const handleLogout = () => {
    logoutUser();
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <ClientsManager />;
      case 'unique-jobs':
        return <UniqueJobsManager />;
      case 'invoices':
        return <InvoicesManager />;
      case 'budgets':
        return <QuotesManager />;
      case 'calendar':
        return <PostingCalendar />;
      case 'monthly-calendar':
        return <MonthlyCalendar />;
      case 'credentials':
        return <CredentialsVault />;
      case 'tasks':
        return <TaskBoard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] font-['Poppins'] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-indigo-100/20 pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-br from-purple-200/10 to-transparent rounded-full -translate-y-48 -translate-x-48 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-indigo-200/10 to-transparent rounded-full translate-y-40 translate-x-40 pointer-events-none"></div>
      
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 overflow-auto relative">
        <div className="p-10">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <CRMProvider>
      <AppContent />
    </CRMProvider>
  );
}

export default App;