import { supabase } from './supabaseClient.js'

// Salvar contato
export async function salvarContato(nome, email, mensagem) {
  const { data, error } = await supabase
    .from('contatos')
    .insert([{ nome, email, mensagem }])

  if (error) {
    alert("Erro ao salvar: " + error.message)
  } else {
    alert("Contato salvo com sucesso!")
    listarContatos()
  }
}

// Listar contatos
export async function listarContatos() {
  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Erro ao listar:", error)
    return
  }

  const lista = document.getElementById("lista-contatos")
  lista.innerHTML = data.map(c => `
    <li>
      <strong>${c.nome}</strong> - ${c.email}<br/>
      ${c.mensagem}
    </li>
  `).join("")
}