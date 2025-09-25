import React, { useState, useMemo, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { Calendar, Plus, Edit2, Trash2, Download, ChevronLeft, ChevronRight, Clock, CheckCircle, Eye, Filter, Video, Image, Users, Megaphone, Camera, FileText, Play } from 'lucide-react';
import jsPDF from 'jspdf';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  clientId: string;
  type: 'publicacoes' | 'reunioes' | 'campanhas' | 'outros';
  publicationType?: 'reels' | 'post' | 'stories' | 'carrossel' | 'video' | 'live';
  color: string;
  time?: string;
  createdAt: string;
}

const eventTypes = [
  { value: 'publicacoes', label: 'Publicações', color: '#3B82F6' },
  { value: 'reunioes', label: 'Reuniões', color: '#10B981' },
  { value: 'campanhas', label: 'Campanhas', color: '#F59E0B' },
  { value: 'outros', label: 'Outros', color: '#8B5CF6' }
];

const publicationTypes = [
  { value: 'reels', label: 'Reels', color: '#E91E63', icon: Video },
  { value: 'post', label: 'Post', color: '#2196F3', icon: Image },
  { value: 'stories', label: 'Stories', color: '#FF9800', icon: Camera },
  { value: 'carrossel', label: 'Carrossel', color: '#9C27B0', icon: Users },
  { value: 'video', label: 'Vídeo', color: '#F44336', icon: Play },
  { value: 'live', label: 'Live', color: '#4CAF50', icon: Megaphone }
];

export default function MonthlyCalendar() {
  const { clients } = useCRM();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    date: '',
    clientId: '',
    type: 'publicacoes' as CalendarEvent['type'],
    publicationType: 'post' as CalendarEvent['publicationType'],
    time: ''
  });

  // Enhanced localStorage storage system
  const STORAGE_KEYS = {
    EVENTS: 'crm-calendar-events-v2',
    SELECTED_CLIENT: 'crm-selected-client-v2',
    CLIENTS_DATA: 'crm-clients-data-v2'
  };

  // Save data to localStorage with error handling
  const saveToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Dados salvos: ${key}`);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  };

  // Load data from localStorage with error handling
  const loadFromStorage = (key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      return null;
    }
  };

  // Load events from localStorage
  const loadEvents = async (clientId?: string) => {
    try {
      setLoading(true);
      const savedEvents = loadFromStorage(STORAGE_KEYS.EVENTS) || [];
      
      let filteredEvents = savedEvents;
      if (clientId) {
        filteredEvents = savedEvents.filter((event: CalendarEvent) => event.clientId === clientId);
      }
      
      setEvents(filteredEvents);
      console.log(`Eventos carregados: ${filteredEvents.length}`);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save events to localStorage whenever events change
  const saveEvents = (newEvents: CalendarEvent[]) => {
    setEvents(newEvents);
    saveToStorage(STORAGE_KEYS.EVENTS, newEvents);
  };

  // Load events on component mount and when selected client changes
  useEffect(() => {
    loadEvents(selectedClient || undefined);
  }, [selectedClient]);

  // Load selected client from localStorage on mount
  useEffect(() => {
    const savedClient = loadFromStorage(STORAGE_KEYS.SELECTED_CLIENT);
    if (savedClient && clients.find(c => c.id === savedClient)) {
      setSelectedClient(savedClient);
    }
  }, [clients]);

  // Save selected client to localStorage
  useEffect(() => {
    if (selectedClient) {
      saveToStorage(STORAGE_KEYS.SELECTED_CLIENT, selectedClient);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_CLIENT);
    }
  }, [selectedClient]);

  // Generate calendar days for current week
  const generateCalendarDays = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    
    // Get Monday of current week
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    
    const days = [];
    
    // Add 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Filter events based on selected client and filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const clientMatch = !selectedClient || event.clientId === selectedClient;
      const typeMatch = selectedType === 'all' || event.type === selectedType;
      return clientMatch && typeMatch;
    });
  }, [events, selectedClient, selectedType]);

  // Auto-advance to current week
  React.useEffect(() => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    
    // Check if current date is in the current week
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    
    if (currentDate < currentWeekStart || currentDate > currentWeekEnd) {
      setCurrentDate(currentWeekStart);
    }
  }, []);

  // Format date to Brazilian format (DD/MM/YYYY)
  const formatDateToBrazilian = (date: string) => {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  // Format time to remove AM/PM
  const formatTime = (time: string) => {
    if (!time) return '';
    return time;
  };

  // Get selected client info
  const getSelectedClient = () => {
    return selectedClient ? clients.find(c => c.id === selectedClient) : null;
  };
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredEvents.filter(event => event.date === dateStr);
  };

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const resetEventForm = () => {
    setEventFormData({
      title: '',
      description: '',
      date: '',
      clientId: selectedClient || '',
      type: 'publicacoes',
      publicationType: 'post',
      time: ''
    });
    setEditingEvent(null);
    setShowEventForm(false);
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      let eventColor = '#6A0DAD';
      
      if (eventFormData.type === 'publicacoes' && eventFormData.publicationType) {
        const pubType = publicationTypes.find(type => type.value === eventFormData.publicationType);
        eventColor = pubType?.color || '#6A0DAD';
      } else {
        const eventType = eventTypes.find(type => type.value === eventFormData.type);
        eventColor = eventType?.color || '#6A0DAD';
      }
      
      const newEvent: CalendarEvent = {
        id: editingEvent?.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...eventFormData,
        color: eventColor,
        createdAt: editingEvent?.createdAt || new Date().toISOString()
      };
      
      // Get current events from storage
      const currentEvents = loadFromStorage(STORAGE_KEYS.EVENTS) || [];
      
      let updatedEvents;
      if (editingEvent) {
        // Update existing event
        updatedEvents = currentEvents.map((event: CalendarEvent) => 
          event.id === editingEvent.id ? newEvent : event
        );
      } else {
        // Add new event
        updatedEvents = [...currentEvents, newEvent];
      }
      
      // Save to storage and update state
      saveEvents(updatedEvents);
      resetEventForm();
      
      console.log('Evento salvo com sucesso:', newEvent.title);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEventFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      clientId: event.clientId,
      type: event.type,
      publicationType: event.publicationType || 'post',
      time: event.time || ''
    });
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        setLoading(true);
        
        // Get current events and filter out the deleted one
        const currentEvents = loadFromStorage(STORAGE_KEYS.EVENTS) || [];
        const updatedEvents = currentEvents.filter((event: CalendarEvent) => event.id !== eventId);
        
        // Save updated events
        saveEvents(updatedEvents);
        
        console.log('Evento excluído com sucesso');
      } catch (error) {
        console.error('Erro ao excluir evento:', error);
        alert('Erro ao excluir evento. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDateClick = (date: Date) => {
    if (!selectedClient) {
      alert('Por favor, selecione um cliente primeiro.');
      return;
    }
    const dateStr = date.toISOString().split('T')[0];
    setEventFormData(prev => ({ 
      ...prev, 
      date: dateStr,
      clientId: selectedClient
    }));
    setShowEventForm(true);
  };

  const exportCalendarToPDF = async () => {
    if (!selectedClient) {
      alert('Por favor, selecione um cliente primeiro.');
      return;
    }

    const client = getSelectedClient();
    if (!client) return;

    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 139, g: 92, b: 246 }; // Default purple
    };

    const clientColor = hexToRgb(client.color);

    // Header with TARGET logo
    try {
      const logoImg = document.createElement('img');
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

    // Title with client color
    pdf.setFontSize(20);
    pdf.setTextColor(clientColor.r, clientColor.g, clientColor.b);
    pdf.text('TARGET CRM - Calendário Semanal', 35, 20);
    
    // Client info
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Cliente: ${client.name}`, 15, 35);
    
    // Week range
    pdf.setFontSize(12);
    pdf.text(`Semana: ${getWeekRange()}`, 15, 45);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 52);

    // Calendar container with outer border and rounded corners
    const calendarStartY = 62;
    const calendarWidth = pageWidth - 30;
    const headerHeight = 16;
    const cellHeight = 40;
    const cellWidth = calendarWidth / 7;

    // Outer container with rounded corners and shadow effect
    pdf.setFillColor(245, 245, 245); // Light gray background for shadow effect
    pdf.roundedRect(14, calendarStartY - 1, calendarWidth + 2, headerHeight + cellHeight + 2, 4, 4, 'F');
    
    pdf.setFillColor(255, 255, 255); // White background
    pdf.setDrawColor(220, 220, 220); // Light border
    pdf.setLineWidth(0.5);
    pdf.roundedRect(15, calendarStartY, calendarWidth, headerHeight + cellHeight, 4, 4, 'FD');

    // Header with client color and rounded top corners
    pdf.setFillColor(clientColor.r, clientColor.g, clientColor.b);
    // Create rounded rectangle for header
    pdf.roundedRect(15, calendarStartY, calendarWidth, headerHeight, 4, 4, 'F');
    // Cover bottom corners to make only top rounded
    pdf.rect(15, calendarStartY + headerHeight - 4, calendarWidth, 4, 'F');
    
    // Header text - days of week
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    daysOfWeek.forEach((day, index) => {
      const x = 15 + (index * cellWidth) + (cellWidth / 2);
      const textWidth = pdf.getTextWidth(day);
      pdf.text(day, x - (textWidth / 2), calendarStartY + 10);
    });

    // Calendar body
    const bodyY = calendarStartY + headerHeight;
    
    // Individual day cells with exact design matching
    calendarDays.forEach((day, index) => {
      const x = 15 + (index * cellWidth);
      const todayHighlight = isToday(day);
      
      // Cell separators (vertical lines)
      if (index > 0) {
        pdf.setDrawColor(235, 235, 235);
        pdf.setLineWidth(0.5);
        pdf.line(x, bodyY, x, bodyY + cellHeight);
      }
      
      // Today highlighting with blue background and rounded corners
      if (todayHighlight) {
        pdf.setFillColor(239, 246, 255); // Very light blue
        pdf.roundedRect(x + 2, bodyY + 2, cellWidth - 4, cellHeight - 4, 3, 3, 'F');
      }
      
      // Day number - larger and bold
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      if (todayHighlight) {
        pdf.setTextColor(59, 130, 246); // Blue for today
      } else {
        pdf.setTextColor(31, 41, 55); // Dark gray
      }
      pdf.text(day.getDate().toString(), x + 6, bodyY + 12);
      
      // Today badge - positioned in top right
      if (todayHighlight) {
        pdf.setFillColor(59, 130, 246);
        pdf.roundedRect(x + cellWidth - 20, bodyY + 3, 16, 6, 2, 2, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6);
        pdf.setTextColor(255, 255, 255);
        const badgeText = 'HOJE';
        const badgeWidth = pdf.getTextWidth(badgeText);
        pdf.text(badgeText, x + cellWidth - 12 - (badgeWidth / 2), bodyY + 7);
      }
      
      // Events for this day
      const dayEvents = getEventsForDate(day);
      let eventY = bodyY + 18;
      
      dayEvents.slice(0, 2).forEach((event, eventIndex) => {
        if (eventY > bodyY + cellHeight - 6) return;
        
        const eventColor = hexToRgb(event.color);
        
        // Event card with white background and colored left border
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x + 3, eventY, cellWidth - 6, 8, 2, 2, 'F');
        
        // Colored left border (thicker)
        pdf.setFillColor(eventColor.r, eventColor.g, eventColor.b);
        pdf.roundedRect(x + 3, eventY, 2.5, 8, 1, 1, 'F');
        
        // Simple colored indicator for publication type
        pdf.setFillColor(eventColor.r, eventColor.g, eventColor.b);
        pdf.roundedRect(x + 7, eventY + 1, 4, 4, 1, 1, 'F');
        
        // Event title - bold and truncated
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0);
        const maxTitleLength = 10;
        const truncatedTitle = event.title.length > maxTitleLength ? 
          event.title.substring(0, maxTitleLength) + '...' : event.title;
        pdf.text(truncatedTitle, x + 13, eventY + 3.5);
        
        // Publication type label or time
        if (event.type === 'publicacoes' && event.publicationType) {
          const pubType = publicationTypes.find(p => p.value === event.publicationType);
          if (pubType) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6);
            pdf.setTextColor(eventColor.r, eventColor.g, eventColor.b);
            pdf.text(pubType.label, x + 13, eventY + 6.5);
          }
        } else if (event.time) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(6);
          pdf.setTextColor(107, 114, 128);
          pdf.text(event.time, x + 13, eventY + 6.5);
        }
        
        eventY += 10;
      });
      
      // More events indicator
      if (dayEvents.length > 2) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`+${dayEvents.length - 2} mais`, x + 4, eventY);
      }
    });

    // Footer with proper spacing and branding
    const footerY = pageHeight - 20;
    
    // Separator line
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    pdf.line(15, footerY - 5, pageWidth - 15, footerY - 5);
    
    // Footer text
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('© 2024 TARGET CRM. Documento confidencial.', 15, footerY);
    pdf.text('Contato: (11) 99237-3084', pageWidth - 60, footerY);
    
    // Client branding
    pdf.setFontSize(9);
    pdf.setTextColor(clientColor.r, clientColor.g, clientColor.b);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Calendário personalizado - ${client.name}`, 15, footerY + 8);

    // Save with proper filename
    const weekRange = getWeekRange().replace(/\//g, '-');
    const fileName = `calendario-${client.name.toLowerCase().replace(/\s+/g, '-')}-${weekRange}.pdf`;
    pdf.save(fileName);
  };

  const getWeekRange = () => {
    const days = calendarDays;
    if (days.length === 0) return '';
    
    const firstDay = days[0];
    const lastDay = days[6];
    
    const firstDayStr = firstDay.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const lastDayStr = lastDay.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    return `${firstDayStr} - ${lastDayStr}`;
  };

  const getClientById = (id: string) => clients.find(client => client.id === id);

  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div 
        className="bg-gradient-to-r rounded-xl p-8 text-white shadow-elegant"
        style={{
          background: selectedClient && getSelectedClient() 
            ? `linear-gradient(135deg, ${getSelectedClient()?.color}dd, ${getSelectedClient()?.color}aa)` 
            : 'linear-gradient(135deg, #7c3aed, #3b82f6)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Calendário Semanal</h1>
            <p className="text-white/80">
              {selectedClient && getSelectedClient() 
                ? `Organize as publicações de ${getSelectedClient()?.name}` 
                : 'Selecione um cliente para visualizar o calendário'}
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
            <Calendar className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Client Selection */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Cliente:</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[200px]"
            >
              <option value="">Selecione um cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-800 min-w-[200px] text-center">
            {getWeekRange()}
          </h2>
          
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (!selectedClient) {
                alert('Por favor, selecione um cliente primeiro.');
                return;
              }
              setShowEventForm(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            disabled={!selectedClient || loading}
          >
            <Plus className="w-5 h-5" />
            {loading ? 'Salvando...' : 'Novo Evento'}
          </button>

          <button
            onClick={exportCalendarToPDF}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      {selectedClient && (
        <div className="bg-white rounded-xl p-6 shadow-elegant">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Filtros</h3>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-600">Cliente:</span>
              <div className="flex items-center gap-2">
                {getSelectedClient()?.profilePhoto ? (
                  <img
                    src={getSelectedClient()?.profilePhoto}
                    alt={getSelectedClient()?.name}
                    className="w-6 h-6 rounded-full object-cover border-2"
                    style={{ borderColor: getSelectedClient()?.color }}
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                    style={{ backgroundColor: getSelectedClient()?.color }}
                  >
                    {getSelectedClient()?.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium" style={{ color: getSelectedClient()?.color }}>
                  {getSelectedClient()?.name}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evento</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todos os Tipos</option>
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      {selectedClient ? (
        <div className="bg-white rounded-xl shadow-elegant overflow-hidden">
          {/* Days of week header with client color */}
          <div 
            className="grid grid-cols-7 text-white"
            style={{
              background: `linear-gradient(135deg, ${getSelectedClient()?.color}dd, ${getSelectedClient()?.color}aa)`
            }}
          >
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
              <div key={day} className="p-4 text-center font-semibold">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-40 border-b border-r border-gray-200 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  isToday(day) ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => handleDateClick(day)}
              >
                <div className={`font-semibold mb-3 text-lg ${
                  isToday(day) ? 'text-blue-600' : 'text-gray-800'
                }`}>
                  {day.getDate()}
                  {isToday(day) && (
                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      Hoje
                    </span>
                  )}
                  <div className="text-sm text-gray-500 font-normal">
                    {day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {getEventsForDate(day).map(event => {
                    const client = getClientById(event.clientId);
                    let EventIcon = FileText;
                    
                    if (event.type === 'publicacoes' && event.publicationType) {
                      const pubType = publicationTypes.find(p => p.value === event.publicationType);
                      EventIcon = pubType?.icon || FileText;
                    }
                    
                    return (
                      <div
                        key={event.id}
                        className="text-sm p-2 rounded-lg border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors group cursor-pointer"
                        style={{ borderLeftColor: event.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(event);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <EventIcon className="w-4 h-4 flex-shrink-0" style={{ color: event.color }} />
                            <span className="truncate font-medium">{event.title}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.id);
                              }}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {event.type === 'publicacoes' && event.publicationType && (
                          <div className="text-xs" style={{ color: event.color }}>
                            {publicationTypes.find(p => p.value === event.publicationType)?.label}
                          </div>
                        )}
                        
                        {client && (
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {client.name}
                          </div>
                        )}
                        
                        {event.time && (
                          <div className="text-xs text-gray-600 mt-1">
                            {event.time}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-elegant p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Selecione um Cliente</h3>
          <p className="text-gray-500 mb-6">Escolha um cliente acima para visualizar e gerenciar o calendário semanal dele.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {clients.slice(0, 6).map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client.id)}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-300 group"
              >
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
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: client.color }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-medium text-gray-800 group-hover:text-gray-900">
                      {client.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {client.email}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 gradient-text">
              {editingEvent ? 'Editar Evento' : 'Novo Evento'}
            </h3>
            
            <form onSubmit={handleEventSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Reunião com cliente, Postagem Instagram..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventFormData.date}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Formato: DD/MM/AAAA
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário (Opcional)
                  </label>
                  <input
                    type="time"
                    value={eventFormData.time}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  required
                  value={eventFormData.clientId}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, clientId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {selectedClient ? (
                    <option value={selectedClient}>
                      {clients.find(c => c.id === selectedClient)?.name}
                    </option>
                  ) : (
                    <>
                      <option value="">Selecione um cliente</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    required
                    value={eventFormData.type}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {eventFormData.type === 'publicacoes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Publicação *
                    </label>
                    <select
                      required
                      value={eventFormData.publicationType}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, publicationType: e.target.value as CalendarEvent['publicationType'] }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {publicationTypes.map(pubType => (
                        <option key={pubType.value} value={pubType.value}>
                          {pubType.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Detalhes sobre o evento..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetEventForm}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : editingEvent ? 'Atualizar' : 'Criar'} Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}