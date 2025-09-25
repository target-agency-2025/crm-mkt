import React, { useState } from 'react';
import { Calculator, Plus, Download, Edit2, Trash2, Calendar, Package, Briefcase } from 'lucide-react';
import jsPDF from 'jspdf';

interface BudgetPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  color: string;
  isActive: boolean;
  type: 'starter' | 'premium' | 'completo';
  customizations: {
    posts: number;
    stories: number;
    presentialRecordings: number;
    socialMediaManagement: boolean;
    additionalServices: string[];
  };
  createdAt: string;
}

interface Budget {
  id: string;
  type: 'monthly' | 'unique';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  // For monthly budgets
  selectedPlans?: string[];
  // For unique budgets
  uniqueService?: {
    title: string;
    description: string;
    deadline: string;
    value: number;
    conditions: string;
  };
  customServices: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
  }>;
  discount: number;
  discountType: 'percentage' | 'fixed';
  validUntil: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  notes?: string;
  createdAt: string;
}

const BudgetSystem: React.FC = () => {
  // This component appears to be an alternate implementation.
  // Using local state instead of CRM context for now.

  // State for budget plans
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([
    {
      id: 'starter-plan',
      name: 'Starter',
      description: 'Plano básico para pequenas empresas',
      price: 800,
      features: [
        'Gestão de redes sociais',
        'Posts personalizados',
        'Stories criativos',
        'Relatórios mensais'
      ],
      color: '#10B981',
      isActive: true,
      type: 'starter',
      customizations: {
        posts: 12,
        stories: 8,
        presentialRecordings: 0,
        socialMediaManagement: true,
        additionalServices: []
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'premium-plan',
      name: 'Premium',
      description: 'Plano intermediário com mais recursos',
      price: 1500,
      features: [
        'Tudo do plano Starter',
        'Mais posts e stories',
        'Gravações presenciais',
        'Campanhas pagas',
        'Suporte prioritário'
      ],
      color: '#8B5CF6',
      isActive: true,
      type: 'premium',
      customizations: {
        posts: 20,
        stories: 15,
        presentialRecordings: 2,
        socialMediaManagement: true,
        additionalServices: ['Campanhas pagas']
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'completo-plan',
      name: 'Completo',
      description: 'Plano avançado com todos os recursos',
      price: 2500,
      features: [
        'Tudo dos planos anteriores',
        'Posts e stories ilimitados',
        'Gravações presenciais frequentes',
        'Gestão completa de campanhas',
        'Consultoria estratégica',
        'Relatórios detalhados'
      ],
      color: '#F59E0B',
      isActive: true,
      type: 'completo',
      customizations: {
        posts: 30,
        stories: 25,
        presentialRecordings: 4,
        socialMediaManagement: true,
        additionalServices: ['Campanhas pagas', 'Consultoria estratégica', 'Relatórios detalhados']
      },
      createdAt: new Date().toISOString()
    }
  ]);

  // State for budgets
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingPlan, setEditingPlan] = useState<BudgetPlan | null>(null);
  const [budgetType, setBudgetType] = useState<'monthly' | 'unique'>('monthly');
  
  const [budgetFormData, setBudgetFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    selectedPlans: [] as string[],
    uniqueService: {
      title: '',
      description: '',
      deadline: '',
      value: 0,
      conditions: ''
    },
    customServices: [] as Array<{
      id: string;
      name: string;
      description: string;
      price: number;
    }>,
    discount: 0,
    discountType: 'percentage' as 'percentage' | 'fixed',
    validUntil: '',
    notes: ''
  });

  const [planFormData, setPlanFormData] = useState({
    name: '',
    description: '',
    price: 0,
    type: 'starter' as 'starter' | 'premium' | 'completo',
    posts: 0,
    stories: 0,
    presentialRecordings: 0,
    socialMediaManagement: false,
    additionalServices: [] as string[],
    newService: ''
  });

  const resetBudgetForm = () => {
    setBudgetFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientCompany: '',
      selectedPlans: [],
      uniqueService: {
        title: '',
        description: '',
        deadline: '',
        value: 0,
        conditions: ''
      },
      customServices: [],
      discount: 0,
      discountType: 'percentage',
      validUntil: '',
      notes: ''
    });
    setEditingBudget(null);
    setShowBudgetForm(false);
    setBudgetType('monthly');
  };

  const resetPlanForm = () => {
    setPlanFormData({
      name: '',
      description: '',
      price: 0,
      type: 'starter',
      posts: 0,
      stories: 0,
      presentialRecordings: 0,
      socialMediaManagement: false,
      additionalServices: [],
      newService: ''
    });
    setEditingPlan(null);
    setShowPlanForm(false);
  };

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBudget: Budget = {
      id: editingBudget?.id || Date.now().toString(),
      type: budgetType,
      ...budgetFormData,
      status: 'draft',
      createdAt: editingBudget?.createdAt || new Date().toISOString()
    };

    if (editingBudget) {
      setBudgets(prev => prev.map(b => b.id === editingBudget.id ? newBudget : b));
    } else {
      setBudgets(prev => [...prev, newBudget]);
    }

    resetBudgetForm();
  };

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPlan: BudgetPlan = {
      id: editingPlan?.id || Date.now().toString(),
      name: planFormData.name,
      description: planFormData.description,
      price: planFormData.price,
      type: planFormData.type,
      color: planFormData.type === 'starter' ? '#10B981' : 
             planFormData.type === 'premium' ? '#8B5CF6' : '#F59E0B',
      isActive: true,
      features: [
        `${planFormData.posts} posts por mês`,
        `${planFormData.stories} stories por mês`,
        ...(planFormData.presentialRecordings > 0 ? [`${planFormData.presentialRecordings} gravação(ões) presencial(is)`] : []),
        ...(planFormData.socialMediaManagement ? ['Gestão de redes sociais'] : []),
        ...planFormData.additionalServices
      ],
      customizations: {
        posts: planFormData.posts,
        stories: planFormData.stories,
        presentialRecordings: planFormData.presentialRecordings,
        socialMediaManagement: planFormData.socialMediaManagement,
        additionalServices: planFormData.additionalServices
      },
      createdAt: editingPlan?.createdAt || new Date().toISOString()
    };

    if (editingPlan) {
      setBudgetPlans(prev => prev.map(p => p.id === editingPlan.id ? newPlan : p));
    } else {
      setBudgetPlans(prev => [...prev, newPlan]);
    }

    resetPlanForm();
  };

  const addCustomService = () => {
    const newService = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0
    };
    setBudgetFormData(prev => ({
      ...prev,
      customServices: [...prev.customServices, newService]
    }));
  };

  const updateCustomService = (id: string, field: string, value: string | number) => {
    setBudgetFormData(prev => ({
      ...prev,
      customServices: prev.customServices.map(service =>
        service.id === id ? { ...service, [field]: value } : service
      )
    }));
  };

  const removeCustomService = (id: string) => {
    setBudgetFormData(prev => ({
      ...prev,
      customServices: prev.customServices.filter(service => service.id !== id)
    }));
  };

  const addAdditionalService = () => {
    if (planFormData.newService.trim()) {
      setPlanFormData(prev => ({
        ...prev,
        additionalServices: [...prev.additionalServices, prev.newService.trim()],
        newService: ''
      }));
    }
  };

  const removeAdditionalService = (index: number) => {
    setPlanFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.filter((_, i) => i !== index)
    }));
  };

  const calculateBudgetTotal = (budget: Budget) => {
    let total = 0;

    if (budget.type === 'monthly') {
      budget.selectedPlans?.forEach(planId => {
        const plan = budgetPlans.find(p => p.id === planId);
        if (plan) total += plan.price;
      });
    } else {
      total = budget.uniqueService?.value || 0;
    }

    budget.customServices.forEach(service => {
      total += service.price;
    });

    if (budget.discount > 0) {
      if (budget.discountType === 'percentage') {
        total = total * (1 - budget.discount / 100);
      } else {
        total = total - budget.discount;
      }
    }

    return Math.max(0, total);
  };

  const exportBudgetToPDF = async (budget: Budget) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    pdf.setFontSize(24);
    pdf.setTextColor(106, 13, 173);
    pdf.text('TARGET Marketing', 15, yPosition);
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Soluções em Marketing Digital', 15, yPosition + 8);
    
    pdf.setDrawColor(106, 13, 173);
    pdf.setLineWidth(0.5);
    pdf.line(15, yPosition + 15, pageWidth - 15, yPosition + 15);

    yPosition += 30;

    // Title
    pdf.setFontSize(20);
    pdf.setTextColor(106, 13, 173);
    pdf.text(`ORÇAMENTO ${budget.type === 'monthly' ? 'MENSAL' : 'ÚNICO'}`, 15, yPosition);
    
    yPosition += 15;

    // Client info
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('DADOS DO CLIENTE', 15, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.text(`Cliente: ${budget.clientName}`, 15, yPosition);
    yPosition += 5;
    if (budget.clientCompany) {
      pdf.text(`Empresa: ${budget.clientCompany}`, 15, yPosition);
      yPosition += 5;
    }
    pdf.text(`Email: ${budget.clientEmail}`, 15, yPosition);
    yPosition += 5;
    pdf.text(`Telefone: ${budget.clientPhone}`, 15, yPosition);
    yPosition += 15;

    // Budget details
    if (budget.type === 'monthly') {
      pdf.setFontSize(14);
      pdf.setTextColor(106, 13, 173);
      pdf.text('PLANOS SELECIONADOS', 15, yPosition);
      yPosition += 10;

      budget.selectedPlans?.forEach(planId => {
        const plan = budgetPlans.find(p => p.id === planId);
        if (plan) {
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${plan.name} - R$ ${plan.price.toFixed(2)}`, 15, yPosition);
          yPosition += 7;
          
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          plan.features.forEach(feature => {
            pdf.text(`• ${feature}`, 20, yPosition);
            yPosition += 4;
          });
          yPosition += 5;
        }
      });
    } else {
      pdf.setFontSize(14);
      pdf.setTextColor(106, 13, 173);
      pdf.text('SERVIÇO SOLICITADO', 15, yPosition);
      yPosition += 10;

      if (budget.uniqueService) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Serviço: ${budget.uniqueService.title}`, 15, yPosition);
        yPosition += 7;
        pdf.text(`Valor: R$ ${budget.uniqueService.value.toFixed(2)}`, 15, yPosition);
        yPosition += 7;
        pdf.text(`Prazo: ${budget.uniqueService.deadline}`, 15, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.text('Descrição:', 15, yPosition);
        yPosition += 5;
        const descLines = pdf.splitTextToSize(budget.uniqueService.description, pageWidth - 30);
        pdf.text(descLines, 15, yPosition);
        yPosition += descLines.length * 4 + 10;
      }
    }

    // Custom services
    if (budget.customServices.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(106, 13, 173);
      pdf.text('SERVIÇOS ADICIONAIS', 15, yPosition);
      yPosition += 10;

      budget.customServices.forEach(service => {
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${service.name} - R$ ${service.price.toFixed(2)}`, 15, yPosition);
        yPosition += 5;
        if (service.description) {
          pdf.setTextColor(100, 100, 100);
          pdf.text(service.description, 20, yPosition);
          yPosition += 5;
        }
      });
      yPosition += 10;
    }

    // Total
    const total = calculateBudgetTotal(budget);
    pdf.setFillColor(106, 13, 173);
    pdf.rect(15, yPosition - 5, pageWidth - 30, 15, 'F');
    
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`VALOR TOTAL: R$ ${total.toFixed(2)}`, 20, yPosition + 5);
    
    yPosition += 20;

    // Conditions
    pdf.setFontSize(12);
    pdf.setTextColor(106, 13, 173);
    pdf.text('CONDIÇÕES COMERCIAIS', 15, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Validade da proposta: ${new Date(budget.validUntil).toLocaleDateString('pt-BR')}`, 15, yPosition);
    yPosition += 5;
    
    if (budget.type === 'monthly') {
      pdf.text('• Pagamento mensal via PIX, boleto ou cartão', 15, yPosition);
      yPosition += 4;
      pdf.text('• Contrato com fidelidade mínima de 6 meses', 15, yPosition);
      yPosition += 4;
    }
    
    if (budget.notes) {
      yPosition += 5;
      pdf.text('Observações:', 15, yPosition);
      yPosition += 4;
      const notesLines = pdf.splitTextToSize(budget.notes, pageWidth - 30);
      pdf.text(notesLines, 15, yPosition);
    }

    // Footer
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('TARGET Marketing Digital | contato@targetagency.com.br | (11) 99999-9999', 15, pageHeight - 15);
    pdf.text(`Orçamento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 15, pageHeight - 10);

    const fileName = `orcamento-${budget.clientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  const handleEditBudget = (budget: Budget) => {
    setBudgetType(budget.type);
    setBudgetFormData({
      clientName: budget.clientName,
      clientEmail: budget.clientEmail,
      clientPhone: budget.clientPhone,
      clientCompany: budget.clientCompany || '',
      selectedPlans: budget.selectedPlans || [],
      uniqueService: budget.uniqueService || {
        title: '',
        description: '',
        deadline: '',
        value: 0,
        conditions: ''
      },
      customServices: budget.customServices,
      discount: budget.discount,
      discountType: budget.discountType,
      validUntil: budget.validUntil,
      notes: budget.notes || ''
    });
    setEditingBudget(budget);
    setShowBudgetForm(true);
  };

  const handleEditPlan = (plan: BudgetPlan) => {
    setPlanFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      type: plan.type,
      posts: plan.customizations.posts,
      stories: plan.customizations.stories,
      presentialRecordings: plan.customizations.presentialRecordings,
      socialMediaManagement: plan.customizations.socialMediaManagement,
      additionalServices: plan.customizations.additionalServices,
      newService: ''
    });
    setEditingPlan(plan);
    setShowPlanForm(true);
  };

  const deleteBudget = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      setBudgets(prev => prev.filter(b => b.id !== id));
    }
  };

  const deletePlan = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      setBudgetPlans(prev => prev.filter(p => p.id !== id));
    }
  };

  const getStatusColor = (status: Budget['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Budget['status']) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'sent': return 'Enviado';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      case 'expired': return 'Expirado';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-8 text-white shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sistema de Orçamentos</h1>
            <p className="text-blue-100">Gerencie orçamentos mensais e únicos</p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
            <Calculator className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => {
            setBudgetType('monthly');
            setShowBudgetForm(true);
          }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Calendar className="w-5 h-5" />
          Orçamento Mensal
        </button>
        
        <button
          onClick={() => {
            setBudgetType('unique');
            setShowBudgetForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Briefcase className="w-5 h-5" />
          Orçamento Único
        </button>
        
        <button
          onClick={() => setShowPlanForm(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Package className="w-5 h-5" />
          Gerenciar Planos
        </button>
      </div>

      {/* Budget Plans Overview */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {budgetPlans.filter(plan => plan.isActive).map(plan => (
            <div key={plan.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: plan.color }}>{plan.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
              <div className="text-2xl font-bold mb-4" style={{ color: plan.color }}>
                R$ {plan.price.toFixed(2)}/mês
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: plan.color }}></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Budgets List */}
      <div className="bg-white rounded-xl shadow-elegant overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Orçamentos Criados ({budgets.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Valor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Validade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {budgets.map(budget => (
                <tr key={budget.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{budget.clientName}</div>
                      {budget.clientCompany && (
                        <div className="text-sm text-gray-500">{budget.clientCompany}</div>
                      )}
                      <div className="text-sm text-gray-500">{budget.clientEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      budget.type === 'monthly' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {budget.type === 'monthly' ? 'Mensal' : 'Único'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">
                    R$ {calculateBudgetTotal(budget).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                      {getStatusText(budget.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(budget.validUntil).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportBudgetToPDF(budget)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Exportar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBudget(budget.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {budgets.length === 0 && (
            <div className="text-center py-12">
              <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhum orçamento criado ainda</p>
              <p className="text-gray-400">Clique em um dos botões acima para começar</p>
            </div>
          )}
        </div>
      </div>

      {/* Budget Form Modal */}
      {showBudgetForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 gradient-text">
              {editingBudget ? 'Editar' : 'Novo'} Orçamento {budgetType === 'monthly' ? 'Mensal' : 'Único'}
            </h3>
            
            <form onSubmit={handleBudgetSubmit} className="space-y-6">
              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={budgetFormData.clientName}
                    onChange={(e) => setBudgetFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={budgetFormData.clientCompany}
                    onChange={(e) => setBudgetFormData(prev => ({ ...prev, clientCompany: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={budgetFormData.clientEmail}
                    onChange={(e) => setBudgetFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={budgetFormData.clientPhone}
                    onChange={(e) => setBudgetFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Budget Type Specific Fields */}
              {budgetType === 'monthly' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Selecione os Planos *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {budgetPlans.filter(plan => plan.isActive).map(plan => (
                      <label key={plan.id} className="flex items-start p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={budgetFormData.selectedPlans.includes(plan.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBudgetFormData(prev => ({
                                ...prev,
                                selectedPlans: [...prev.selectedPlans, plan.id]
                              }));
                            } else {
                              setBudgetFormData(prev => ({
                                ...prev,
                                selectedPlans: prev.selectedPlans.filter(id => id !== plan.id)
                              }));
                            }
                          }}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <div className="font-medium" style={{ color: plan.color }}>{plan.name}</div>
                          <div className="text-sm text-gray-600 mb-2">{plan.description}</div>
                          <div className="text-lg font-bold" style={{ color: plan.color }}>
                            R$ {plan.price.toFixed(2)}/mês
                          </div>
                          <ul className="mt-2 space-y-1">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="text-xs text-gray-500">• {feature}</li>
                            ))}
                          </ul>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">Detalhes do Serviço Único</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título do Serviço *
                      </label>
                      <input
                        type="text"
                        required
                        value={budgetFormData.uniqueService.title}
                        onChange={(e) => setBudgetFormData(prev => ({
                          ...prev,
                          uniqueService: { ...prev.uniqueService, title: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Ex: Criação de Logotipo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={budgetFormData.uniqueService.value}
                        onChange={(e) => setBudgetFormData(prev => ({
                          ...prev,
                          uniqueService: { ...prev.uniqueService, value: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prazo de Entrega *
                    </label>
                    <input
                      type="text"
                      required
                      value={budgetFormData.uniqueService.deadline}
                      onChange={(e) => setBudgetFormData(prev => ({
                        ...prev,
                        uniqueService: { ...prev.uniqueService, deadline: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: 15 dias úteis"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição do Serviço *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={budgetFormData.uniqueService.description}
                      onChange={(e) => setBudgetFormData(prev => ({
                        ...prev,
                        uniqueService: { ...prev.uniqueService, description: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Descreva detalhadamente o que será entregue..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condições
                    </label>
                    <textarea
                      rows={3}
                      value={budgetFormData.uniqueService.conditions}
                      onChange={(e) => setBudgetFormData(prev => ({
                        ...prev,
                        uniqueService: { ...prev.uniqueService, conditions: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Condições especiais, forma de pagamento, etc..."
                    />
                  </div>
                </div>
              )}

              {/* Custom Services */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Serviços Adicionais</h4>
                  <button
                    type="button"
                    onClick={addCustomService}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>
                {budgetFormData.customServices.map(service => (
                  <div key={service.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-xl">
                    <input
                      type="text"
                      placeholder="Nome do serviço"
                      value={service.name}
                      onChange={(e) => updateCustomService(service.id, 'name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={service.description}
                      onChange={(e) => updateCustomService(service.id, 'description', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Valor (R$)"
                      value={service.price}
                      onChange={(e) => updateCustomService(service.id, 'price', parseFloat(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomService(service.id)}
                      className="text-red-600 hover:text-red-800 px-3 py-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Discount and Validity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desconto
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={budgetFormData.discount}
                      onChange={(e) => setBudgetFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <select
                      value={budgetFormData.discountType}
                      onChange={(e) => setBudgetFormData(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">R$</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Válido até *
                  </label>
                  <input
                    type="date"
                    required
                    value={budgetFormData.validUntil}
                    onChange={(e) => setBudgetFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Total
                  </label>
                  <div className="px-4 py-3 bg-gray-100 rounded-xl text-lg font-bold text-green-600">
                    R$ {calculateBudgetTotal({
                      ...budgetFormData,
                      type: budgetType,
                      id: '',
                      status: 'draft',
                      createdAt: ''
                    } as Budget).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  rows={3}
                  value={budgetFormData.notes}
                  onChange={(e) => setBudgetFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Informações adicionais para o cliente..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetBudgetForm}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  {editingBudget ? 'Atualizar' : 'Criar'} Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Form Modal */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 gradient-text">
              {editingPlan ? 'Editar' : 'Novo'} Plano
            </h3>
            
            <form onSubmit={handlePlanSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Plano *
                  </label>
                  <input
                    type="text"
                    required
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    required
                    value={planFormData.type}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, type: e.target.value as 'starter' | 'premium' | 'completo' }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="starter">Starter</option>
                    <option value="premium">Premium</option>
                    <option value="completo">Completo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <textarea
                  required
                  rows={3}
                  value={planFormData.description}
                  onChange={(e) => setPlanFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço Mensal (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={planFormData.price}
                  onChange={(e) => setPlanFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posts por mês *
                  </label>
                  <input
                    type="number"
                    required
                    value={planFormData.posts}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, posts: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stories por mês *
                  </label>
                  <input
                    type="number"
                    required
                    value={planFormData.stories}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, stories: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gravações presenciais *
                  </label>
                  <input
                    type="number"
                    required
                    value={planFormData.presentialRecordings}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, presentialRecordings: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={planFormData.socialMediaManagement}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, socialMediaManagement: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Inclui gestão de redes sociais</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serviços Adicionais
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={planFormData.newService}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, newService: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Digite um serviço adicional"
                  />
                  <button
                    type="button"
                    onClick={addAdditionalService}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {planFormData.additionalServices.map((service, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-sm">{service}</span>
                      <button
                        type="button"
                        onClick={() => removeAdditionalService(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetPlanForm}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  {editingPlan ? 'Atualizar' : 'Criar'} Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetSystem;