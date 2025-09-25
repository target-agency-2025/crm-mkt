import React from 'react';
import { 
  Home, 
  Users, 
  FileText, 
  Shield, 
  Trello,
  Briefcase,
  Calculator,
  Calendar
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const { user } = useCRM();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'unique-jobs', label: 'Trabalhos Únicos', icon: Briefcase },
    { id: 'invoices', label: 'Financeiro', icon: FileText },
    { id: 'budgets', label: 'Orçamentos', icon: Calculator },
    { id: 'monthly-calendar', label: 'Calendario', icon: Calendar },
    { id: 'credentials', label: 'Cofre', icon: Shield },
    { id: 'tasks', label: 'Tarefas', icon: Trello },
  ];

  return (
    <div className="w-72 bg-gradient-to-br from-[#6A0DAD] via-[#7B1FA2] to-[#8E24AA] text-white flex flex-col shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative p-8 border-b border-white/20 backdrop-blur-sm">
        <div className="flex items-center space-x-2 mb-2">
          <img 
            src="https://i.ibb.co/1f53SrcR/ISO-LOGO.png" 
            alt="TARGET Logo" 
            className="w-12 h-12 rounded-xl shadow-lg"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">TARGET CRM</h1>
            <div className="w-16 h-0.5 bg-gradient-to-r from-white to-transparent mt-1"></div>
          </div>
        </div>
        <p className="text-purple-100 text-sm font-medium">Sistema de Gestão TARGET</p>
      </div>
      
      <nav className="relative flex-1 p-6">
        <ul className="space-y-3">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:translate-x-1 group ${
                    currentPage === item.id
                      ? 'bg-white/25 text-white shadow-xl backdrop-blur-sm border border-white/20'
                      : 'text-purple-100 hover:bg-white/15 hover:text-white hover:shadow-lg'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    currentPage === item.id 
                      ? 'bg-white/20 shadow-lg' 
                      : 'group-hover:bg-white/10'
                  }`}>
                    <IconComponent size={18} />
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {currentPage === item.id && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-lg"></div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="relative p-6 border-t border-white/20">
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <p className="text-xs text-purple-100 text-center font-medium">
            Sistema TARGET CRM v2.0
          </p>
          <p className="text-xs text-purple-200 text-center mt-1 opacity-80">
            Criado por João Vitor Muniz - CEO da Target Agency
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;