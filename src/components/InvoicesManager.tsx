import React, { useState, useMemo } from 'react';
import { useCRM, Invoice } from '../context/CRMContext';
import { Receipt, Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle, Calendar, TrendingUp, BarChart3, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

const statusOptions = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'paid', label: 'Pago', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'overdue', label: 'Atrasado', color: 'bg-red-100 text-red-800', icon: AlertCircle }
];

export default function InvoicesManager() {
  const { invoices, addInvoice, updateInvoice, deleteInvoice, clients, uniqueJobs, generateClientInvoices } = useCRM();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    uniqueJobId: '',
    type: 'client',
    clientName: '',
    amount: '',
    dueDate: '',
    description: '',
    status: 'pending'
  });

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice => selectedStatus === 'all' || invoice.status === selectedStatus)
      .sort((a, b) => {
        // Ordenar por proximidade da data de vencimento
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        const now = new Date().getTime();
        
        // Faturas vencidas primeiro, depois por proximidade
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        
        return Math.abs(dateA - now) - Math.abs(dateB - now);
      });
  }, [invoices, selectedStatus]);

  const getClientById = (id: string) => clients.find(client => client.id === id);
  const getUniqueJobById = (id: string) => uniqueJobs.find(job => job.id === id);

  const getEntityInfo = (invoice: Invoice) => {
    if (invoice.type === 'client') {
      const client = getClientById(invoice.clientId!);
      return {
        name: client?.name || 'Cliente não encontrado',
        color: client?.color || '#6A0DAD',
        photo: client?.profilePhoto,
        company: client?.company
      };
    } else {
      const job = getUniqueJobById(invoice.uniqueJobId!);
      return {
        name: job?.name || 'Trabalho não encontrado',
        color: '#8E24AA',
        photo: null,
        company: null
      };
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateColor = (dueDate: string, status: string) => {
    if (status === 'paid') return 'text-green-600';
    if (status === 'overdue') return 'text-red-600 font-bold';
    
    const days = getDaysUntilDue(dueDate);
    if (days <= 0) return 'text-red-600 font-bold';
    if (days <= 3) return 'text-orange-600 font-semibold';
    if (days <= 7) return 'text-yellow-600';
    return 'text-gray-900';
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoiceData = {
      type: formData.type as 'client' | 'uniqueJob',
      clientId: formData.type === 'client' ? formData.clientId : undefined,
      uniqueJobId: formData.type === 'uniqueJob' ? formData.uniqueJobId : undefined,
      clientName: formData.clientName,
      description: formData.description,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      status: formData.status as 'pending' | 'paid' | 'overdue'
    };

    if (editingInvoice) {
      updateInvoice({
        ...invoiceData,
        id: editingInvoice.id,
        createdAt: editingInvoice.createdAt
      });
    } else {
      addInvoice(invoiceData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      uniqueJobId: '',
      type: 'client',
      clientName: '',
      amount: '',
      dueDate: '',
      description: '',
      status: 'pending'
    });
    setEditingInvoice(null);
    setIsFormOpen(false);
  };

  const handleEdit = (invoice: Invoice) => {
    setFormData({
      clientId: invoice.clientId || '',
      uniqueJobId: invoice.uniqueJobId || '',
      type: invoice.type,
      clientName: invoice.clientName || '',
      amount: invoice.amount.toString(),
      dueDate: invoice.dueDate,
      description: invoice.description,
      status: invoice.status
    });
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const getTotalByStatus = (status: string) => {
    return filteredInvoices
      .filter(invoice => invoice.status === status)
      .reduce((sum, invoice) => sum + invoice.amount, 0);
  };

  const getActiveClientsWithBilling = () => {
    return clients.filter(client => 
      client.status === 'active' && 
      client.monthlyValue > 0 && 
      client.paymentDay > 0
    ).length;
  };

  const getNextMonthProjection = () => {
    return clients
      .filter(client => client.status === 'active' && client.monthlyValue > 0)
      .reduce((sum, client) => sum + client.monthlyValue, 0);
  };

  const getCurrentMonthPendingTotal = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.dueDate);
        return invoice.status === 'pending' &&
               invoiceDate.getMonth() === currentMonth &&
               invoiceDate.getFullYear() === currentYear;
      })
      .reduce((sum, invoice) => sum + invoice.amount, 0);
  };

  // Monthly revenue calculations
  const getMonthlyRevenue = () => {
    const monthlyData: { [key: string]: { paid: number; pending: number; overdue: number; total: number; month: string; year: number } } = {};
    
    invoices.forEach(invoice => {
      // Use payment date for paid invoices, due date for others
      const dateToUse = invoice.status === 'paid' && invoice.createdAt ? new Date(invoice.createdAt) : new Date(invoice.dueDate);
      const monthKey = `${dateToUse.getFullYear()}-${String(dateToUse.getMonth() + 1).padStart(2, '0')}`;
      const monthName = dateToUse.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          paid: 0,
          pending: 0,
          overdue: 0,
          total: 0,
          month: monthName,
          year: dateToUse.getFullYear()
        };
      }
      
      monthlyData[monthKey][invoice.status] += invoice.amount;
      monthlyData[monthKey].total += invoice.amount;
    });
    
    // Convert to array and sort by date (most recent first)
    return Object.entries(monthlyData)
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.key.localeCompare(a.key))
      .slice(0, 12); // Last 12 months
  };

  const monthlyRevenue = getMonthlyRevenue();

  const exportSpecificMonthToPDF = async (monthData: { key: string; paid: number; pending: number; overdue: number; total: number; month: string; year: number }) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header with logo
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = 'https://i.ibb.co/G4kyHSsr/icone-target.png';
      
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 64;
      canvas.height = 64;
      ctx?.drawImage(logoImg, 0, 0, 64, 64);
      const logoDataUrl = canvas.toDataURL('image/png');
      
      pdf.addImage(logoDataUrl, 'PNG', 15, 10, 16, 16);
    } catch (error) {
      console.log('Erro ao carregar logo:', error);
    }

    // Title
    pdf.setFontSize(20);
    pdf.setTextColor(181, 69, 255);
    pdf.text('TARGET CRM - Relatório Mensal', 35, 20);
    
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Faturamento - ${monthData.month}`, 15, 35);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 42);
    
    yPosition = 60;

    // Month Summary Cards
    pdf.setFillColor(248, 250, 252);
    pdf.rect(15, yPosition, pageWidth - 30, 40, 'F');
    
    pdf.setDrawColor(181, 69, 255);
    pdf.setLineWidth(0.5);
    pdf.rect(15, yPosition, pageWidth - 30, 40);
    
    pdf.setFontSize(14);
    pdf.setTextColor(181, 69, 255);
    pdf.text('RESUMO DO MÊS', 20, yPosition + 12);
    
    yPosition += 20;
    
    // Summary values
    pdf.setFontSize(10);
    pdf.setTextColor(34, 197, 94);
    pdf.text(`Valor Recebido: R$ ${monthData.paid.toFixed(2)}`, 20, yPosition);
    
    pdf.setTextColor(234, 179, 8);
    pdf.text(`Valor Pendente: R$ ${monthData.pending.toFixed(2)}`, 110, yPosition);
    
    yPosition += 8;
    
    pdf.setTextColor(239, 68, 68);
    pdf.text(`Valor Atrasado: R$ ${monthData.overdue.toFixed(2)}`, 20, yPosition);
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.text(`TOTAL DO MÊS: R$ ${monthData.total.toFixed(2)}`, 110, yPosition);
    
    yPosition += 25;

    // Filter invoices for this specific month
    const monthInvoices = invoices.filter(invoice => {
      const dateToUse = invoice.status === 'paid' && invoice.createdAt ? new Date(invoice.createdAt) : new Date(invoice.dueDate);
      const invoiceMonthKey = `${dateToUse.getFullYear()}-${String(dateToUse.getMonth() + 1).padStart(2, '0')}`;
      return invoiceMonthKey === monthData.key;
    });

    // Invoices details section
    if (monthInvoices.length > 0) {
      pdf.setFontSize(12);
      pdf.setTextColor(181, 69, 255);
      pdf.text('DETALHES DAS FATURAS', 20, yPosition);
      yPosition += 10;

      // Table header
      pdf.setFillColor(248, 250, 252);
      pdf.rect(15, yPosition, pageWidth - 30, 8, 'F');
      
      pdf.setDrawColor(181, 69, 255);
      pdf.setLineWidth(0.3);
      pdf.rect(15, yPosition, pageWidth - 30, 8);
      
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Cliente/Trabalho', 20, yPosition + 6);
      pdf.text('Descrição', 80, yPosition + 6);
      pdf.text('Valor', 140, yPosition + 6);
      pdf.text('Status', 170, yPosition + 6);
      
      yPosition += 12;

      // Invoice rows
      monthInvoices.forEach((invoice, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        const entityInfo = getEntityInfo(invoice);
        
        // Alternating row colors
        if (index % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(15, yPosition - 2, pageWidth - 30, 8, 'F');
        }

        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        
        // Client/Job name (truncate if too long)
        const maxNameLength = 25;
        const displayName = entityInfo.name.length > maxNameLength ? 
          entityInfo.name.substring(0, maxNameLength) + '...' : entityInfo.name;
        pdf.text(displayName, 20, yPosition + 4);
        
        // Description (truncate if too long)
        const maxDescLength = 20;
        const displayDesc = invoice.description.length > maxDescLength ? 
          invoice.description.substring(0, maxDescLength) + '...' : invoice.description;
        pdf.text(displayDesc, 80, yPosition + 4);
        
        // Amount
        pdf.text(`R$ ${invoice.amount.toFixed(2)}`, 140, yPosition + 4);
        
        // Status with color
        if (invoice.status === 'paid') {
          pdf.setTextColor(34, 197, 94);
          pdf.text('Pago', 170, yPosition + 4);
        } else if (invoice.status === 'pending') {
          pdf.setTextColor(234, 179, 8);
          pdf.text('Pendente', 170, yPosition + 4);
        } else if (invoice.status === 'overdue') {
          pdf.setTextColor(239, 68, 68);
          pdf.text('Atrasado', 170, yPosition + 4);
        }
        
        yPosition += 10;
      });
    } else {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Nenhuma fatura encontrada para este mês.', 20, yPosition);
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('© 2024 TARGET CRM. Relatório confidencial.', 15, pageHeight - 10);
    pdf.text('Contato: (11) 99237-3084', pageWidth - 60, pageHeight - 10);

    const monthFileName = monthData.month.toLowerCase().replace(/[\s\/]/g, '-');
    pdf.save(`relatorio-${monthFileName}.pdf`);
  };

  const exportMonthlyReportToPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header with logo
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = 'https://i.ibb.co/G4kyHSsr/icone-target.png';
      
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 64;
      canvas.height = 64;
      ctx?.drawImage(logoImg, 0, 0, 64, 64);
      const logoDataUrl = canvas.toDataURL('image/png');
      
      pdf.addImage(logoDataUrl, 'PNG', 15, 10, 16, 16);
    } catch (error) {
      console.log('Erro ao carregar logo:', error);
    }

    // Title
    pdf.setFontSize(20);
    pdf.setTextColor(181, 69, 255);
    pdf.text('TARGET CRM - Relatório Mensal', 35, 20);
    
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Faturamento por Mês', 15, 35);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 42);
    
    yPosition = 55;

    // Monthly data table header
    pdf.setFillColor(248, 250, 252);
    pdf.rect(15, yPosition, pageWidth - 30, 10, 'F');
    
    pdf.setDrawColor(181, 69, 255);
    pdf.setLineWidth(0.5);
    pdf.rect(15, yPosition, pageWidth - 30, 10);
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Mês/Ano', 20, yPosition + 7);
    pdf.text('Pago', 80, yPosition + 7);
    pdf.text('Pendente', 110, yPosition + 7);
    pdf.text('Atrasado', 140, yPosition + 7);
    pdf.text('Total', 170, yPosition + 7);
    
    yPosition += 15;

    // Monthly data rows
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let grandTotal = 0;

    monthlyRevenue.forEach((monthData, index) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      // Alternating row colors
      if (index % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(15, yPosition - 3, pageWidth - 30, 10, 'F');
      }

      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text(monthData.month, 20, yPosition + 4);
      
      // Paid amount in green
      pdf.setTextColor(34, 197, 94);
      pdf.text(`R$ ${monthData.paid.toFixed(2)}`, 80, yPosition + 4);
      
      // Pending amount in yellow/orange
      pdf.setTextColor(234, 179, 8);
      pdf.text(`R$ ${monthData.pending.toFixed(2)}`, 110, yPosition + 4);
      
      // Overdue amount in red
      pdf.setTextColor(239, 68, 68);
      pdf.text(`R$ ${monthData.overdue.toFixed(2)}`, 140, yPosition + 4);
      
      // Total in black
      pdf.setTextColor(0, 0, 0);
      pdf.text(`R$ ${monthData.total.toFixed(2)}`, 170, yPosition + 4);
      
      totalPaid += monthData.paid;
      totalPending += monthData.pending;
      totalOverdue += monthData.overdue;
      grandTotal += monthData.total;
      
      yPosition += 12;
    });

    // Summary totals
    yPosition += 10;
    pdf.setDrawColor(181, 69, 255);
    pdf.setLineWidth(1);
    pdf.line(15, yPosition, pageWidth - 15, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(12);
    pdf.setTextColor(181, 69, 255);
    pdf.text('RESUMO TOTAL:', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(34, 197, 94);
    pdf.text(`Total Recebido: R$ ${totalPaid.toFixed(2)}`, 20, yPosition);
    
    yPosition += 8;
    pdf.setTextColor(234, 179, 8);
    pdf.text(`Total Pendente: R$ ${totalPending.toFixed(2)}`, 20, yPosition);
    
    yPosition += 8;
    pdf.setTextColor(239, 68, 68);
    pdf.text(`Total Atrasado: R$ ${totalOverdue.toFixed(2)}`, 20, yPosition);
    
    yPosition += 8;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.text(`TOTAL GERAL: R$ ${grandTotal.toFixed(2)}`, 20, yPosition);

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('© 2024 TARGET CRM. Relatório confidencial.', 15, pageHeight - 10);

    pdf.save(`relatorio-mensal-${new Date().toISOString().split('T')[0]}.pdf`);
  };


  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-xl p-8 text-white shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestão Financeira</h1>
            <p className="text-emerald-100">Controle de faturas e pagamentos</p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
            <Receipt className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Próximos Vencimentos */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          Próximos Vencimentos
        </h2>
        <div className="space-y-3">
          {invoices
            .filter(invoice => invoice.status === 'pending')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5)
            .map(invoice => {
              const entityInfo = getEntityInfo(invoice);
              const days = getDaysUntilDue(invoice.dueDate);
              
              return (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    {entityInfo.photo ? (
                      <img
                        src={entityInfo.photo}
                        alt={entityInfo.name}
                        className="w-10 h-10 rounded-full object-cover border-2"
                        style={{ borderColor: entityInfo.color }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: entityInfo.color }}
                      >
                        {entityInfo.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{entityInfo.name}</div>
                      {entityInfo.company && (
                        <div className="text-sm text-gray-500">{entityInfo.company}</div>
                      )}
                      <div className="text-sm text-gray-600">{invoice.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900">
                      R$ {invoice.amount.toFixed(2)}
                    </div>
                    <div className={`text-sm ${getDueDateColor(invoice.dueDate, invoice.status)}`}>
                      {days === 0 ? 'Vence hoje' : 
                       days < 0 ? `${Math.abs(days)} dias atrasado` :
                       `${days} dias restantes`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              );
            })}
          {invoices.filter(invoice => invoice.status === 'pending').length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
              <p>Nenhuma fatura pendente</p>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {statusOptions.map((status) => {
          const total = getTotalByStatus(status.value);
          const count = filteredInvoices.filter(inv => inv.status === status.value).length;
          const StatusIcon = status.icon;

          return (
            <div key={status.value} className="bg-white rounded-xl p-6 shadow-elegant hover:shadow-xl transition-all duration-300 card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${status.color.replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                  <StatusIcon className="w-6 h-6" />
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                  {count} faturas
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{status.label}</h3>
              <p className="text-2xl font-bold text-gray-900">
                R$ {total.toFixed(2)}
              </p>
            </div>
          );
        })}
        
        <div className="bg-white rounded-xl p-6 shadow-elegant hover:shadow-xl transition-all duration-300 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              Próximo mês
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Projeção Próximo Mês</h3>
          <p className="text-2xl font-bold text-gray-900">
            R$ {getNextMonthProjection().toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Receita prevista baseada nas faturas pendentes
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-elegant hover:shadow-xl transition-all duration-300 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              {getActiveClientsWithBilling()} clientes
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Faturamento Automático</h3>
          <p className="text-2xl font-bold text-gray-900">
            Ativo
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Clientes configurados para cobrança automática
          </p>
        </div>
      </div>

      {/* Monthly Revenue Report */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Faturamento Mensal
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowMonthlyReport(!showMonthlyReport)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <BarChart3 className="w-4 h-4" />
              {showMonthlyReport ? 'Ocultar' : 'Ver Detalhes'}
            </button>
            <button
              onClick={exportMonthlyReportToPDF}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </div>

        {showMonthlyReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Total Recebido</p>
                    <p className="text-xl font-bold text-green-600">
                      R$ {monthlyRevenue.reduce((sum, month) => sum + month.paid, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Total Pendente</p>
                    <p className="text-xl font-bold text-yellow-600">
                      R$ {monthlyRevenue.reduce((sum, month) => sum + month.pending, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">Total Atrasado</p>
                    <p className="text-xl font-bold text-red-600">
                      R$ {monthlyRevenue.reduce((sum, month) => sum + month.overdue, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">Total Geral</p>
                    <p className="text-xl font-bold text-purple-600">
                      R$ {monthlyRevenue.reduce((sum, month) => sum + month.total, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Mês/Ano</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Recebido</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Pendente</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Atrasado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monthlyRevenue.map((monthData) => {
                    const maxValue = Math.max(monthData.paid, monthData.pending, monthData.overdue);
                    const isCurrentMonth = new Date().getMonth() === new Date(monthData.key + '-01').getMonth() && 
                                         new Date().getFullYear() === new Date(monthData.key + '-01').getFullYear();
                    
                    return (
                      <tr key={monthData.key} className={`hover:bg-gray-50 transition-colors ${isCurrentMonth ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {monthData.month}
                            {isCurrentMonth && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Atual
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-green-600">
                            R$ {monthData.paid.toFixed(2)}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${monthData.total > 0 ? (monthData.paid / monthData.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-yellow-600">
                            R$ {monthData.pending.toFixed(2)}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${monthData.total > 0 ? (monthData.pending / monthData.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-red-600">
                            R$ {monthData.overdue.toFixed(2)}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${monthData.total > 0 ? (monthData.overdue / monthData.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">
                            R$ {monthData.total.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-2">
                              {monthData.paid === monthData.total && monthData.total > 0 ? (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Completo
                                </span>
                              ) : monthData.overdue > 0 ? (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  ⚠ Pendências
                                </span>
                              ) : monthData.pending > 0 ? (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  ⏳ Em Andamento
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  - Sem dados
                                </span>
                              )}
                              {monthData.total > 0 && (
                                <button
                                  onClick={() => exportSpecificMonthToPDF(monthData)}
                                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center gap-1 shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 text-xs"
                                  title={`Baixar PDF de ${monthData.month}`}
                                >
                                  <Download className="w-3 h-3" />
                                  PDF
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {monthlyRevenue.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Nenhum dado financeiro encontrado</p>
                  <p className="text-sm">Comece criando algumas faturas para ver o relatório mensal</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!showMonthlyReport && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {monthlyRevenue.slice(0, 3).map((monthData, index) => (
              <div key={monthData.key} className={`p-4 rounded-xl border ${index === 0 ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-semibold ${index === 0 ? 'text-blue-800' : 'text-gray-800'}`}>
                    {monthData.month}
                    {index === 0 && (
                      <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                        Atual
                      </span>
                    )}
                  </h4>
                  <TrendingUp className={`w-4 h-4 ${index === 0 ? 'text-blue-600' : 'text-gray-600'}`} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">Recebido:</span>
                    <span className="font-medium text-green-600">R$ {monthData.paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-yellow-600">Pendente:</span>
                    <span className="font-medium text-yellow-600">R$ {monthData.pending.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">Atrasado:</span>
                    <span className="font-medium text-red-600">R$ {monthData.overdue.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Total:</span>
                      <span className="font-bold text-gray-900">R$ {monthData.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {monthlyRevenue.length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Nenhum dado financeiro encontrado</p>
                <p className="text-sm">Comece criando algumas faturas para ver o relatório mensal</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4">
          <div className="bg-white rounded-xl p-6 shadow-elegant">
            <h3 className="font-semibold text-gray-800 mb-4">Filtros</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="lg:w-3/4 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">
              Faturas ({filteredInvoices.length})
            </h2>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Nova Fatura
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-elegant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cliente/Trabalho</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Descrição</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Valor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Vencimento</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => {
                    const entityInfo = getEntityInfo(invoice);
                    const status = statusOptions.find(s => s.value === invoice.status);
                    const StatusIcon = status?.icon || Clock;
                    const days = getDaysUntilDue(invoice.dueDate);

                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {entityInfo.photo ? (
                              <img
                                src={entityInfo.photo}
                                alt={entityInfo.name}
                                className="w-10 h-10 rounded-full object-cover border-2"
                                style={{ borderColor: entityInfo.color }}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                style={{ backgroundColor: entityInfo.color }}
                              >
                                {entityInfo.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{entityInfo.name}</div>
                              {entityInfo.company && (
                                <div className="text-sm text-gray-500">{entityInfo.company}</div>
                              )}
                              <div className="text-sm text-gray-500 capitalize">
                                {invoice.type === 'client' ? 'Cliente' : 'Trabalho'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {invoice.description}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-green-600">
                          R$ {invoice.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm ${getDueDateColor(invoice.dueDate, invoice.status)}`}>
                            {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                          </div>
                          {invoice.status === 'pending' && (
                            <div className={`text-xs ${getDueDateColor(invoice.dueDate, invoice.status)}`}>
                              {days === 0 ? 'Vence hoje' : 
                               days < 0 ? `${Math.abs(days)} dias atrasado` :
                               `${days} dias restantes`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="w-4 h-4" />
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status?.color || 'bg-gray-100 text-gray-800'}`}>
                              {status?.label || 'Status desconhecido'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(invoice)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteInvoice(invoice.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 gradient-text">
              {editingInvoice ? 'Editar Fatura' : 'Nova Fatura'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, clientId: '', uniqueJobId: '' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="client">Cliente</option>
                  <option value="uniqueJob">Trabalho Único</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'client' ? 'Cliente' : 'Trabalho'} *
                </label>
                <select
                  required
                  value={formData.type === 'client' ? formData.clientId : formData.uniqueJobId}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    [formData.type === 'client' ? 'clientId' : 'uniqueJobId']: e.target.value 
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">
                    Selecione {formData.type === 'client' ? 'um cliente' : 'um trabalho'}
                  </option>
                  {(formData.type === 'client' ? clients : uniqueJobs).map(entity => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cliente na Fatura *
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nome que aparecerá na fatura"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Serviços de Marketing - Janeiro 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  {editingInvoice ? 'Atualizar' : 'Criar Fatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}