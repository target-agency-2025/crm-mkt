import React, { useState } from 'react';
import { useCRM, UniqueJob } from '../context/CRMContext';
import { Plus, Edit, Trash2, Briefcase, Calendar, User } from 'lucide-react';

const UniqueJobsManager: React.FC = () => {
  const { uniqueJobs, addUniqueJob, updateUniqueJob, deleteUniqueJob, clients } = useCRM();
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<UniqueJob | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    uniqueValue: 0,
    paymentDate: '',
    clientId: '',
    status: 'active' as UniqueJob['status']
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      uniqueValue: 0,
      paymentDate: '',
      clientId: '',
      status: 'active'
    });
    setEditingJob(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingJob) {
      const updatedJob: UniqueJob = {
        ...editingJob,
        ...formData
      };
      updateUniqueJob(updatedJob);
    } else {
      const newJob: Omit<UniqueJob, 'id' | 'createdAt'> = {
        ...formData
      };
      addUniqueJob(newJob);
    }
    
    resetForm();
  };

  const handleEdit = (job: UniqueJob) => {
    setEditingJob(job);
    setFormData({
      name: job.name,
      phone: job.phone,
      uniqueValue: job.uniqueValue,
      paymentDate: job.paymentDate,
      clientId: job.clientId || '',
      status: job.status
    });
    setShowForm(true);
  };

  const handleDelete = (jobId: string) => {
    if (confirm('Tem certeza que deseja excluir este trabalho?')) {
      deleteUniqueJob(jobId);
    }
  };

  const getStatusColor = (status: UniqueJob['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: UniqueJob['status']) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  const totalRevenue = uniqueJobs
    .filter(job => job.status === 'active')
    .reduce((sum, job) => sum + job.uniqueValue, 0);

  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    return clients.find(client => client.id === clientId)?.name || 'Cliente não encontrado';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#303030]">Trabalhos Únicos</h1>
          <p className="text-gray-600">Gestão de projetos e trabalhos especiais</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#6A0DAD] text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Novo Trabalho</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-white rounded-xl shadow-xl p-6 card-hover border border-gray-100 bg-gradient-to-br from-white to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#303030] text-sm font-medium">Total de Trabalhos</p>
              <p className="text-2xl font-bold text-[#6A0DAD]">{uniqueJobs.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-[#6A0DAD] to-[#8E24AA] rounded-full shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 card-hover border border-gray-100 bg-gradient-to-br from-white to-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#303030] text-sm font-medium">Trabalhos Ativos</p>
              <p className="text-2xl font-bold text-green-600">
                {uniqueJobs.filter(job => job.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 card-hover border border-gray-100 bg-gradient-to-br from-white to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#303030] text-sm font-medium">Trabalhos Concluídos</p>
              <p className="text-2xl font-bold text-blue-600">
                {uniqueJobs.filter(job => job.status === 'completed').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 card-hover border border-gray-100 bg-gradient-to-br from-white to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#303030] text-sm font-medium">Receita Total</p>
              <p className="text-2xl font-bold text-[#6A0DAD]">
                R$ {totalRevenue.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-[#6A0DAD] to-[#8E24AA] rounded-full shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-[#303030] mb-4">
              {editingJob ? 'Editar Trabalho' : 'Novo Trabalho Único'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#303030] mb-1">
                  Cliente Existente (Opcional)
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => {
                    const selectedClient = clients.find(c => c.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      clientId: e.target.value,
                      // Auto-fill phone if client is selected
                      phone: selectedClient ? selectedClient.phone : formData.phone
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD]"
                >
                  <option value="">Selecionar cliente existente (opcional)</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.company || 'Sem empresa'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303030] mb-1">
                  Nome do Trabalho/Cliente
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD]"
                  placeholder="Ex: Campanha Black Friday - Loja ABC"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303030] mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD]"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303030] mb-1">
                  Valor Único (R$)
                </label>
                <input
                  type="number"
                  value={formData.uniqueValue}
                  onChange={(e) => setFormData({ ...formData, uniqueValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD]"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303030] mb-1">
                  Data de Pagamento
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303030] mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as UniqueJob['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD]"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="completed">Concluído</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#6A0DAD] text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingJob ? 'Salvar' : 'Criar Trabalho'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#303030]">Lista de Trabalhos</h2>
          <p className="text-gray-600">Total: {uniqueJobs.length} trabalhos</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9F6FB]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#303030] uppercase tracking-wider">
                  Trabalho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#303030] uppercase tracking-wider">
                  Cliente Vinculado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#303030] uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#303030] uppercase tracking-wider">
                  Valor Único
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#303030] uppercase tracking-wider">
                  Data de Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#303030] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#303030] uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uniqueJobs.map((job) => {
                const clientName = getClientName(job.clientId);
                return (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center bg-[#6A0DAD]">
                          <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#303030]">
                            {job.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Criado em {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {clientName ? (
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-green-600 mr-1" />
                          {clientName}
                        </div>
                      ) : (
                        <span className="text-gray-400">Nenhum cliente vinculado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {job.uniqueValue.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(job.paymentDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {getStatusText(job.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(job)}
                          className="text-[#6A0DAD] hover:text-purple-700"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {uniqueJobs.length === 0 && (
            <div className="text-center py-8">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum trabalho cadastrado</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-[#6A0DAD] hover:text-purple-700"
              >
                Adicionar primeiro trabalho
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-[#303030] mb-4">Resumo Financeiro</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#F9F6FB] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[#303030] mb-2">Receita Total Ativa</h3>
            <p className="text-2xl font-bold text-[#6A0DAD]">
              R$ {totalRevenue.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="bg-[#F9F6FB] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[#303030] mb-2">Trabalhos por Status</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Ativos:</span>
                <span className="font-semibold text-green-600">
                  {uniqueJobs.filter(j => j.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Concluídos:</span>
                <span className="font-semibold text-blue-600">
                  {uniqueJobs.filter(j => j.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Inativos:</span>
                <span className="font-semibold text-red-600">
                  {uniqueJobs.filter(j => j.status === 'inactive').length}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-[#F9F6FB] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[#303030] mb-2">Faturamento Automático</h3>
            <p className="text-sm text-gray-600">
              {uniqueJobs.filter(j => j.status === 'active').length} trabalhos ativos
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Faturas geradas automaticamente
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Sobre Trabalhos Únicos</h3>
        <p className="text-sm text-blue-700">
          Esta seção é destinada para projetos especiais, campanhas pontuais ou trabalhos que não se enquadram 
          no modelo de cliente recorrente. Cada trabalho tem um valor único e gera uma fatura automaticamente na data especificada.
          Você pode opcionalmente vincular a um cliente existente para melhor organização.
        </p>
      </div>
    </div>
  );
};

export default UniqueJobsManager;