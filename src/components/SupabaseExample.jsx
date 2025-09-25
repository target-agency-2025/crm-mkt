import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

// This is an example component showing how to use Supabase in your CRM
export default function SupabaseExample() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    mensagem: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Example function to save contact data to Supabase
  const salvarContato = async (nome, email, mensagem) => {
    const { data, error } = await supabase
      .from('contatos')
      .insert([{ nome, email, mensagem }]);

    if (error) {
      console.error("Erro ao salvar:", error);
      return { success: false, error };
    } else {
      console.log("Contato salvo:", data);
      return { success: true, data };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const result = await salvarContato(formData.nome, formData.email, formData.mensagem);
      
      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Contato salvo com sucesso no Supabase!'
        });
        // Clear form after success
        setFormData({
          nome: '',
          email: '',
          mensagem: ''
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: 'Erro ao salvar contato. Por favor, tente novamente.'
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Erro de conexão. Por favor, verifique sua conexão e tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Exemplo de Integração com Supabase</h2>
      <p className="text-gray-600 mb-6">
        Este é um exemplo de como integrar o Supabase no seu CRM para salvar dados de contato.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Seu nome completo"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="seu.email@exemplo.com"
          />
        </div>

        <div>
          <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-1">
            Mensagem
          </label>
          <textarea
            id="mensagem"
            name="mensagem"
            value={formData.mensagem}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Digite sua mensagem..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white shadow-lg transition-all duration-300 ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
        </button>
      </form>

      {submitStatus && (
        <div className={`mt-4 p-4 rounded-lg ${
          submitStatus.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {submitStatus.message}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-2">Como usar no seu projeto:</h3>
        <ol className="list-decimal list-inside text-blue-700 space-y-1">
          <li>Substitua "SEU-PROJETO" e "SUA_CHAVE_ANON" no arquivo supabaseClient.js</li>
          <li>Crie uma tabela "contatos" no seu Supabase com campos: nome, email, mensagem</li>
          <li>Importe o cliente Supabase: import &#123; supabase &#125; from './supabaseClient'</li>
          <li>Use as funções do Supabase para interagir com seus dados</li>
        </ol>
      </div>
    </div>
  );
}