import React, { useState } from 'react';
import { useCRM, Credential, Client } from '../context/CRMContext';
import { Shield, Plus, Edit2, Trash2, Eye, EyeOff, Facebook, Instagram, Twitter, Linkedin, Youtube, Globe, Key, Database, Lock, Download, FileText, Table, Music } from 'lucide-react';
import jsPDF from 'jspdf';

const socialPlatforms = [
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'tiktok', label: 'TikTok', icon: Music },
  { value: 'website', label: 'Website', icon: Globe }
];

const credentialCategories = [
  { value: 'general', label: 'Geral', icon: Key },
  { value: 'social', label: 'Rede Social', icon: Instagram },
  { value: 'api', label: 'API', icon: Database },
  { value: 'password', label: 'Senha', icon: Lock }
];

export default function CredentialsVault() {
  const { credentials, addCredential, updateCredential, deleteCredential, clients } = useCRM();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: 'general',
    clientId: '',
    socialPlatform: ''
  });

  const filteredCredentials = credentials.filter(cred => {
    const clientMatch = selectedClient === 'all' || cred.clientId === selectedClient;
    const categoryMatch = selectedCategory === 'all' || cred.category === selectedCategory;
    return clientMatch && categoryMatch;
  });

  const getClientById = (id: string) => clients.find(client => client.id === id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const credentialData = {
      title: formData.title,
      username: formData.username,
      password: formData.password,
      url: formData.url,
      notes: formData.notes,
      category: formData.category as 'general' | 'social' | 'api' | 'password',
      clientId: formData.clientId,
      socialPlatform: formData.socialPlatform
    };

    if (editingCredential) {
      updateCredential({
        ...credentialData,
        id: editingCredential.id,
        createdAt: editingCredential.createdAt
      });
    } else {
      addCredential(credentialData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      username: '',
      password: '',
      url: '',
      notes: '',
      category: 'general',
      clientId: '',
      socialPlatform: ''
    });
    setEditingCredential(null);
    setIsFormOpen(false);
  };

  const handleEdit = (credential: Credential) => {
    setFormData({
      title: credential.title,
      username: credential.username,
      password: credential.password,
      url: credential.url || '',
      notes: credential.notes || '',
      category: credential.category,
      clientId: credential.clientId || '',
      socialPlatform: credential.socialPlatform || ''
    });
    setEditingCredential(credential);
    setIsFormOpen(true);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = credentialCategories.find(cat => cat.value === category);
    return categoryData ? categoryData.icon : Key;
  };

  const getSocialIcon = (platform: string) => {
    const platformData = socialPlatforms.find(p => p.value === platform);
    return platformData ? platformData.icon : Globe;
  };

  const getCredentialsByClient = () => {
    const grouped: Record<string, { client: Client; credentials: Credential[] }> = {};
    clients.forEach(client => {
      const clientCredentials = credentials.filter(cred => cred.clientId === client.id);
      if (clientCredentials.length > 0) {
        grouped[client.id] = {
          client,
          credentials: clientCredentials
        };
      }
    });
    return grouped;
  };

  const exportCredentials = async () => {
    const clientCredentials = selectedClient === 'all' 
      ? filteredCredentials 
      : filteredCredentials.filter(cred => cred.clientId === selectedClient);

    if (clientCredentials.length === 0) {
      alert('Nenhuma credencial encontrada para exportar.');
      return;
    }

    const client = selectedClient !== 'all' ? getClientById(selectedClient) : null;
    const clientName = client ? client.name : 'Todas as Credenciais';

    if (exportFormat === 'pdf') {
      await exportToPDF(clientCredentials, clientName);
    } else if (exportFormat === 'csv') {
      exportToCSV(clientCredentials, clientName);
    } else if (exportFormat === 'json') {
      exportToJSON(clientCredentials, clientName);
    }

    setShowExportModal(false);
  };

  const exportToPDF = async (credentials: Credential[], clientName: string) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header com logo
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

    // Título
    pdf.setFontSize(20);
    pdf.setTextColor(106, 13, 173);
    pdf.text('TARGET CRM - Credenciais', 35, 20);
    
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Cliente: ${clientName}`, 15, 35);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 42);
    
    yPosition = 55;

    // Credenciais
    credentials.forEach((credential, index) => {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      const client = credential.clientId ? getClientById(credential.clientId) : null;
      const categoryData = credentialCategories.find(cat => cat.value === credential.category);
      
      // Box da credencial
      pdf.setFillColor(248, 250, 252);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 45, 'F');
      
      pdf.setDrawColor(106, 13, 173);
      pdf.setLineWidth(0.5);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 45);

      // Título da credencial
      pdf.setFontSize(12);
      pdf.setTextColor(106, 13, 173);
      pdf.text(`${index + 1}. ${credential.title}`, 20, yPosition + 5);
      
      // Categoria
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Categoria: ${categoryData?.label || 'N/A'}`, 20, yPosition + 12);
      
      if (client) {
        pdf.text(`Cliente: ${client.name}`, 20, yPosition + 18);
      }

      // Dados da credencial
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Usuário: ${credential.username}`, 20, yPosition + 25);
      pdf.text(`Senha: ${credential.password}`, 20, yPosition + 32);
      
      if (credential.url) {
        pdf.setTextColor(0, 0, 255);
        pdf.text(`URL: ${credential.url}`, 20, yPosition + 39);
      }

      yPosition += 55;
    });

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('© 2024 TARGET CRM. Documento confidencial.', 15, pageHeight - 10);

    pdf.save(`credenciais-${clientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = (credentials: Credential[], clientName: string) => {
    const headers = ['Título', 'Categoria', 'Cliente', 'Usuário', 'Senha', 'URL', 'Notas', 'Data de Criação'];
    const csvContent = [
      headers.join(','),
      ...credentials.map(cred => {
        const client = cred.clientId ? getClientById(cred.clientId) : null;
        const categoryData = credentialCategories.find(cat => cat.value === cred.category);
        return [
          `"${cred.title}"`,
          `"${categoryData?.label || 'N/A'}"`,
          `"${client?.name || 'N/A'}"`,
          `"${cred.username}"`,
          `"${cred.password}"`,
          `"${cred.url || ''}"`,
          `"${cred.notes || ''}"`,
          `"${new Date(cred.createdAt).toLocaleDateString('pt-BR')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `credenciais-${clientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = (credentials: Credential[], clientName: string) => {
    const exportData = {
      cliente: clientName,
      dataExportacao: new Date().toISOString(),
      totalCredenciais: credentials.length,
      credenciais: credentials.map(cred => {
        const client = cred.clientId ? getClientById(cred.clientId) : null;
        const categoryData = credentialCategories.find(cat => cat.value === cred.category);
        return {
          titulo: cred.title,
          categoria: categoryData?.label || 'N/A',
          cliente: client?.name || 'N/A',
          usuario: cred.username,
          senha: cred.password,
          url: cred.url || '',
          notas: cred.notes || '',
          dataCriacao: new Date(cred.createdAt).toLocaleDateString('pt-BR')
        };
      })
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `credenciais-${clientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-8 text-white shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cofre de Credenciais</h1>
            <p className="text-indigo-100">Gerencie credenciais de forma segura por cliente</p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
            <Shield className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-elegant">
            <h3 className="font-semibold text-gray-800 mb-4">Filtros</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todos os Clientes</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todas as Categorias</option>
                  {credentialCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Botão de Exportar */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowExportModal(true)}
                  disabled={filteredCredentials.length === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Download className="w-5 h-5" />
                  Exportar Credenciais
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {filteredCredentials.length} credencial(is) para exportar
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-elegant">
            <h3 className="font-semibold text-gray-800 mb-4">Resumo por Cliente</h3>
            <div className="space-y-3">
              {Object.entries(getCredentialsByClient()).map(([clientId, data]) => (
                <div key={clientId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {data.client.profilePhoto ? (
                    <img
                      src={data.client.profilePhoto}
                      alt={data.client.name}
                      className="w-8 h-8 rounded-full object-cover border-2"
                      style={{ borderColor: data.client.color }}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                      style={{ backgroundColor: data.client.color }}
                    >
                      {data.client.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{data.client.name}</div>
                    <div className="text-xs text-gray-500">{data.credentials.length} credenciais</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:w-3/4 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">
              Credenciais ({filteredCredentials.length})
            </h2>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Nova Credencial
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCredentials.map((credential) => {
              const client = credential.clientId ? getClientById(credential.clientId) : null;
              const CategoryIcon = getCategoryIcon(credential.category);
              const SocialIcon = credential.category === 'social' && credential.socialPlatform ? getSocialIcon(credential.socialPlatform) : null;

              return (
                <div key={credential.id} className="bg-white rounded-xl p-6 shadow-elegant hover:shadow-xl transition-all duration-300 card-hover">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg">
                        {SocialIcon ? <SocialIcon className="w-5 h-5 text-purple-600" /> : <CategoryIcon className="w-5 h-5 text-purple-600" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{credential.title}</h3>
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          {credentialCategories.find(cat => cat.value === credential.category)?.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(credential)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCredential(credential.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {client && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                      {client.profilePhoto ? (
                        <img
                          src={client.profilePhoto}
                          alt={client.name}
                          className="w-6 h-6 rounded-full object-cover border"
                          style={{ borderColor: client.color }}
                        />
                      ) : (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                          style={{ backgroundColor: client.color }}
                        >
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700">{client.name}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Usuário</label>
                      <div className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                        {credential.username}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Senha</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                          {showPasswords[credential.id] ? credential.password : '••••••••'}
                        </div>
                        <button
                          onClick={() => togglePasswordVisibility(credential.id)}
                          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPasswords[credential.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {credential.url && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">URL</label>
                        <div className="text-sm text-blue-600 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                          <a href={credential.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {credential.url}
                          </a>
                        </div>
                      </div>
                    )}
                    {credential.notes && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notas</label>
                        <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                          {credential.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de Exportação */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 gradient-text">
              Exportar Credenciais
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Formato de Exportação
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'csv' | 'json')}
                      className="mr-3"
                    />
                    <FileText className="w-5 h-5 text-red-500 mr-3" />
                    <div>
                      <div className="font-medium">PDF Profissional</div>
                      <div className="text-sm text-gray-500">Documento formatado com logo e design</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'csv' | 'json')}
                      className="mr-3"
                    />
                    <Table className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <div className="font-medium">Planilha CSV</div>
                      <div className="text-sm text-gray-500">Para Excel, Google Sheets, etc.</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'csv' | 'json')}
                      className="mr-3"
                    />
                    <Database className="w-5 h-5 text-blue-500 mr-3" />
                    <div>
                      <div className="font-medium">Arquivo JSON</div>
                      <div className="text-sm text-gray-500">Dados estruturados para backup</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-900 mb-2">Informações da Exportação</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Cliente:</strong> {selectedClient === 'all' ? 'Todos os clientes' : clients.find(c => c.id === selectedClient)?.name}</p>
                  <p><strong>Categoria:</strong> {selectedCategory === 'all' ? 'Todas as categorias' : credentialCategories.find(c => c.value === selectedCategory)?.label}</p>
                  <p><strong>Total de credenciais:</strong> {filteredCredentials.length}</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium mb-1">⚠️ Documento Confidencial</p>
                    <p>Este arquivo contém informações sensíveis. Mantenha-o seguro e compartilhe apenas com pessoas autorizadas.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t mt-6">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={exportCredentials}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 gradient-text">
              {editingCredential ? 'Editar Credencial' : 'Nova Credencial'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {credentialCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.category === 'social' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plataforma Social *
                  </label>
                  <select
                    required
                    value={formData.socialPlatform}
                    onChange={(e) => setFormData({ ...formData, socialPlatform: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma plataforma</option>
                    {socialPlatforms.map(platform => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Acesso Admin, Facebook Business, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuário/Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL/Website
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Informações adicionais..."
                />
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
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  {editingCredential ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}