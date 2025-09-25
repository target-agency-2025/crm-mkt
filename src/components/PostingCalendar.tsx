import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { Calendar, Plus, Edit2, Trash2, Download, Copy, Eye, FileText, Image, Video, Megaphone, Package, Users, Clock, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PostingCalendar {
  id: string;
  clientId: string;
  name: string;
  period: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  posts: CalendarPost[];
  createdAt: string;
}

interface CalendarPost {
  id: string;
  date: string;
  title: string;
  type: 'presentation' | 'product' | 'campaign' | 'story' | 'video' | 'engagement';
  description: string;
  briefing: string;
  attachments: string[];
  status: 'planned' | 'approved' | 'published';
  color: string;
}

const postTypes = [
  { value: 'presentation', label: 'Apresentação', icon: Users, color: '#3B82F6' },
  { value: 'product', label: 'Produto', icon: Package, color: '#10B981' },
  { value: 'campaign', label: 'Campanha', icon: Megaphone, color: '#F59E0B' },
  { value: 'story', label: 'Story', icon: Image, color: '#8B5CF6' },
  { value: 'video', label: 'Vídeo', icon: Video, color: '#EF4444' },
  { value: 'engagement', label: 'Engajamento', icon: Users, color: '#06B6D4' }
];

const statusOptions = [
  { value: 'planned', label: 'Planejado', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'approved', label: 'Aprovado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'published', label: 'Publicado', color: 'bg-blue-100 text-blue-800', icon: Eye }
];

const PostingCalendarManager: React.FC = () => {
  const { clients } = useCRM();
  const [calendars, setCalendars] = useState<PostingCalendar[]>([]);
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<PostingCalendar | null>(null);
  const [editingCalendar, setEditingCalendar] = useState<PostingCalendar | null>(null);
  const [editingPost, setEditingPost] = useState<CalendarPost | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedClient, setSelectedClient] = useState('all');

  const [calendarFormData, setCalendarFormData] = useState({
    clientId: '',
    name: '',
    period: 'monthly' as 'weekly' | 'monthly',
    startDate: '',
    endDate: ''
  });

  const [postFormData, setPostFormData] = useState({
    date: '',
    title: '',
    type: 'presentation' as CalendarPost['type'],
    description: '',
    briefing: '',
    attachments: [] as string[],
    status: 'planned' as CalendarPost['status']
  });

  const filteredCalendars = useMemo(() => {
    return calendars.filter(calendar => 
      selectedClient === 'all' || calendar.clientId === selectedClient
    );
  }, [calendars, selectedClient]);

  const resetCalendarForm = () => {
    setCalendarFormData({
      clientId: '',
      name: '',
      period: 'monthly',
      startDate: '',
      endDate: ''
    });
    setEditingCalendar(null);
    setShowCalendarForm(false);
  };

  const resetPostForm = () => {
    setPostFormData({
      date: '',
      title: '',
      type: 'presentation',
      description: '',
      briefing: '',
      attachments: [],
      status: 'planned'
    });
    setEditingPost(null);
    setShowPostForm(false);
  };

  const handleCalendarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCalendar: PostingCalendar = {
      id: editingCalendar?.id || Date.now().toString(),
      ...calendarFormData,
      posts: editingCalendar?.posts || [],
      createdAt: editingCalendar?.createdAt || new Date().toISOString()
    };

    if (editingCalendar) {
      setCalendars(prev => prev.map(cal => cal.id === editingCalendar.id ? newCalendar : cal));
    } else {
      setCalendars(prev => [...prev, newCalendar]);
    }

    resetCalendarForm();
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCalendar) return;

    const postType = postTypes.find(type => type.value === postFormData.type);
    const newPost: CalendarPost = {
      id: editingPost?.id || Date.now().toString(),
      ...postFormData,
      color: postType?.color || '#6A0DAD'
    };

    const updatedCalendar = {
      ...selectedCalendar,
      posts: editingPost 
        ? selectedCalendar.posts.map(post => post.id === editingPost.id ? newPost : post)
        : [...selectedCalendar.posts, newPost]
    };

    setCalendars(prev => prev.map(cal => cal.id === selectedCalendar.id ? updatedCalendar : cal));
    setSelectedCalendar(updatedCalendar);
    resetPostForm();
  };

  const handleEditCalendar = (calendar: PostingCalendar) => {
    setCalendarFormData({
      clientId: calendar.clientId,
      name: calendar.name,
      period: calendar.period,
      startDate: calendar.startDate,
      endDate: calendar.endDate
    });
    setEditingCalendar(calendar);
    setShowCalendarForm(true);
  };

  const handleEditPost = (post: CalendarPost) => {
    setPostFormData({
      date: post.date,
      title: post.title,
      type: post.type,
      description: post.description,
      briefing: post.briefing,
      attachments: post.attachments,
      status: post.status
    });
    setEditingPost(post);
    setShowPostForm(true);
  };

  const handleDeleteCalendar = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este calendário?')) {
      setCalendars(prev => prev.filter(cal => cal.id !== id));
      if (selectedCalendar?.id === id) {
        setSelectedCalendar(null);
      }
    }
  };

  const handleDeletePost = (postId: string) => {
    if (!selectedCalendar) return;
    
    if (confirm('Tem certeza que deseja excluir este post?')) {
      const updatedCalendar = {
        ...selectedCalendar,
        posts: selectedCalendar.posts.filter(post => post.id !== postId)
      };
      setCalendars(prev => prev.map(cal => cal.id === selectedCalendar.id ? updatedCalendar : cal));
      setSelectedCalendar(updatedCalendar);
    }
  };

  const handleDuplicateCalendar = (calendar: PostingCalendar) => {
    const duplicated: PostingCalendar = {
      ...calendar,
      id: Date.now().toString(),
      name: `${calendar.name} - Cópia`,
      posts: calendar.posts.map(post => ({
        ...post,
        id: Date.now().toString() + Math.random(),
        status: 'planned' as const
      })),
      createdAt: new Date().toISOString()
    };
    setCalendars(prev => [...prev, duplicated]);
  };

  const getClientById = (id: string) => clients.find(client => client.id === id);

  const generateCalendarDays = (calendar: PostingCalendar) => {
    const start = new Date(calendar.startDate);
    const end = new Date(calendar.endDate);
    const days = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    return days;
  };

  const getPostForDate = (calendar: PostingCalendar, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendar.posts.find(post => post.date === dateStr);
  };

  const exportCalendarToPDF = async (calendar: PostingCalendar) => {
    const client = getClientById(calendar.clientId);
    if (!client) return;

    // Create a temporary div for the calendar layout
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '1200px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '40px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';

    const days = generateCalendarDays(calendar);
    const daysPerWeek = 7;
    const weeks = [];
    
    for (let i = 0; i < days.length; i += daysPerWeek) {
      weeks.push(days.slice(i, i + daysPerWeek));
    }

    tempDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid ${client.color}; padding-bottom: 20px;">
        <h1 style="color: ${client.color}; font-size: 32px; margin: 0; font-weight: bold;">
          ${calendar.name}
        </h1>
        <h2 style="color: #666; font-size: 24px; margin: 10px 0; font-weight: normal;">
          ${client.name}
        </h2>
        <p style="color: #888; font-size: 16px; margin: 0;">
          ${new Date(calendar.startDate).toLocaleDateString('pt-BR')} - ${new Date(calendar.endDate).toLocaleDateString('pt-BR')}
        </p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 15px;">
        ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => 
          `<div style="text-align: center; font-weight: bold; color: ${client.color}; font-size: 18px; padding: 10px; background: #f8f9fa; border-radius: 8px;">${day}</div>`
        ).join('')}
        
        ${days.map(day => {
          const post = getPostForDate(calendar, day);
          const postType = post ? postTypes.find(type => type.value === post.type) : null;
          const status = post ? statusOptions.find(s => s.value === post.status) : null;
          
          return `
            <div style="
              min-height: 120px; 
              border: 2px solid #e5e7eb; 
              border-radius: 12px; 
              padding: 12px; 
              background: ${post ? post.color + '15' : '#ffffff'};
              ${post ? `border-color: ${post.color};` : ''}
            ">
              <div style="font-weight: bold; color: #374151; margin-bottom: 8px; font-size: 16px;">
                ${day.getDate()}
              </div>
              ${post ? `
                <div style="
                  background: ${post.color}; 
                  color: white; 
                  padding: 8px; 
                  border-radius: 8px; 
                  font-size: 12px; 
                  font-weight: bold; 
                  margin-bottom: 6px;
                  text-align: center;
                ">
                  ${postType?.label || post.type}
                </div>
                <div style="font-size: 11px; color: #374151; font-weight: 600; margin-bottom: 4px; line-height: 1.3;">
                  ${post.title}
                </div>
                <div style="font-size: 10px; color: #6b7280; line-height: 1.2;">
                  ${post.description.substring(0, 50)}${post.description.length > 50 ? '...' : ''}
                </div>
                <div style="
                  margin-top: 6px; 
                  padding: 2px 6px; 
                  background: ${status?.value === 'published' ? '#10b981' : status?.value === 'approved' ? '#f59e0b' : '#6b7280'}; 
                  color: white; 
                  border-radius: 4px; 
                  font-size: 9px; 
                  text-align: center;
                ">
                  ${status?.label || 'Planejado'}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Calendário gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        <p>© 2024 TARGET CRM</p>
      </div>
    `;

    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      
      const fileName = `calendario-${client.name.toLowerCase().replace(/\s+/g, '-')}-${calendar.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      pdf.save(fileName);
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const fileUrls = files.map(file => URL.createObjectURL(file));
    setPostFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...fileUrls]
    }));
  };

  const removeAttachment = (index: number) => {
    setPostFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl p-8 text-white shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Calendário de Postagens</h1>
            <p className="text-purple-100">Organize e planeje conteúdos para seus clientes</p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
            <Calendar className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setShowCalendarForm(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Novo Calendário
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Calendário
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Todos os Clientes</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Calendários Criados ({filteredCalendars.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Calendário</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Período</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Posts</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCalendars.map(calendar => {
                  const client = getClientById(calendar.clientId);
                  const publishedPosts = calendar.posts.filter(p => p.status === 'published').length;
                  const totalPosts = calendar.posts.length;
                  
                  return (
                    <tr key={calendar.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{calendar.name}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(calendar.startDate).toLocaleDateString('pt-BR')} - {new Date(calendar.endDate).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {client?.profilePhoto ? (
                            <img
                              src={client.profilePhoto}
                              alt={client.name}
                              className="w-8 h-8 rounded-full object-cover border-2"
                              style={{ borderColor: client.color }}
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                              style={{ backgroundColor: client?.color || '#6A0DAD' }}
                            >
                              {client?.name.charAt(0).toUpperCase() || 'C'}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{client?.name || 'Cliente não encontrado'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          calendar.period === 'monthly' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {calendar.period === 'monthly' ? 'Mensal' : 'Semanal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {totalPosts} posts ({publishedPosts} publicados)
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            publishedPosts === totalPosts ? 'bg-green-500' : 
                            publishedPosts > 0 ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-sm text-gray-600">
                            {publishedPosts === totalPosts ? 'Completo' : 
                             publishedPosts > 0 ? 'Em andamento' : 'Planejado'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedCalendar(calendar)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportCalendarToPDF(calendar)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Exportar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateCalendar(calendar)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Duplicar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditCalendar(calendar)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCalendar(calendar.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
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
            {filteredCalendars.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhum calendário criado ainda</p>
                <p className="text-gray-400">Clique em "Novo Calendário" para começar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar Detail View */}
      {selectedCalendar && viewMode === 'calendar' && (
        <div className="bg-white rounded-xl shadow-elegant p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedCalendar(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Voltar
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedCalendar.name}</h2>
                <p className="text-gray-600">
                  {getClientById(selectedCalendar.clientId)?.name} - 
                  {new Date(selectedCalendar.startDate).toLocaleDateString('pt-BR')} a {new Date(selectedCalendar.endDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPostForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Post
              </button>
              <button
                onClick={() => exportCalendarToPDF(selectedCalendar)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2 bg-gray-100 rounded-lg">
                {day}
              </div>
            ))}
            
            {generateCalendarDays(selectedCalendar).map(day => {
              const post = getPostForDate(selectedCalendar, day);
              const postType = post ? postTypes.find(type => type.value === post.type) : null;
              const PostIcon = postType?.icon || FileText;
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-32 border-2 rounded-xl p-3 transition-all hover:shadow-lg ${
                    post 
                      ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50' 
                      : 'border-gray-200 bg-white hover:border-purple-200'
                  }`}
                >
                  <div className="font-semibold text-gray-800 mb-2">{day.getDate()}</div>
                  
                  {post ? (
                    <div className="space-y-2">
                      <div 
                        className="flex items-center gap-2 p-2 rounded-lg text-white text-xs font-medium"
                        style={{ backgroundColor: post.color }}
                      >
                        <PostIcon className="w-3 h-3" />
                        {postType?.label}
                      </div>
                      <div className="text-xs font-semibold text-gray-800 line-clamp-2">
                        {post.title}
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {post.description}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          statusOptions.find(s => s.value === post.status)?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {statusOptions.find(s => s.value === post.status)?.label}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditPost(post)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setPostFormData(prev => ({ ...prev, date: day.toISOString().split('T')[0] }));
                        setShowPostForm(true);
                      }}
                      className="w-full h-full flex items-center justify-center text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Form Modal */}
      {showCalendarForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 gradient-text">
              {editingCalendar ? 'Editar Calendário' : 'Novo Calendário'}
            </h3>
            
            <form onSubmit={handleCalendarSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  required
                  value={calendarFormData.clientId}
                  onChange={(e) => setCalendarFormData(prev => ({ ...prev, clientId: e.target.value }))}
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
                  Nome do Calendário *
                </label>
                <input
                  type="text"
                  required
                  value={calendarFormData.name}
                  onChange={(e) => setCalendarFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Calendário Janeiro 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período *
                </label>
                <select
                  required
                  value={calendarFormData.period}
                  onChange={(e) => setCalendarFormData(prev => ({ ...prev, period: e.target.value as 'weekly' | 'monthly' }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={calendarFormData.startDate}
                    onChange={(e) => setCalendarFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Fim *
                  </label>
                  <input
                    type="date"
                    required
                    value={calendarFormData.endDate}
                    onChange={(e) => setCalendarFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetCalendarForm}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  {editingCalendar ? 'Atualizar' : 'Criar'} Calendário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Form Modal */}
      {showPostForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 gradient-text">
              {editingPost ? 'Editar Post' : 'Novo Post'}
            </h3>
            
            <form onSubmit={handlePostSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={postFormData.date}
                    onChange={(e) => setPostFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Post *
                  </label>
                  <select
                    required
                    value={postFormData.type}
                    onChange={(e) => setPostFormData(prev => ({ ...prev, type: e.target.value as CalendarPost['type'] }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {postTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Post *
                </label>
                <input
                  type="text"
                  required
                  value={postFormData.title}
                  onChange={(e) => setPostFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Lançamento do novo produto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição/Legenda *
                </label>
                <textarea
                  required
                  rows={3}
                  value={postFormData.description}
                  onChange={(e) => setPostFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Descrição do post ou texto da legenda..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Briefing/Orientações
                </label>
                <textarea
                  rows={3}
                  value={postFormData.briefing}
                  onChange={(e) => setPostFormData(prev => ({ ...prev, briefing: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Orientações para criação da arte, tom de voz, etc..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={postFormData.status}
                  onChange={(e) => setPostFormData(prev => ({ ...prev, status: e.target.value as CalendarPost['status'] }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anexos
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  
                  {postFormData.attachments.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {postFormData.attachments.map((attachment, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={attachment}
                            alt={`Anexo ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetPostForm}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  {editingPost ? 'Atualizar' : 'Criar'} Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostingCalendarManager;