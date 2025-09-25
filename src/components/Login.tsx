import React, { useState } from 'react';
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useCRM } from '../context/CRMContext';

interface LoginProps {
  onLogin: (success: boolean) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginUser, loadUserData } = useCRM();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    // Check for valid credentials
    const validEmail = 'joaovitorsp2018@gmail.com';
    const validPassword = '@Deck0052';
    
    // Security note: Credentials are NEVER saved to any storage
    // This ensures maximum security - login is required every time
    
    // Removed artificial delay for faster login
    // Simulate login processing (immediate)
    setTimeout(async () => {
      setIsLoading(false);
      
      if (username === validEmail && password === validPassword) {
        try {
          // Create user object
          const user = {
            id: 'user_joao_vitor',
            email: username,
            name: 'João Vitor',
            role: 'admin'
          };
          
          // Login user and load their data (no localStorage save for security)
          await loginUser(user);
          
          console.log('✅ Login seguro realizado - sessão temporária iniciada');
          onLogin(true);
        } catch (error) {
          console.error('❌ Login error:', error);
          setError('Erro ao carregar dados do usuário');
        }
      } else {
        setError('Email ou senha incorretos. Acesso negado por segurança.');
      }
    }, 0); // Changed from 1000ms to 0ms for immediate processing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6A0DAD] via-[#7B1FA2] to-[#8E24AA] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#6A0DAD] to-[#8E24AA] rounded-2xl mb-4 shadow-xl">
              <img 
                src="https://i.ibb.co/1f53SrcR/ISO-LOGO.png" 
                alt="TARGET CRM Logo" 
                className="w-12 h-12 rounded-lg"
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6A0DAD] to-[#8E24AA] bg-clip-text text-transparent mb-2">
              TARGET CRM
            </h1>
            <p className="text-gray-600">Faça login para acessar seu sistema</p>
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm font-medium">
                🔒 Sistema Seguro: Login obrigatório a cada acesso
              </p>
              <p className="text-green-600 text-xs mt-1">
                Seus dados estão protegidos e serão mantidos permanentemente
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="email"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent transition-colors"
                  placeholder="Digite seu email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent transition-colors"
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full bg-gradient-to-r from-[#6A0DAD] to-[#8E24AA] text-white py-3 px-4 rounded-lg font-medium hover:from-[#5A0B9D] hover:to-[#7E209A] focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Entrar
                </>
              )}
            </button>
          </form>

        </div>

        {/* Bottom text */}
        <p className="text-center text-white/70 text-sm mt-6">
          © 2024 TARGET CRM. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}