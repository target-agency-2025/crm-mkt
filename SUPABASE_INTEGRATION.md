# Integração do Supabase no CRM Marketing

Este documento explica como integrar o Supabase no seu projeto CRM para persistência de dados externa.

## 1. Configuração Inicial

### Arquivo supabaseClient.js
O arquivo `supabaseClient.js` já foi criado na raiz do projeto com a configuração básica:

```javascript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://SEU-PROJETO.supabase.co"
const SUPABASE_ANON_KEY = "SUA_CHAVE_ANON"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### Configuração Necessária
1. Acesse o [Supabase Dashboard](https://app.supabase.io/)
2. Crie um novo projeto
3. Substitua `SEU-PROJETO` pela URL do seu projeto
4. Substitua `SUA_CHAVE_ANON` pela chave anônima do seu projeto

## 2. Exemplo de Uso

### Importando o Cliente
```javascript
import { supabase } from './supabaseClient'
```

### Salvando Dados
```javascript
// Exemplo de inserir dados
async function salvarContato(nome, email, mensagem) {
  const { data, error } = await supabase
    .from('contatos')
    .insert([{ nome, email, mensagem }])

  if (error) {
    console.error("Erro ao salvar:", error)
  } else {
    console.log("Contato salvo:", data)
  }
}
```

### Buscando Dados
```javascript
// Exemplo de buscar dados
async function buscarContatos() {
  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Erro ao buscar:", error)
  } else {
    console.log("Contatos:", data)
  }
  
  return { data, error }
}
```

### Atualizando Dados
```javascript
// Exemplo de atualizar dados
async function atualizarContato(id, updates) {
  const { data, error } = await supabase
    .from('contatos')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error("Erro ao atualizar:", error)
  } else {
    console.log("Contato atualizado:", data)
  }
}
```

### Deletando Dados
```javascript
// Exemplo de deletar dados
async function deletarContato(id) {
  const { data, error } = await supabase
    .from('contatos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error("Erro ao deletar:", error)
  } else {
    console.log("Contato deletado:", data)
  }
}
```

## 3. Estrutura de Tabelas Recomendadas

### Tabela: contatos
```sql
CREATE TABLE contatos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  mensagem TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: clientes_supabase
```sql
CREATE TABLE clientes_supabase (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(50),
  empresa VARCHAR(255),
  valor_mensal DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 4. Componentes de Exemplo

Veja o componente `SupabaseExample.jsx` na pasta `src/components` para um exemplo completo de uso.

## 5. Segurança

- Use sempre a chave anônima para operações públicas
- Para operações restritas, implemente autenticação
- Configure as políticas de segurança no dashboard do Supabase
- Nunca exponha chaves secretas no frontend

## 6. Próximos Passos

1. Configure seu projeto Supabase
2. Crie as tabelas necessárias
3. Teste a integração com o componente de exemplo
4. Integre com os componentes existentes do CRM conforme necessário