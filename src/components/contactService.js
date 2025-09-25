// Service to handle contact operations with Supabase
import { supabase } from '../../supabaseClient';

// Function to save contact to Supabase
export async function salvarContato(nome, email, mensagem) {
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
}

// Function to fetch all contacts
export async function buscarContatos() {
  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar contatos:", error);
    return { success: false, error };
  } else {
    return { success: true, data };
  }
}

// Function to update a contact
export async function atualizarContato(id, updates) {
  const { data, error } = await supabase
    .from('contatos')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error("Erro ao atualizar contato:", error);
    return { success: false, error };
  } else {
    console.log("Contato atualizado:", data);
    return { success: true, data };
  }
}

// Function to delete a contact
export async function deletarContato(id) {
  const { data, error } = await supabase
    .from('contatos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao deletar contato:", error);
    return { success: false, error };
  } else {
    console.log("Contato deletado:", data);
    return { success: true, data };
  }
}