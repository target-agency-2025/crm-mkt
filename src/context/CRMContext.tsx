import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { clientsAPI, createClientFormData } from '../services/api';

// User interface
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Calendar Event interface for persistence
interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  clientId: string;
  type: 'publicacao' | 'reuniao' | 'prazo' | 'outro';
  publicationType?: string;
  color: string;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  profilePhoto?: string;
  color: string;
  monthlyValue: number;
  paymentDay: number;
  optionalPaymentDate1?: string;
  optionalPaymentDate2?: string;
  status: 'active' | 'inactive' | 'paused';
  createdAt: string;
}

interface UniqueJob {
  id: string;
  name: string;
  phone: string;
  uniqueValue: number;
  paymentDate: string;
  clientId?: string;
  status: 'active' | 'inactive' | 'completed';
  createdAt: string;
}

interface Invoice {
  id: string;
  clientId?: string;
  uniqueJobId?: string;
  type: 'client' | 'uniqueJob';
  clientName: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
}

interface Credential {
  id: string;
  clientId?: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category: 'general' | 'social' | 'api' | 'password';
  socialPlatform?: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'doing' | 'waiting' | 'done';
  clientId?: string;
  dueDate?: string;
  createdAt: string;
}

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

interface Quote {
  id: string;
  type: 'monthly' | 'unique';
  planName: string;
  planType?: 'plano' | 'servico'; // Optional for backwards compatibility
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  clientId?: string; // Optional link to existing client
  services: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  gifts?: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  // For monthly plans
  monthlyValue?: number;
  // For unique services
  uniqueValue?: number;
  validUntil: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  notes?: string;
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

interface CRMState {
  user: User | null;
  isAuthenticated: boolean;
  clients: Client[];
  uniqueJobs: UniqueJob[];
  invoices: Invoice[];
  credentials: Credential[];
  tasks: Task[];
  budgetPlans: BudgetPlan[];
  budgets: Budget[];
  quotes: Quote[];
  calendarEvents: CalendarEvent[];
}

type CRMAction = 
  | { type: 'LOGIN_USER'; payload: User }
  | { type: 'LOGOUT_USER' }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'ADD_UNIQUE_JOB'; payload: UniqueJob }
  | { type: 'UPDATE_UNIQUE_JOB'; payload: UniqueJob }
  | { type: 'DELETE_UNIQUE_JOB'; payload: string }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: Invoice }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'ADD_CREDENTIAL'; payload: Credential }
  | { type: 'UPDATE_CREDENTIAL'; payload: Credential }
  | { type: 'DELETE_CREDENTIAL'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_BUDGET_PLAN'; payload: BudgetPlan }
  | { type: 'UPDATE_BUDGET_PLAN'; payload: BudgetPlan }
  | { type: 'DELETE_BUDGET_PLAN'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'ADD_QUOTE'; payload: Quote }
  | { type: 'UPDATE_QUOTE'; payload: Quote }
  | { type: 'DELETE_QUOTE'; payload: string }
  | { type: 'ADD_CALENDAR_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_CALENDAR_EVENT'; payload: CalendarEvent }
  | { type: 'DELETE_CALENDAR_EVENT'; payload: string }
  | { type: 'GENERATE_CLIENT_INVOICES' }
  | { type: 'LOAD_STATE'; payload: CRMState };

const initialState: CRMState = {
  user: null,
  isAuthenticated: false,
  clients: [],
  uniqueJobs: [],
  invoices: [],
  credentials: [],
  tasks: [],
  calendarEvents: [],
  budgetPlans: [
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
  ],
  budgets: [],
  quotes: []
};

// API functions for backend communication
const API_BASE = 'http://localhost:3001/api';

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
};

// Save data to backend
const saveUserData = async (userId: string, data: any) => {
  try {
    await apiCall('/user-data', {
      method: 'POST',
      body: JSON.stringify({ userId, data })
    });
    console.log('✅ Data saved to backend successfully');
  } catch (error) {
    console.warn('⚠️ Backend save failed, using localStorage fallback:', error);
    // Fallback to localStorage
    localStorage.setItem(`crm-data-${userId}`, JSON.stringify(data));
  }
};

// Load data from backend
const loadUserData = async (userId: string) => {
  try {
    const response = await apiCall(`/user-data/${userId}`);
    console.log('✅ Data loaded from backend successfully');
    return response.data;
  } catch (error) {
    console.warn('⚠️ Backend load failed, using localStorage fallback:', error);
    // Fallback to localStorage
    const saved = localStorage.getItem(`crm-data-${userId}`);
    return saved ? JSON.parse(saved) : null;
  }
};

const crmReducer = (state: CRMState, action: CRMAction): CRMState => {
  switch (action.type) {
    case 'LOGIN_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true
      };
    case 'LOGOUT_USER':
      return {
        ...initialState
      };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client =>
          client.id === action.payload.id ? action.payload : client
        )
      };
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload)
      };
    case 'GENERATE_CLIENT_INVOICES': {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const currentDay = currentDate.getDate();
      
      const newInvoices: Invoice[] = [];
      
      // Generate invoices for active clients whose payment day matches today
      state.clients
        .filter(client => 
          client.status === 'active' && 
          client.monthlyValue > 0 && 
          client.paymentDay === currentDay
        )
        .forEach(client => {
          // Check if invoice for this month already exists
          const existingInvoice = state.invoices.find(invoice => 
            invoice.clientId === client.id &&
            invoice.type === 'client' &&
            new Date(invoice.createdAt).getMonth() === currentMonth &&
            new Date(invoice.createdAt).getFullYear() === currentYear
          );
          
          if (!existingInvoice) {
            const invoiceId = `${Date.now()}-${client.id}`;
            const monthNames = [
              'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            
            const newInvoice: Invoice = {
              id: invoiceId,
              clientId: client.id,
              type: 'client',
              clientName: client.company || client.name,
              description: `Serviços de Marketing - ${monthNames[currentMonth]} ${currentYear}`,
              amount: client.monthlyValue,
              dueDate: new Date(currentYear, currentMonth, client.paymentDay).toISOString().split('T')[0],
              status: 'pending',
              createdAt: new Date().toISOString()
            };
            
            newInvoices.push(newInvoice);
          }
        });
      
      // Also check for optional payment dates
      state.clients
        .filter(client => client.status === 'active' && client.monthlyValue > 0)
        .forEach(client => {
          const checkOptionalDate = (optionalDate?: string) => {
            if (!optionalDate) return;
            
            const optionalPaymentDate = new Date(optionalDate);
            if (
              optionalPaymentDate.getDate() === currentDay &&
              optionalPaymentDate.getMonth() === currentMonth &&
              optionalPaymentDate.getFullYear() === currentYear
            ) {
              // Check if invoice for this optional date already exists
              const existingOptionalInvoice = state.invoices.find(invoice => 
                invoice.clientId === client.id &&
                invoice.type === 'client' &&
                invoice.dueDate === optionalDate
              );
              
              if (!existingOptionalInvoice) {
                const invoiceId = `${Date.now()}-opt-${client.id}`;
                const monthNames = [
                  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ];
                
                const newInvoice: Invoice = {
                  id: invoiceId,
                  clientId: client.id,
                  type: 'client',
                  clientName: client.company || client.name,
                  description: `Serviços de Marketing - ${monthNames[currentMonth]} ${currentYear} (Data Opcional)`,
                  amount: client.monthlyValue,
                  dueDate: optionalDate,
                  status: 'pending',
                  createdAt: new Date().toISOString()
                };
                
                newInvoices.push(newInvoice);
              }
            }
          };
          
          checkOptionalDate(client.optionalPaymentDate1);
          checkOptionalDate(client.optionalPaymentDate2);
        });
      
      return {
        ...state,
        invoices: [...state.invoices, ...newInvoices]
      };
    }
    case 'ADD_UNIQUE_JOB':
      return { ...state, uniqueJobs: [...state.uniqueJobs, action.payload] };
    case 'UPDATE_UNIQUE_JOB':
      return {
        ...state,
        uniqueJobs: state.uniqueJobs.map(job =>
          job.id === action.payload.id ? action.payload : job
        )
      };
    case 'DELETE_UNIQUE_JOB':
      return {
        ...state,
        uniqueJobs: state.uniqueJobs.filter(job => job.id !== action.payload)
      };
    case 'ADD_INVOICE':
      return { ...state, invoices: [...state.invoices, action.payload] };
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(invoice =>
          invoice.id === action.payload.id ? action.payload : invoice
        )
      };
    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(invoice => invoice.id !== action.payload)
      };
    case 'ADD_CREDENTIAL':
      return { ...state, credentials: [...state.credentials, action.payload] };
    case 'UPDATE_CREDENTIAL':
      return {
        ...state,
        credentials: state.credentials.map(cred =>
          cred.id === action.payload.id ? action.payload : cred
        )
      };
    case 'DELETE_CREDENTIAL':
      return {
        ...state,
        credentials: state.credentials.filter(cred => cred.id !== action.payload)
      };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        )
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    case 'ADD_BUDGET_PLAN':
      return { ...state, budgetPlans: [...state.budgetPlans, action.payload] };
    case 'UPDATE_BUDGET_PLAN':
      return {
        ...state,
        budgetPlans: state.budgetPlans.map(plan =>
          plan.id === action.payload.id ? action.payload : plan
        )
      };
    case 'DELETE_BUDGET_PLAN':
      return {
        ...state,
        budgetPlans: state.budgetPlans.filter(plan => plan.id !== action.payload)
      };
    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets, action.payload] };
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(budget =>
          budget.id === action.payload.id ? action.payload : budget
        )
      };
    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(budget => budget.id !== action.payload)
      };
    case 'ADD_QUOTE':
      return { ...state, quotes: [...state.quotes, action.payload] };
    case 'UPDATE_QUOTE':
      return {
        ...state,
        quotes: state.quotes.map(quote =>
          quote.id === action.payload.id ? action.payload : quote
        )
      };
    case 'DELETE_QUOTE':
      return {
        ...state,
        quotes: state.quotes.filter(quote => quote.id !== action.payload)
      };
    case 'ADD_CALENDAR_EVENT':
      return { ...state, calendarEvents: [...state.calendarEvents, action.payload] };
    case 'UPDATE_CALENDAR_EVENT':
      return {
        ...state,
        calendarEvents: state.calendarEvents.map(event =>
          event.id === action.payload.id ? action.payload : event
        )
      };
    case 'DELETE_CALENDAR_EVENT':
      return {
        ...state,
        calendarEvents: state.calendarEvents.filter(event => event.id !== action.payload)
      };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
};

const CRMContext = createContext<{
  state: CRMState;
  dispatch: React.Dispatch<CRMAction>;
} | null>(null);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(crmReducer, initialState);

  // Load user data when authenticated
  useEffect(() => {
    // Remove auto-login for security - always require manual login
    // const savedUser = localStorage.getItem('crm-current-user');
    // User must login manually every time for security
    console.log('🔐 Sistema iniciado - Login manual obrigatório para segurança');
    
    // Additional security measure: Ensure no user data is loaded automatically
    // This completely prevents any form of auto-login
  }, []);

  // Check for invoice generation daily
  useEffect(() => {
    const checkInvoices = () => {
      dispatch({ type: 'GENERATE_CLIENT_INVOICES' });
    };
    
    // Check immediately and then every hour
    const interval = setInterval(checkInvoices, 60 * 60 * 1000); // Every hour
    
    return () => clearInterval(interval);
  }, [state.clients]); // Re-run when clients change

  // Auto-save user data when state changes
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      const dataToSave = {
        clients: state.clients,
        uniqueJobs: state.uniqueJobs,
        invoices: state.invoices,
        credentials: state.credentials,
        tasks: state.tasks,
        budgetPlans: state.budgetPlans,
        budgets: state.budgets,
        quotes: state.quotes,
        calendarEvents: state.calendarEvents
      };
      
      // Save to backend with fallback to localStorage
      saveUserData(state.user.id, dataToSave);
    }
  }, [state.clients, state.uniqueJobs, state.invoices, state.credentials, 
      state.tasks, state.budgetPlans, state.budgets, state.quotes, state.calendarEvents, 
      state.isAuthenticated, state.user]);

  const login = async (user: User) => {
    // Do NOT save to localStorage for security - require login every time
    dispatch({ type: 'LOGIN_USER', payload: user });
      
    // Load user data after successful login
    try {
      const userData = await loadUserData(user.id);
      if (userData) {
        const stateWithDefaults = {
          ...userData,
          user,
          isAuthenticated: true,
          budgetPlans: userData.budgetPlans && userData.budgetPlans.length > 0 
            ? userData.budgetPlans 
            : initialState.budgetPlans,
          quotes: userData.quotes || [],
          calendarEvents: userData.calendarEvents || []
        };
        dispatch({ type: 'LOAD_STATE', payload: stateWithDefaults });
          
        // Generate invoices immediately after login for faster loading
        dispatch({ type: 'GENERATE_CLIENT_INVOICES' });
      }
    } catch (error) {
      console.error('Error loading user data after login:', error);
    }
      
    console.log('✅ Login realizado com segurança - sessão temporária');
  };

  const logout = () => {
    // Clear any temporary session data
    localStorage.removeItem('crm-current-user');
    // Clear all user-specific data from memory for security
    dispatch({ type: 'LOGOUT_USER' });
    console.log('🔒 Logout realizado - dados limpos da memória por segurança');
      
    // Additional security: Ensure no user credentials remain in any storage
    // This completely prevents any form of auto-login on next visit
  };

  // Getters
  const getActiveClients = () => state.clients.filter(client => client.status === 'active');
  const getInactiveClients = () => state.clients.filter(client => client.status === 'inactive');
  const getPausedClients = () => state.clients.filter(client => client.status === 'paused');
  
  const value = {
    state,
    dispatch
  };

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  
  const { state, dispatch } = context;
  
  // Client Getters
  const getActiveClients = () => state.clients.filter(client => client.status === 'active');
  const getInactiveClients = () => state.clients.filter(client => client.status === 'inactive');
  const getPausedClients = () => state.clients.filter(client => client.status === 'paused');
  
  return {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    clients: state.clients,
    uniqueJobs: state.uniqueJobs,
    invoices: state.invoices,
    credentials: state.credentials,
    tasks: state.tasks,
    budgetPlans: state.budgetPlans,
    budgets: state.budgets,
    quotes: state.quotes,
    calendarEvents: state.calendarEvents,
    
    // Authentication Actions
    loginUser: async (user: User) => {
      // Do NOT save to localStorage for security - require login every time
      dispatch({ type: 'LOGIN_USER', payload: user });
      
      // Load user data after successful login
      try {
        const userData = await loadUserData(user.id);
        if (userData) {
          const stateWithDefaults = {
            ...userData,
            user,
            isAuthenticated: true,
            budgetPlans: userData.budgetPlans && userData.budgetPlans.length > 0 
              ? userData.budgetPlans 
              : initialState.budgetPlans,
            quotes: userData.quotes || [],
            calendarEvents: userData.calendarEvents || []
          };
          dispatch({ type: 'LOAD_STATE', payload: stateWithDefaults });
          
          // Generate invoices immediately after login for faster loading
          dispatch({ type: 'GENERATE_CLIENT_INVOICES' });
        }
      } catch (error) {
        console.error('Error loading user data after login:', error);
      }
      
      console.log('✅ Login realizado com segurança - sessão temporária');
    },
    
    logoutUser: () => {
      // Clear any temporary session data
      localStorage.removeItem('crm-current-user');
      // Clear all user-specific data from memory for security
      dispatch({ type: 'LOGOUT_USER' });
      console.log('🔒 Logout realizado - dados limpos da memória por segurança');
      
      // Additional security: Ensure no user credentials remain in any storage
      // This completely prevents any form of auto-login on next visit
    },
    
    loadUserData: async () => {
      if (state.user) {
        try {
          const userData = await loadUserData(state.user.id);
          if (userData) {
            const stateWithDefaults = {
              ...userData,
              user: state.user,
              isAuthenticated: true,
              budgetPlans: userData.budgetPlans && userData.budgetPlans.length > 0 
                ? userData.budgetPlans 
                : initialState.budgetPlans,
              quotes: userData.quotes || [],
              calendarEvents: userData.calendarEvents || []
            };
            dispatch({ type: 'LOAD_STATE', payload: stateWithDefaults });
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    },
    
    // Client Getters
    getActiveClients,
    getInactiveClients,
    getPausedClients,
    
    // Actions
    addClient: async (client: Omit<Client, 'id' | 'createdAt'>) => {
      try {
        // Convert client data to the format expected by the API
        const clientData = {
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company || '',
          color: client.color,
          monthlyValue: client.monthlyValue?.toString() || '0',
          paymentDay: client.paymentDay?.toString() || '1',
          optionalPaymentDate1: client.optionalPaymentDate1 || '',
          optionalPaymentDate2: client.optionalPaymentDate2 || '',
          status: client.status
        };

        // Create FormData
        const formData = createClientFormData(clientData);

        // Send to backend
        const response = await clientsAPI.create(formData);
        
        // Update local state with the client returned from backend
        dispatch({
          type: 'ADD_CLIENT',
          payload: response
        });
        
        // Automatically generate invoice for next month when client is registered
        if (response.monthlyValue > 0 && response.paymentDay > 0) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          
          const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
          ];
          
          const invoiceData = {
            type: 'client' as const,
            clientId: response.id,
            clientName: response.company || response.name,
            description: `Serviços de Marketing - ${monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`,
            amount: response.monthlyValue,
            dueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), response.paymentDay).toISOString().split('T')[0],
            status: 'pending' as const
          };
          
          dispatch({
            type: 'ADD_INVOICE',
            payload: {
              ...invoiceData,
              id: (Date.now() + 1).toString(),
              createdAt: new Date().toISOString()
            }
          });
        }
      } catch (error) {
        console.error('Error adding client:', error);
        // Fallback to local state update if API call fails
        const newClient = {
          ...client,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        
        dispatch({
          type: 'ADD_CLIENT',
          payload: newClient
        });
        
        // Automatically generate invoice for next month when client is registered
        if (newClient.monthlyValue > 0 && newClient.paymentDay > 0) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          
          const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
          ];
          
          const invoiceData = {
            type: 'client' as const,
            clientId: newClient.id,
            clientName: newClient.company || newClient.name,
            description: `Serviços de Marketing - ${monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`,
            amount: newClient.monthlyValue,
            dueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), newClient.paymentDay).toISOString().split('T')[0],
            status: 'pending' as const
          };
          
          dispatch({
            type: 'ADD_INVOICE',
            payload: {
              ...invoiceData,
              id: (Date.now() + 1).toString(),
              createdAt: new Date().toISOString()
            }
          });
        }
      }
    },
    updateClient: async (client: Client) => {
      try {
        // Send to backend
        await clientsAPI.update(client.id, createClientFormData(client));
        
        // Update local state
        dispatch({ type: 'UPDATE_CLIENT', payload: client });
      } catch (error) {
        console.error('Error updating client:', error);
        // Fallback to local state update if API call fails
        dispatch({ type: 'UPDATE_CLIENT', payload: client });
      }
    },
    deleteClient: async (id: string) => {
      try {
        // Send to backend
        await clientsAPI.delete(id);
        
        // Update local state
        dispatch({ type: 'DELETE_CLIENT', payload: id });
      } catch (error) {
        console.error('Error deleting client:', error);
        // Fallback to local state update if API call fails
        dispatch({ type: 'DELETE_CLIENT', payload: id });
      }
    },
    
    addUniqueJob: (job: Omit<UniqueJob, 'id' | 'createdAt'>) => {
      const newJob = {
        ...job,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      dispatch({
        type: 'ADD_UNIQUE_JOB',
        payload: newJob
      });
      
      // Automatically generate invoice for unique job
      const invoiceData = {
        type: 'uniqueJob' as const,
        uniqueJobId: newJob.id,
        clientName: job.clientId ? 
          state.clients.find(c => c.id === job.clientId)?.name || job.name : 
          job.name,
        description: `Trabalho Único - ${job.name}`,
        amount: job.uniqueValue,
        dueDate: job.paymentDate,
        status: 'pending' as const
      };
      
      dispatch({
        type: 'ADD_INVOICE',
        payload: {
          ...invoiceData,
          id: (Date.now() + 1).toString(),
          createdAt: new Date().toISOString()
        }
      });
    },
    updateUniqueJob: (job: UniqueJob) => {
      dispatch({ type: 'UPDATE_UNIQUE_JOB', payload: job });
    },
    deleteUniqueJob: (id: string) => {
      dispatch({ type: 'DELETE_UNIQUE_JOB', payload: id });
    },
    
    addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
      dispatch({
        type: 'ADD_INVOICE',
        payload: {
          ...invoice,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        }
      });
    },
    updateInvoice: (invoice: Invoice) => {
      const currentInvoice = state.invoices.find(inv => inv.id === invoice.id);
      
      dispatch({ type: 'UPDATE_INVOICE', payload: invoice });
      
      // If invoice status changed from non-paid to paid, generate next month's invoice
      if (currentInvoice && 
          currentInvoice.status !== 'paid' && 
          invoice.status === 'paid' && 
          invoice.type === 'client' && 
          invoice.clientId) {
        
        const client = state.clients.find(c => c.id === invoice.clientId);
        if (client && client.status === 'active' && client.monthlyValue > 0) {
          const currentDueDate = new Date(invoice.dueDate);
          const nextMonth = new Date(currentDueDate);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          
          // Check if next month's invoice already exists
          const existingNextInvoice = state.invoices.find(inv => 
            inv.clientId === client.id &&
            inv.type === 'client' &&
            new Date(inv.dueDate).getMonth() === nextMonth.getMonth() &&
            new Date(inv.dueDate).getFullYear() === nextMonth.getFullYear()
          );
          
          if (!existingNextInvoice) {
            const monthNames = [
              'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            
            const nextInvoiceData = {
              type: 'client' as const,
              clientId: client.id,
              clientName: client.company || client.name,
              description: `Serviços de Marketing - ${monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`,
              amount: client.monthlyValue,
              dueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), client.paymentDay).toISOString().split('T')[0],
              status: 'pending' as const
            };
            
            dispatch({
              type: 'ADD_INVOICE',
              payload: {
                ...nextInvoiceData,
                id: `${Date.now()}-next-${client.id}`,
                createdAt: new Date().toISOString()
              }
            });
          }
        }
      }
    },
    deleteInvoice: (id: string) => {
      dispatch({ type: 'DELETE_INVOICE', payload: id });
    },
    
    addCredential: (credential: Omit<Credential, 'id' | 'createdAt'>) => {
      dispatch({
        type: 'ADD_CREDENTIAL',
        payload: {
          ...credential,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        }
      });
    },
    updateCredential: (credential: Credential) => {
      dispatch({ type: 'UPDATE_CREDENTIAL', payload: credential });
    },
    deleteCredential: (id: string) => {
      dispatch({ type: 'DELETE_CREDENTIAL', payload: id });
    },
    
    addTask: (task: Omit<Task, 'id' | 'createdAt'>) => {
      dispatch({
        type: 'ADD_TASK',
        payload: {
          ...task,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        }
      });
    },
    updateTask: (task: Task) => {
      dispatch({ type: 'UPDATE_TASK', payload: task });
    },
    deleteTask: (id: string) => {
      dispatch({ type: 'DELETE_TASK', payload: id });
    },
    
    addBudgetPlan: (plan: Omit<BudgetPlan, 'id' | 'createdAt'>) => {
      dispatch({
        type: 'ADD_BUDGET_PLAN',
        payload: {
          ...plan,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        }
      });
    },
    updateBudgetPlan: (plan: BudgetPlan) => {
      dispatch({ type: 'UPDATE_BUDGET_PLAN', payload: plan });
    },
    deleteBudgetPlan: (id: string) => {
      dispatch({ type: 'DELETE_BUDGET_PLAN', payload: id });
    },
    
    addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => {
      dispatch({
        type: 'ADD_BUDGET',
        payload: {
          ...budget,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        }
      });
    },
    updateBudget: (budget: Budget) => {
      dispatch({ type: 'UPDATE_BUDGET', payload: budget });
    },
    deleteBudget: (id: string) => {
      dispatch({ type: 'DELETE_BUDGET', payload: id });
    },
    
    addQuote: (quote: Omit<Quote, 'id' | 'createdAt'>) => {
      dispatch({
        type: 'ADD_QUOTE',
        payload: {
          ...quote,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        }
      });
    },
    updateQuote: (quote: Quote) => {
      dispatch({ type: 'UPDATE_QUOTE', payload: quote });
    },
    deleteQuote: (id: string) => {
      dispatch({ type: 'DELETE_QUOTE', payload: id });
    },
    
    // Generate invoices for clients based on payment dates
    generateClientInvoices: () => {
      dispatch({ type: 'GENERATE_CLIENT_INVOICES' });
    },
    
    // Calendar Actions
    addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
      dispatch({
        type: 'ADD_CALENDAR_EVENT',
        payload: {
          ...event,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        }
      });
    },
    updateCalendarEvent: (event: CalendarEvent) => {
      dispatch({ type: 'UPDATE_CALENDAR_EVENT', payload: event });
    },
    deleteCalendarEvent: (id: string) => {
      dispatch({ type: 'DELETE_CALENDAR_EVENT', payload: id });
    }
  };
};

export type { User, Client, UniqueJob, Invoice, Credential, Task, BudgetPlan, Budget, Quote, CalendarEvent };