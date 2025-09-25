import React, { useState } from 'react';
import { useCRM, Task } from '../context/CRMContext';
import { Plus, Trash2, User, Clock, Circle } from 'lucide-react';

const TaskBoard: React.FC = () => {
  const { tasks, clients, addTask, updateTask, deleteTask } = useCRM();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'backlog' as Task['status'],
    clientId: ''
  });

  const columns = [
    { id: 'backlog' as const, title: 'Backlog', color: 'bg-gradient-to-r from-gray-500 to-gray-600' },
    { id: 'doing' as const, title: 'Fazendo', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { id: 'waiting' as const, title: 'Aguardando Cliente', color: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
    { id: 'done' as const, title: 'Concluída', color: 'bg-gradient-to-r from-green-500 to-green-600' }
  ];

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'backlog',
      clientId: ''
    });
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      status: formData.status,
      clientId: formData.clientId || undefined,
      createdAt: new Date()
    };
    
    addTask(newTask);
    resetForm();
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      updateTask({ ...task, status });
    }
  };

  const handleStatusChange = (taskId: string, status: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask({ ...task, status });
    }
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTask(taskId);
    }
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client?.name;
  };

  const getClientColor = (clientId?: string) => {
    if (!clientId) return '#6A0DAD';
    const client = clients.find(c => c.id === clientId);
    return client?.color || '#6A0DAD';
  };

  const getClientPhoto = (clientId?: string) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client?.profilePhoto;
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, task.id)}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-3 cursor-move hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-[#303030] text-sm">{task.title}</h4>
        <button
          onClick={() => handleDelete(task.id)}
          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      {task.description && (
        <p className="text-gray-600 text-xs mb-3">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Clock size={12} />
          <span>{new Date(task.createdAt).toLocaleDateString('pt-BR')}</span>
        </div>
        
        {task.clientId && (
          <div className="flex items-center space-x-1">
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden shadow-md"
              style={{ 
                background: `linear-gradient(135deg, ${getClientColor(task.clientId)}, ${getClientColor(task.clientId)}dd)`,
                boxShadow: `0 2px 8px ${getClientColor(task.clientId)}40`
              }}
            >
              {getClientPhoto(task.clientId) ? (
                <img 
                  src={getClientPhoto(task.clientId)!} 
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-2 h-2 text-white" />
              )}
            </div>
            <span style={{ color: getClientColor(task.clientId) }}>
              {getClientName(task.clientId)}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:border-2"
          style={{ 
            focusRingColor: getClientColor(task.clientId),
            focusBorderColor: getClientColor(task.clientId)
          }}
        >
          <option value="backlog">Backlog</option>
          <option value="doing">Fazendo</option>
          <option value="waiting">Aguardando Cliente</option>
          <option value="done">Concluída</option>
        </select>
      </div>
      
      {task.clientId && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <Circle 
              size={8} 
              fill={getClientColor(task.clientId)}
              color={getClientColor(task.clientId)}
            />
            <span className="text-xs text-gray-500">
              Cliente: {getClientName(task.clientId)}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#303030]">Quadro de Tarefas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#6A0DAD] text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nova Tarefa</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-[#303030] mb-4">Nova Tarefa</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#303030] mb-1">
                  Título da Tarefa
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD]"
                  placeholder="Ex: Criar campanha Google Ads"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303030] mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD]"
                  placeholder="Detalhes da tarefa..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303030] mb-1">
                  Cliente (Opcional)
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD]"
                >
                  <option value="">Selecionar cliente...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303030] mb-1">
                  Status Inicial
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD]"
                >
                  <option value="backlog">Backlog</option>
                  <option value="doing">Fazendo</option>
                  <option value="waiting">Aguardando Cliente</option>
                  <option value="done">Concluída</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#6A0DAD] text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Criar Tarefa
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

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {columns.map(column => (
          <div
            key={column.id}
            className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 min-h-[500px] shadow-lg border border-gray-200"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={`${column.color} text-white px-4 py-3 rounded-xl mb-4 flex items-center justify-between shadow-lg`}>
              <h3 className="font-semibold">{column.title}</h3>
              <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                {tasks.filter(task => task.status === column.id).length}
              </span>
            </div>
            
            <div className="space-y-3 group">
              {tasks
                .filter(task => task.status === column.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              
              {tasks.filter(task => task.status === column.id).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">Arraste tarefas para cá</p>
                  <p className="text-xs opacity-70">ou altere o status</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-[#6A0DAD] to-[#8E24AA] bg-clip-text text-transparent mb-6">
          Resumo das Tarefas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {columns.map(column => (
            <div key={column.id} className="text-center">
              <div className={`${column.color} text-white p-4 rounded-xl mb-2 shadow-lg`}>
                <span className="text-2xl font-bold">
                  {tasks.filter(task => task.status === column.id).length}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">{column.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Como usar o quadro Kanban</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Arraste as tarefas entre as colunas para mudar o status</li>
          <li>• Use o dropdown dentro do card para mudanças rápidas</li>
          <li>• Associe tarefas a clientes específicos para melhor organização</li>
          <li>• Tarefas são organizadas por data de criação (mais recentes primeiro)</li>
        </ul>
      </div>
    </div>
  );
};

export default TaskBoard;