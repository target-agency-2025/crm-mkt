import React, { useMemo, useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { Users, DollarSign, AlertCircle, CheckSquare, Briefcase, Clock, Sparkles, TrendingUp, Calendar, CheckCircle, LogOut, Camera, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { clients, uniqueJobs, invoices, tasks, user, logoutUser } = useCRM();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load profile photo from user data when component mounts
  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (user) {
        try {
          const response = await fetch(`http://localhost:3001/api/user-data/${user.id}`);
          const result = await response.json();
          if (result.data && result.data.profilePhoto) {
            setProfilePhoto(result.data.profilePhoto);
          }
        } catch (error) {
          console.warn('Could not load profile photo:', error);
        }
      }
    };
    
    loadProfilePhoto();
  }, [user]);

  const kpis = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'active').length;
    const activeJobs = uniqueJobs.filter(j => j.status === 'active').length;
    
    // Calcular receita mensal potencial baseada nos valores dos clientes ativos
    const monthlyRevenueFromClients = clients
      .filter(c => c.status === 'active')
      .reduce((sum, client) => sum + (client.monthlyValue || 0), 0);
    
    const monthlyRevenueFromJobs = uniqueJobs
      .filter(j => j.status === 'active')
      .reduce((sum, job) => sum + (job.uniqueValue || 0), 0);
    
    const totalMonthlyRevenue = monthlyRevenueFromClients + monthlyRevenueFromJobs;
    
    // Calcular receita efetivamente recebida no mês atual (baseada nas faturas pagas)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const actualMonthlyRevenue = invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoice.status === 'paid' && 
               invoiceDate.getMonth() === currentMonth && 
               invoiceDate.getFullYear() === currentYear;
      })
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    
    // Calcular receita total recebida (todas as faturas pagas)
    const totalReceivedRevenue = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
    const openTasks = tasks.filter(t => t.status !== 'done').length;

    return {
      activeClients,
      activeJobs,
      totalMonthlyRevenue,
      actualMonthlyRevenue,
      totalReceivedRevenue,
      overdueInvoices,
      openTasks
    };
  }, [clients, uniqueJobs, invoices, tasks]);

  // Recent Activities
  const getRecentActivities = () => {
    const activities: Array<{
      id: string;
      type: string;
      description: string;
      date: string;
      color: string;
    }> = [];

    // Recent clients
    const recentClients = clients
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    recentClients.forEach(client => {
      activities.push({
        id: client.id,
        type: 'client',
        description: `Novo cliente: ${client.name}`,
        date: client.createdAt,
        color: '#6A0DAD'
      });
    });

    // Recent unique jobs
    const recentJobs = uniqueJobs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    recentJobs.forEach(job => {
      activities.push({
        id: job.id,
        type: 'job',
        description: `Novo trabalho: ${job.name}`,
        date: job.createdAt,
        color: '#8E24AA'
      });
    });

    // Recent invoices
    const recentInvoices = invoices
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    recentInvoices.forEach(invoice => {
      activities.push({
        id: invoice.id,
        type: 'invoice',
        description: `Fatura ${invoice.status === 'paid' ? 'paga' : 'criada'}: ${invoice.clientName}`,
        date: invoice.createdAt,
        color: '#9C27B0'
      });
    });

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair? Será necessário fazer login novamente.')) {
      logoutUser();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        const photoData = event.target?.result as string;
        setProfilePhoto(photoData);
        setIsUploading(false);
        
        // Save profile photo to database
        try {
          // First, get existing user data
          const response = await fetch(`http://localhost:3001/api/user-data/${user.id}`);
          const result = await response.json();
          const existingData = result.data || {};
          
          // Update with new profile photo
          const updatedData = {
            ...existingData,
            profilePhoto: photoData
          };
          
          // Save to database
          await fetch('http://localhost:3001/api/user-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              data: updatedData
            }),
          });
          
          console.log('Profile photo saved to database');
        } catch (error) {
          console.error('Error saving profile photo:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const KPICard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-xl p-6 card-hover border border-gray-100 bg-gradient-to-br from-white to-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#303030] text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color === 'text-[#6A0DAD]' ? 'bg-gradient-to-br from-[#6A0DAD] to-[#8E24AA] shadow-lg' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
          <Icon className={`w-6 h-6 ${color === 'text-[#6A0DAD]' ? 'text-white' : 'text-gray-600'}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50 to-indigo-50 rounded-2xl p-8 shadow-2xl border border-purple-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-200/30 to-transparent rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative">
          <div className="flex items-center space-x-3 mb-2">
            <img 
              src="https://i.ibb.co/G4kyHSsr/icone-target.png" 
              alt="TARGET Logo" 
              className="w-14 h-14 rounded-xl shadow-lg"
            />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-[#6A0DAD] via-[#8E24AA] to-[#9C27B0] bg-clip-text text-transparent">
            Dashboard
          </h1>
          </div>
          <p className="text-gray-600 text-lg font-medium">Visão geral completa do seu negócio</p>
        </div>
        <div className="relative text-right">
          <p className="text-[#303030] opacity-70">
            Bem-vindo ao seu TARGET CRM
          </p>
          <p className="text-sm text-purple-700 font-semibold bg-white/50 px-3 py-1 rounded-full inline-block mt-1">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* User Profile Section - Moved below the Dashboard title */}
      <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/50 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6A0DAD] to-[#8E24AA] flex items-center justify-center overflow-hidden">
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-[#303030]">{user?.name}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Online</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg transition-colors border border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Clientes Ativos"
          value={kpis.activeClients}
          icon={Users}
          color="text-[#6A0DAD]"
        />
        <KPICard
          title="Trabalhos Únicos"
          value={kpis.activeJobs}
          icon={Briefcase}
          color="text-[#6A0DAD]"
        />
        <KPICard
          title="Tarefas Abertas"
          value={kpis.openTasks}
          icon={CheckSquare}
          color="text-blue-600"
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-100/50 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Receita Mensal Potencial</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                R$ {kpis.totalMonthlyRevenue.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500 mt-1">Baseado nos contratos ativos</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-xl">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100/50 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Recebido Este Mês</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                R$ {kpis.actualMonthlyRevenue.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500 mt-1">Faturas pagas em {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100/50 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Recebido</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                R$ {kpis.totalReceivedRevenue.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500 mt-1">Todas as faturas pagas</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-100/50 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Faturas Atrasadas</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{kpis.overdueInvoices}</p>
              <p className="text-xs text-gray-500 mt-1">Precisam de atenção</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-xl">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-100/50 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Diferença Mensal</p>
              <p className={`text-3xl font-bold mt-2 ${
                kpis.actualMonthlyRevenue >= kpis.totalMonthlyRevenue ? 'text-green-600' : 'text-orange-600'
              }`}>
                R$ {Math.abs(kpis.totalMonthlyRevenue - kpis.actualMonthlyRevenue).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {kpis.actualMonthlyRevenue >= kpis.totalMonthlyRevenue ? 'Acima do esperado' : 'Abaixo do potencial'}
              </p>
            </div>
            <div className={`p-4 rounded-2xl shadow-xl ${
              kpis.actualMonthlyRevenue >= kpis.totalMonthlyRevenue 
                ? 'bg-gradient-to-br from-green-500 to-green-600' 
                : 'bg-gradient-to-br from-orange-500 to-orange-600'
            }`}>
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100/50 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#303030]">Resumo Financeiro</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <div className="text-2xl font-bold text-green-700">
              {clients.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-green-600 font-medium">Clientes Ativos</div>
            <div className="text-xs text-green-500 mt-1">
              R$ {clients.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.monthlyValue || 0), 0).toLocaleString('pt-BR')}/mês
            </div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">
              {uniqueJobs.filter(j => j.status === 'active').length}
            </div>
            <div className="text-sm text-blue-600 font-medium">Trabalhos Únicos</div>
            <div className="text-xs text-blue-500 mt-1">
              R$ {uniqueJobs.filter(j => j.status === 'active').reduce((sum, j) => sum + (j.uniqueValue || 0), 0).toLocaleString('pt-BR')} total
            </div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">
              {invoices.filter(i => i.status === 'paid').length}
            </div>
            <div className="text-sm text-purple-600 font-medium">Faturas Pagas</div>
            <div className="text-xs text-purple-500 mt-1">
              R$ {invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0).toLocaleString('pt-BR')} total
            </div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
            <div className="text-2xl font-bold text-orange-700">
              {((kpis.actualMonthlyRevenue / kpis.totalMonthlyRevenue) * 100 || 0).toFixed(1)}%
            </div>
            <div className="text-sm text-orange-600 font-medium">Taxa de Recebimento</div>
            <div className="text-xs text-orange-500 mt-1">
              Este mês vs potencial
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-green-100/50 to-transparent rounded-full translate-y-20 -translate-x-20"></div>
        
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#303030]">Últimos Pagamentos Recebidos</h2>
        </div>
        
        <div className="space-y-3">
          {invoices
            .filter(invoice => invoice.status === 'paid')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((invoice) => {
              const client = clients.find(c => c.id === invoice.clientId);
              const job = uniqueJobs.find(j => j.id === invoice.uniqueJobId);
              const entityInfo = client || job;
              
              return (
                <div key={invoice.id} className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl border border-green-200 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    {client?.profilePhoto ? (
                      <img
                        src={client.profilePhoto}
                        alt={client.name}
                        className="w-10 h-10 rounded-full object-cover border-2"
                        style={{ borderColor: client.color }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: client?.color || '#6A0DAD' }}
                      >
                        {(entityInfo?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{entityInfo?.name || 'Cliente não encontrado'}</div>
                      <div className="text-sm text-gray-600">{invoice.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(invoice.createdAt).toLocaleDateString('pt-BR')} às {new Date(invoice.createdAt).toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-green-600">
                      R$ {invoice.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-green-500 font-medium">✓ Pago</div>
                  </div>
                </div>
              );
            })}
          {invoices.filter(invoice => invoice.status === 'paid').length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhum pagamento recebido ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative">
          <h2 className="text-2xl font-bold mb-4">Performance do Mês</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                R$ {kpis.totalMonthlyRevenue.toLocaleString('pt-BR')}
              </div>
              <div className="text-white/80">Potencial Mensal</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                R$ {kpis.actualMonthlyRevenue.toLocaleString('pt-BR')}
              </div>
              <div className="text-white/80">Recebido Este Mês</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {kpis.totalMonthlyRevenue > 0 ? ((kpis.actualMonthlyRevenue / kpis.totalMonthlyRevenue) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-white/80">Taxa de Conversão</div>
            </div>
          </div>
        </div>
      </div>

      {/* Old KPI Cards - Removed */}
      <div className="hidden">
        <KPICard
          title="Faturas Atrasadas"
          value={kpis.overdueInvoices}
          icon={AlertCircle}
          color="text-red-600"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-332 bg-gradient-to-br from-purple-100/50 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-[#6A0DAD] to-[#8E24AA] rounded-xl shadow-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#303030]">Atividade Recente</h2>
        </div>
        <div className="space-y-3">
          {getRecentActivities().length > 0 ? (
            getRecentActivities().map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-5 bg-gradient-to-r from-[#F9F6FB] via-purple-50 to-indigo-50 rounded-xl border border-purple-100 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                <div className="w-4 h-4 bg-gradient-to-br from-[#6A0DAD] to-[#8E24AA] rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                <div className="flex-1">
                  <p className="text-[#303030] font-medium">{activity.description}</p>
                  <p className="text-gray-500 text-sm">
                    {new Date(activity.date).toLocaleDateString('pt-BR')} às {new Date(activity.date).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhuma atividade recente</p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, color }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}) => (
  <div className="bg-white rounded-xl shadow-xl p-6 card-hover border border-gray-100 bg-gradient-to-br from-white to-gray-50">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[#303030] text-sm font-medium">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color === 'text-[#6A0DAD]' ? 'bg-gradient-to-br from-[#6A0DAD] to-[#8E24AA] shadow-lg' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
        <Icon className={`w-6 h-6 ${color === 'text-[#6A0DAD]' ? 'text-white' : 'text-gray-600'}`} />
      </div>
    </div>
  </div>
);
      
export default Dashboard;