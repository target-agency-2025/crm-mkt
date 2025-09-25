import React, { useState } from 'react';
import { useCRM, Client } from '../context/CRMContext';
import { Users, Plus, Edit2, Trash2, Upload, UserX, User } from 'lucide-react';

const colorOptions = [
  '#6A0DAD', '#8E24AA', '#9C27B0', '#E91E63', '#F44336',
  '#FF5722', '#FF9800', '#FFC107', '#FFEB3B', '#CDDC39',
  '#8BC34A', '#4CAF50', '#009688', '#00BCD4', '#03A9F4',
  '#2196F3', '#3F51B5', '#673AB7'
];

export default function ClientsManager() {
  const { clients, addClient, updateClient, deleteClient } = useCRM();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    monthlyValue: '',
    paymentDay: '',
    optionalPaymentDate1: '',
    optionalPaymentDate2: '',
    profilePhoto: '',
    color: '#6A0DAD',
    status: 'active' as 'active' | 'inactive' | 'paused'
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        setFormData({ ...formData, profilePhoto: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clientData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      profilePhoto: formData.profilePhoto,
      color: formData.color,
      monthlyValue: parseFloat(formData.monthlyValue) || 0,
      paymentDay: parseInt(formData.paymentDay) || 1,
      optionalPaymentDate1: formData.optionalPaymentDate1,
      optionalPaymentDate2: formData.optionalPaymentDate2,
      status: formData.status
    };

    if (editingClient) {
      updateClient({
        ...clientData,
        id: editingClient.id,
        createdAt: editingClient.createdAt
      });
    } else {
      addClient(clientData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      monthlyValue: '',
      paymentDay: '',
      optionalPaymentDate1: '',
      optionalPaymentDate2: '',
      profilePhoto: '',
      color: '#6A0DAD',
      status: 'active'
    });
    setProfilePhotoFile(null);
    setEditingClient(null);
    setIsFormOpen(false);
  };

  const handleEdit = (client: Client) => {
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company || '',
      monthlyValue: client.monthlyValue?.toString() || '',
      paymentDay: client.paymentDay?.toString() || '',
      optionalPaymentDate1: client.optionalPaymentDate1 || '',
      optionalPaymentDate2: client.optionalPaymentDate2 || '',
      profilePhoto: client.profilePhoto || '',
      color: client.color || '#6A0DAD',
      status: client.status || 'active'
    });
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleDeactivateClient = (client: Client) => {
    if (confirm(`Tem certeza que deseja inativar o cliente ${client.name}? Isso impedirá a geração de novas faturas, mas preservará os dados históricos.`)) {
      updateClient({
        ...client,
        status: 'inactive'
      });
    }
  };

  const handleActivateClient = (client: Client) => {
    if (confirm(`Tem certeza que deseja ativar o cliente ${client.name}?`)) {
      updateClient({
        ...client,
        status: 'active'
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 rounded-xl p-8 text-white shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestão de Clientes</h1>
            <p className="text-purple-100">Gerencie seus clientes e informações de pagamento</p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
            <Users className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          Clientes ({clients.length})
        </h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 gradient-text">
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Mensal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthlyValue}
                    onChange={(e) => setFormData({ ...formData, monthlyValue: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dia do Pagamento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.paymentDay}
                    onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Pagamento Opcional 1
                  </label>
                  <input
                    type="date"
                    value={formData.optionalPaymentDate1}
                    onChange={(e) => setFormData({ ...formData, optionalPaymentDate1: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Pagamento Opcional 2
                  </label>
                  <input
                    type="date"
                    value={formData.optionalPaymentDate2}
                    onChange={(e) => setFormData({ ...formData, optionalPaymentDate2: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'paused' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="paused">Pausado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto de Perfil
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Escolher Foto
                    </label>
                    {formData.profilePhoto && (
                      <img
                        src={formData.profilePhoto}
                        alt="Preview"
                        className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor de Identificação
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.slice(0, 8).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            formData.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>
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
                  {editingClient ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contato</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Empresa</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Valor Mensal</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Pagamento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Datas Opcionais</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {client.profilePhoto ? (
                        <img
                          src={client.profilePhoto}
                          alt={client.name}
                          className="w-10 h-10 rounded-full object-cover border-2"
                          style={{ borderColor: client.color }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: client.color }}
                        >
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{client.name}</div>
                        <div
                          className="w-3 h-3 rounded-full mt-1"
                          style={{ backgroundColor: client.color }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{client.email}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {client.company || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">
                    R$ {client.monthlyValue?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    Dia {client.paymentDay || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' :
                      client.status === 'inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {client.status === 'active' ? 'Ativo' :
                       client.status === 'inactive' ? 'Inativo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="space-y-1">
                      {client.optionalPaymentDate1 && (
                        <div>{new Date(client.optionalPaymentDate1).toLocaleDateString('pt-BR')}</div>
                      )}
                      {client.optionalPaymentDate2 && (
                        <div>{new Date(client.optionalPaymentDate2).toLocaleDateString('pt-BR')}</div>
                      )}
                      {!client.optionalPaymentDate1 && !client.optionalPaymentDate2 && '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {client.status === 'active' ? (
                        <button
                          onClick={() => handleDeactivateClient(client)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Inativar Cliente"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateClient(client)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Ativar Cliente"
                        >
                          <User className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteClient(client.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
