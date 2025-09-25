import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Calculator, Plus, Download, Edit2, Trash2, Calendar, Package, Briefcase, Users, Gift, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

interface ServiceItem {
  id: string;
  title: string;
  description: string;
}

interface GiftItem {
  id: string;
  title: string;
  description: string;
}

const QuotesManager: React.FC = () => {
  const { quotes, clients, addQuote, updateQuote, deleteQuote } = useCRM();
  
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteType, setQuoteType] = useState<'monthly' | 'unique'>('monthly');
  const [editingQuote, setEditingQuote] = useState<any>(null);
  
  const [quoteFormData, setQuoteFormData] = useState({
    planName: '',
    planType: 'plano' as 'plano' | 'servico', // New field to choose between plan or service
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    clientId: '',
    services: [] as ServiceItem[],
    gifts: [] as GiftItem[],
    monthlyValue: 0,
    uniqueValue: 0,
    validUntil: '',
    notes: ''
  });

  const resetQuoteForm = () => {
    setQuoteFormData({
      planName: '',
      planType: 'plano',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientCompany: '',
      clientId: '',
      services: [],
      gifts: [],
      monthlyValue: 0,
      uniqueValue: 0,
      validUntil: '',
      notes: ''
    });
    setEditingQuote(null);
    setShowQuoteForm(false);
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert Brazilian date format (DD/MM/YYYY) to ISO format (YYYY-MM-DD) for storage
    const convertToISODate = (brazilianDate: string): string => {
      const parts = brazilianDate.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return brazilianDate; // Return as-is if format is invalid
    };
    
    const validUntilISO = convertToISODate(quoteFormData.validUntil);
    
    if (editingQuote) {
      updateQuote({
        ...editingQuote,
        type: quoteType,
        planName: quoteFormData.planName,
        planType: quoteFormData.planType,
        clientName: quoteFormData.clientName,
        clientEmail: quoteFormData.clientEmail,
        clientPhone: quoteFormData.clientPhone,
        clientCompany: quoteFormData.clientCompany,
        clientId: quoteFormData.clientId || undefined,
        services: quoteFormData.services,
        gifts: quoteFormData.gifts.length > 0 ? quoteFormData.gifts : undefined,
        monthlyValue: quoteType === 'monthly' ? quoteFormData.monthlyValue : undefined,
        uniqueValue: quoteType === 'unique' ? quoteFormData.uniqueValue : undefined,
        validUntil: validUntilISO,
        notes: quoteFormData.notes || undefined
      });
    } else {
      addQuote({
        type: quoteType,
        planName: quoteFormData.planName,
        planType: quoteFormData.planType,
        clientName: quoteFormData.clientName,
        clientEmail: quoteFormData.clientEmail,
        clientPhone: quoteFormData.clientPhone,
        clientCompany: quoteFormData.clientCompany,
        clientId: quoteFormData.clientId || undefined,
        services: quoteFormData.services,
        gifts: quoteFormData.gifts.length > 0 ? quoteFormData.gifts : undefined,
        monthlyValue: quoteType === 'monthly' ? quoteFormData.monthlyValue : undefined,
        uniqueValue: quoteType === 'unique' ? quoteFormData.uniqueValue : undefined,
        validUntil: validUntilISO,
        status: 'draft',
        notes: quoteFormData.notes || undefined
      });
    }
    
    resetQuoteForm();
  };

  const handleClientSelection = (clientId: string) => {
    if (clientId) {
      const selectedClient = clients.find(c => c.id === clientId);
      if (selectedClient) {
        setQuoteFormData(prev => ({
          ...prev,
          clientId: clientId,
          clientName: selectedClient.name,
          clientEmail: selectedClient.email,
          clientPhone: selectedClient.phone,
          clientCompany: selectedClient.company || ''
        }));
      }
    } else {
      setQuoteFormData(prev => ({
        ...prev,
        clientId: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientCompany: ''
      }));
    }
  };

  const addService = () => {
    const newService: ServiceItem = {
      id: Date.now().toString(),
      title: '',
      description: ''
    };
    setQuoteFormData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));
  };

  const updateService = (serviceId: string, field: keyof ServiceItem, value: string) => {
    setQuoteFormData(prev => ({
      ...prev,
      services: prev.services.map(service =>
        service.id === serviceId ? { ...service, [field]: value } : service
      )
    }));
  };

  const removeService = (serviceId: string) => {
    setQuoteFormData(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== serviceId)
    }));
  };

  const addGift = () => {
    const newGift: GiftItem = {
      id: Date.now().toString(),
      title: '',
      description: ''
    };
    setQuoteFormData(prev => ({
      ...prev,
      gifts: [...prev.gifts, newGift]
    }));
  };

  const updateGift = (giftId: string, field: keyof GiftItem, value: string) => {
    setQuoteFormData(prev => ({
      ...prev,
      gifts: prev.gifts.map(gift =>
        gift.id === giftId ? { ...gift, [field]: value } : gift
      )
    }));
  };

  const removeGift = (giftId: string) => {
    setQuoteFormData(prev => ({
      ...prev,
      gifts: prev.gifts.filter(gift => gift.id !== giftId)
    }));
  };

  const generatePDF = (quote: any) => {
    const pdf = new jsPDF();
    
    // Add TARGET logo with purple header
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      // Create purple header background
      pdf.setFillColor(181, 69, 255); // New purple color #b545ff
      pdf.rect(0, 0, 210, 40, 'F'); // Full width purple header
      
      // Calculate center position for logo (A4 width = 210mm)
      const logoWidth = 60; // Original size without stretching
      const logoHeight = 30; // Proportional height
      const centerX = (210 - logoWidth) / 2;
      
      // Add logo centered in the purple header
      pdf.addImage(logoImg, 'PNG', centerX, 5, logoWidth, logoHeight, undefined, 'FAST');
      
      // Quote title (below header)
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Orçamento ${quote.type === 'monthly' ? 'Mensal' : 'Único'}`, 15, 60);
      
      // Plan name
      pdf.setFontSize(16);
      pdf.setTextColor(181, 69, 255); // Updated purple color
      const planLabel = quote.planType === 'servico' ? 'Serviço' : 'Plano';
      pdf.text(`${planLabel}: ${quote.planName}`, 15, 75);
      
      // Client information
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('INFORMAÇÕES DO CLIENTE', 15, 95);
      
      let yPos = 105;
      pdf.text(`Nome: ${quote.clientName}`, 15, yPos);
      if (quote.clientCompany) {
        yPos += 8;
        pdf.text(`Empresa: ${quote.clientCompany}`, 15, yPos);
      }
      if (quote.clientEmail) {
        yPos += 8;
        pdf.text(`Email: ${quote.clientEmail}`, 15, yPos);
      }
      if (quote.clientPhone) {
        yPos += 8;
        pdf.text(`Telefone: ${quote.clientPhone}`, 15, yPos);
      }
      
      // Services
      yPos += 20;
      pdf.setFontSize(14);
      pdf.setTextColor(181, 69, 255); // Updated purple color
      pdf.text('SERVIÇOS INCLUSOS', 15, yPos);
      
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      quote.services.forEach((service: ServiceItem, index: number) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${service.title}`, 15, yPos);
        yPos += 6;
        
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(service.description, 170);
        pdf.text(lines, 20, yPos);
        yPos += lines.length * 4 + 5;
      });
      
      // Gifts (if any)
      if (quote.gifts && quote.gifts.length > 0) {
        yPos += 10;
        pdf.setFontSize(14);
        pdf.setTextColor(181, 69, 255); // Updated purple color
        pdf.text('BRINDES INCLUSOS', 15, yPos);
        
        yPos += 10;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        quote.gifts.forEach((gift: GiftItem, index: number) => {
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${gift.title}`, 15, yPos);
          yPos += 6;
          
          pdf.setFont('helvetica', 'normal');
          const lines = pdf.splitTextToSize(gift.description, 170);
          pdf.text(lines, 20, yPos);
          yPos += lines.length * 4 + 5;
        });
      }
      
      // Value
      yPos += 15;
      pdf.setFontSize(16);
      pdf.setTextColor(181, 69, 255); // Updated purple color
      const value = quote.type === 'monthly' ? quote.monthlyValue : quote.uniqueValue;
      const valueText = quote.type === 'monthly' 
        ? `Valor Mensal: R$ ${value?.toFixed(2).replace('.', ',')}`
        : `Valor Único: R$ ${value?.toFixed(2).replace('.', ',')}`;
      pdf.text(valueText, 15, yPos);
      
      // Validity
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Válido até: ${new Date(quote.validUntil + 'T00:00:00').toLocaleDateString('pt-BR')}`, 15, yPos);
      
      // Notes
      if (quote.notes) {
        yPos += 15;
        pdf.setFontSize(12);
        pdf.setTextColor(181, 69, 255); // Updated purple color
        pdf.text('OBSERVAÇÕES', 15, yPos);
        
        yPos += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        const notesLines = pdf.splitTextToSize(quote.notes, 170);
        pdf.text(notesLines, 15, yPos);
      }
      
      // Footer
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('TARGET Marketing Digital | contato@targetagency.com.br | (11) 99237-3084', 15, pageHeight - 15);
      pdf.text(`Orçamento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 15, pageHeight - 10);

      const fileName = `orcamento-${quote.planName.toLowerCase().replace(/\s+/g, '-')}-${quote.clientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    };
    
    logoImg.onerror = () => {
      // Fallback: generate PDF with purple header but no logo if image fails to load
      console.warn('Failed to load TARGET logo, generating PDF with purple header only');
      
      // Create purple header background
      pdf.setFillColor(181, 69, 255); // New purple color #b545ff
      pdf.rect(0, 0, 210, 40, 'F'); // Full width purple header
      
      // Add white text centered in header
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255); // White text
      const headerText = 'TARGET Marketing Digital';
      const textWidth = pdf.getTextWidth(headerText);
      const centerX = (210 - textWidth) / 2;
      pdf.text(headerText, centerX, 25);
      
      // Quote title (below header)
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Orçamento ${quote.type === 'monthly' ? 'Mensal' : 'Único'}`, 15, 60);
      
      // Plan name
      pdf.setFontSize(16);
      pdf.setTextColor(106, 13, 173);
      pdf.text(`Plano: ${quote.planName}`, 15, 75);
      
      // Client information
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('INFORMAÇÕES DO CLIENTE', 15, 95);
      
      let yPos = 105;
      pdf.text(`Nome: ${quote.clientName}`, 15, yPos);
      if (quote.clientCompany) {
        yPos += 8;
        pdf.text(`Empresa: ${quote.clientCompany}`, 15, yPos);
      }
      if (quote.clientEmail) {
        yPos += 8;
        pdf.text(`Email: ${quote.clientEmail}`, 15, yPos);
      }
      if (quote.clientPhone) {
        yPos += 8;
        pdf.text(`Telefone: ${quote.clientPhone}`, 15, yPos);
      }
      
      // Services
      yPos += 20;
      pdf.setFontSize(14);
      pdf.setTextColor(106, 13, 173);
      pdf.text('SERVIÇOS INCLUSOS', 15, yPos);
      
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      quote.services.forEach((service: ServiceItem, index: number) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${service.title}`, 15, yPos);
        yPos += 6;
        
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(service.description, 170);
        pdf.text(lines, 20, yPos);
        yPos += lines.length * 4 + 5;
      });
      
      // Gifts (if any)
      if (quote.gifts && quote.gifts.length > 0) {
        yPos += 10;
        pdf.setFontSize(14);
        pdf.setTextColor(106, 13, 173);
        pdf.text('BRINDES INCLUSOS', 15, yPos);
        
        yPos += 10;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        quote.gifts.forEach((gift: GiftItem, index: number) => {
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${gift.title}`, 15, yPos);
          yPos += 6;
          
          pdf.setFont('helvetica', 'normal');
          const lines = pdf.splitTextToSize(gift.description, 170);
          pdf.text(lines, 20, yPos);
          yPos += lines.length * 4 + 5;
        });
      }
      
      // Value
      yPos += 15;
      pdf.setFontSize(16);
      pdf.setTextColor(106, 13, 173);
      const value = quote.type === 'monthly' ? quote.monthlyValue : quote.uniqueValue;
      const valueText = quote.type === 'monthly' 
        ? `Valor Mensal: R$ ${value?.toFixed(2).replace('.', ',')}`
        : `Valor Único: R$ ${value?.toFixed(2).replace('.', ',')}`;
      pdf.text(valueText, 15, yPos);
      
      // Validity
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Válido até: ${new Date(quote.validUntil + 'T00:00:00').toLocaleDateString('pt-BR')}`, 15, yPos);
      
      // Notes
      if (quote.notes) {
        yPos += 15;
        pdf.setFontSize(12);
        pdf.setTextColor(106, 13, 173);
        pdf.text('OBSERVAÇÕES', 15, yPos);
        
        yPos += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        const notesLines = pdf.splitTextToSize(quote.notes, 170);
        pdf.text(notesLines, 15, yPos);
      }
      
      // Footer
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('TARGET Marketing Digital | contato@targetagency.com.br | (11) 99237-3084', 15, pageHeight - 15);
      pdf.text(`Orçamento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 15, pageHeight - 10);

      const fileName = `orcamento-${quote.planName.toLowerCase().replace(/\s+/g, '-')}-${quote.clientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    };
    
    // Load the TARGET logo
    logoImg.src = 'https://i.ibb.co/M5hK0xjS/logo-target-1.png';
  };

  const handleEditQuote = (quote: any) => {
    // Convert ISO date (YYYY-MM-DD) back to Brazilian format (DD/MM/YYYY) for editing
    const convertToBrazilianDate = (isoDate: string): string => {
      if (isoDate && isoDate.includes('-')) {
        const parts = isoDate.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          return `${day}/${month}/${year}`;
        }
      }
      return isoDate; // Return as-is if not in ISO format
    };
    
    setQuoteType(quote.type);
    setQuoteFormData({
      planName: quote.planName,
      planType: quote.planType || 'plano', // Default to 'plano' for existing quotes
      clientName: quote.clientName,
      clientEmail: quote.clientEmail || '',
      clientPhone: quote.clientPhone || '',
      clientCompany: quote.clientCompany || '',
      clientId: quote.clientId || '',
      services: quote.services || [],
      gifts: quote.gifts || [],
      monthlyValue: quote.monthlyValue || 0,
      uniqueValue: quote.uniqueValue || 0,
      validUntil: convertToBrazilianDate(quote.validUntil),
      notes: quote.notes || ''
    });
    setEditingQuote(quote);
    setShowQuoteForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
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
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl p-8 text-white shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sistema de Orçamentos</h1>
            <p className="text-purple-100">Crie orçamentos mensais e únicos para futuros clientes</p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
            <Calculator className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Orçamentos</p>
              <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Orçamentos Mensais</p>
              <p className="text-2xl font-bold text-blue-600">
                {quotes.filter(q => q.type === 'monthly').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Orçamentos Únicos</p>
              <p className="text-2xl font-bold text-green-600">
                {quotes.filter(q => q.type === 'unique').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Aprovados</p>
              <p className="text-2xl font-bold text-emerald-600">
                {quotes.filter(q => q.status === 'approved').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => {
            setQuoteType('monthly');
            setShowQuoteForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Calendar className="w-5 h-5" />
          Orçamento Mensal
        </button>
        
        <button
          onClick={() => {
            setQuoteType('unique');
            setShowQuoteForm(true);
          }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Briefcase className="w-5 h-5" />
          Orçamento Único
        </button>
      </div>

      {/* Quotes List */}
      <div className="bg-white rounded-xl shadow-elegant overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Orçamentos Criados ({quotes.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Plano</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Valor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Validade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotes.map(quote => (
                <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{quote.clientName}</div>
                      {quote.clientCompany && (
                        <div className="text-sm text-gray-500">{quote.clientCompany}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{quote.planName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      quote.type === 'monthly' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {quote.type === 'monthly' ? 'Mensal' : 'Único'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      R$ {quote.type === 'monthly' 
                        ? quote.monthlyValue?.toFixed(2) 
                        : quote.uniqueValue?.toFixed(2)}
                      {quote.type === 'monthly' && '/mês'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                      {getStatusText(quote.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(quote.validUntil + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generatePDF(quote)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Baixar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditQuote(quote)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este orçamento?')) {
                            deleteQuote(quote.id);
                          }
                        }}
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
          
          {quotes.length === 0 && (
            <div className="text-center py-12">
              <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento criado</h3>
              <p className="text-gray-500">Comece criando seu primeiro orçamento mensal ou único.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quote Form Modal */}
      {showQuoteForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 gradient-text">
              {editingQuote ? 'Editar' : 'Novo'} Orçamento {quoteType === 'monthly' ? 'Mensal' : 'Único'}
            </h3>
            
            <form onSubmit={handleQuoteSubmit} className="space-y-6">
              {/* Plan Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    required
                    value={quoteFormData.planType}
                    onChange={(e) => setQuoteFormData(prev => ({ ...prev, planType: e.target.value as 'plano' | 'servico' }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="plano">Plano</option>
                    <option value="servico">Nome do Serviço</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {quoteFormData.planType === 'plano' ? 'Nome do Plano' : 'Nome do Serviço'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteFormData.planName}
                    onChange={(e) => setQuoteFormData(prev => ({ ...prev, planName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={quoteFormData.planType === 'plano' ? 'Ex: Plano Premium Marketing' : 'Ex: Criação de Logotipo'}
                  />
                </div>
              </div>

              {/* Client Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente Existente (Opcional)
                  </label>
                  <select
                    value={quoteFormData.clientId}
                    onChange={(e) => handleClientSelection(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Selecionar cliente existente...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company && `- ${client.company}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteFormData.clientName}
                    onChange={(e) => setQuoteFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={quoteFormData.clientCompany}
                    onChange={(e) => setQuoteFormData(prev => ({ ...prev, clientCompany: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={quoteFormData.clientEmail}
                    onChange={(e) => setQuoteFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={quoteFormData.clientPhone}
                    onChange={(e) => setQuoteFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Services */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Serviços do Pacote</h4>
                  <button
                    type="button"
                    onClick={addService}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Serviço
                  </button>
                </div>
                
                <div className="space-y-4">
                  {quoteFormData.services.map((service, index) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            placeholder="Título do serviço"
                            value={service.title}
                            onChange={(e) => updateService(service.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <textarea
                            rows={3}
                            placeholder="Descrição detalhada do serviço"
                            value={service.description}
                            onChange={(e) => updateService(service.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeService(service.id)}
                          className="text-red-600 hover:text-red-800 px-3 py-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {quoteFormData.services.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhum serviço adicionado</p>
                  </div>
                )}
              </div>

              {/* Gifts */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Brindes (Opcional)</h4>
                  <button
                    type="button"
                    onClick={addGift}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-rose-700 flex items-center gap-2 text-sm"
                  >
                    <Gift className="w-4 h-4" />
                    Adicionar Brinde
                  </button>
                </div>
                
                <div className="space-y-4">
                  {quoteFormData.gifts.map((gift, index) => (
                    <div key={gift.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            placeholder="Título do brinde"
                            value={gift.title}
                            onChange={(e) => updateGift(gift.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <textarea
                            rows={2}
                            placeholder="Descrição do brinde"
                            value={gift.description}
                            onChange={(e) => updateGift(gift.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeGift(gift.id)}
                          className="text-red-600 hover:text-red-800 px-3 py-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {quoteType === 'monthly' ? 'Valor Mensal (R$) *' : 'Valor Único (R$) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quoteType === 'monthly' ? quoteFormData.monthlyValue : quoteFormData.uniqueValue}
                    onChange={(e) => setQuoteFormData(prev => ({
                      ...prev,
                      [quoteType === 'monthly' ? 'monthlyValue' : 'uniqueValue']: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Válido até *
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteFormData.validUntil}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2);
                      }
                      if (value.length >= 5) {
                        value = value.substring(0, 5) + '/' + value.substring(5, 9);
                      }
                      setQuoteFormData(prev => ({ ...prev, validUntil: value }));
                    }}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  rows={3}
                  value={quoteFormData.notes}
                  onChange={(e) => setQuoteFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Informações adicionais para o cliente..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetQuoteForm}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  {editingQuote ? 'Atualizar' : 'Criar'} Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesManager;