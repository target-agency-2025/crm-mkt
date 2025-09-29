import React, { useRef } from 'react';
import { 
  Home, 
  Users, 
  FileText, 
  Shield, 
  Trello,
  Briefcase,
  Calculator,
  Calendar,
  Download,
  Upload
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const { 
    user, 
    isAuthenticated,
    clients,
    uniqueJobs,
    invoices,
    credentials,
    tasks,
    budgetPlans,
    budgets,
    quotes,
    calendarEvents
  } = useCRM();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to export all CRM data to JSON
  const exportData = () => {
    // Collect all CRM data that would be saved to localStorage
    const crmData: Record<string, any> = {};
    
    // If user is authenticated, collect their data
    if (isAuthenticated && user) {
      const dataToSave = {
        clients,
        uniqueJobs,
        invoices,
        credentials,
        tasks,
        budgetPlans,
        budgets,
        quotes,
        calendarEvents
      };
      
      // Save with the same key pattern used in the CRM context
      crmData[`crm-data-${user.id}`] = dataToSave;
    }
    
    // Also collect any other CRM-related data from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('crm-') && !(user && key.startsWith(`crm-data-${user.id}`))) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            crmData[key] = JSON.parse(data);
          }
        } catch (e) {
          console.error(`Error parsing localStorage key ${key}:`, e);
        }
      }
    }
    
    // Create JSON blob
    const dataStr = JSON.stringify(crmData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dados.json';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Function to import CRM data from JSON file
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        
        // Save all data to localStorage
        Object.keys(importedData).forEach(key => {
          if (key.startsWith('crm-')) {
            localStorage.setItem(key, JSON.stringify(importedData[key]));
          }
        });
        
        // Show success message and reload
        alert('Dados importados com sucesso!');
        window.location.reload();
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Erro ao importar dados. Verifique se o arquivo é válido.');
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

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
          
          {/* Export/Import Buttons */}
          <li className="mt-6 pt-4 border-t border-white/20">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={exportData}
                className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-all duration-300"
              >
                <Download size={16} />
                <span className="text-xs font-medium">Exportar</span>
              </button>
              
              <button
                onClick={triggerFileSelect}
                className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-all duration-300"
              >
                <Upload size={16} />
                <span className="text-xs font-medium">Importar</span>
              </button>
            </div>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={importData}
              accept=".json"
              className="hidden"
            />
          </li>
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