# Sistema de Merge Inteligente de Dados

## Visão Geral

O sistema de merge inteligente foi implementado para sincronizar dados financeiros entre a API e os dados locais, evitando duplicatas e mantendo a integridade dos dados.

## Funcionamento

### Critérios de Identificação Única

Um registro é considerado **único** baseado na combinação de três campos:
- **Descrição** (normalizada: minúscula e sem espaços extras)
- **Categoria** (normalizada: minúscula e sem espaços extras)  
- **Data** (formato exato)

### Chave Única
```javascript
chave = "descrição|categoria|data"
// Exemplo: "salário|receita fixa|2025-06-01"
```

## Funcionalidades

### 1. Sincronização Inteligente (`Sync Data`)
- **O que faz**: Busca dados da API e mescla com dados locais
- **Como funciona**:
  - Carrega dados da API autenticada
  - Compara cada item da API com dados locais usando a chave única
  - Adiciona apenas itens que não existem localmente
  - Mantém todos os dados locais existentes
- **Resultado**: União de dados sem duplicatas

### 2. Análise de Duplicatas (`Analyze Duplicates`)
- **O que faz**: Analisa dados locais em busca de duplicatas
- **Como funciona**:
  - Examina todos os arrays de dados (receitas, despesas, planejamento)
  - Conta quantos itens têm a mesma chave única
  - Apresenta relatório detalhado
- **Resultado**: Estatísticas de duplicatas encontradas

### 3. Remoção de Duplicatas (`Remove Duplicates`)
- **O que faz**: Remove duplicatas dos dados locais
- **Como funciona**:
  - Para cada grupo de itens duplicados, mantém apenas o primeiro
  - Remove os demais da lista
  - Preserva itens com dados incompletos para edição posterior
- **Resultado**: Dados locais limpos sem duplicatas

## Exemplos de Uso

### Exemplo 1: Sincronização sem Duplicatas
```
Dados Locais:
- "Salário" | "Receita Fixa" | "2025-06-01" | R$ 5000

Dados da API:
- "Salário" | "Receita Fixa" | "2025-06-01" | R$ 5000  ← DUPLICATA (ignorada)
- "Freelance" | "Receita Extra" | "2025-06-02" | R$ 1000  ← NOVO (adicionado)

Resultado:
- Mantém: "Salário" original
- Adiciona: "Freelance" 
- Total: 2 registros únicos
```

### Exemplo 2: Análise de Duplicatas
```
Análise encontrou:
📊 Receitas: 10 total, 2 duplicatas
💸 Despesas: 15 total, 3 duplicatas  
📈 Planejamento Receitas: 5 total, 0 duplicatas
📉 Planejamento Despesas: 8 total, 1 duplicata

🔍 Total: 6 duplicatas encontradas
```

### Exemplo 3: Remoção de Duplicatas
```
Antes:
- Item A (original)
- Item A (duplicata 1) ← REMOVIDA
- Item A (duplicata 2) ← REMOVIDA
- Item B (único)

Depois:
- Item A (original)
- Item B (único)
```

## Segurança e Integridade

### Validações Implementadas:
- ✅ **Chaves vazias**: Itens com descrição/categoria/data vazios são preservados
- ✅ **IDs únicos**: Novos itens recebem IDs únicos baseados em timestamp
- ✅ **Backup recomendado**: Sistema sugere backup antes de remoções
- ✅ **Confirmação**: Operações destrutivas requerem confirmação do usuário
- ✅ **Logs**: Todas as operações são logadas para auditoria

### Tratamento de Casos Especiais:
- **Dados incompletos**: Mantidos para edição posterior
- **Falhas de rede**: Não corrompem dados locais
- **Estruturas inválidas**: Validadas antes do processamento
- **Arrays vazios**: Tratados graciosamente

## Interface de Usuário

### Botões Disponíveis:
1. **🔄 Sync Data** - Sincronização inteligente com API
2. **🔍 Analyze Duplicates** - Análise de duplicatas locais  
3. **🧹 Remove Duplicates** - Limpeza de duplicatas locais

### Notificações:
- **Info**: Operações bem-sucedidas e estatísticas
- **Warning**: Duplicatas encontradas
- **Error**: Falhas e erros de validação
- **Success**: Operações de limpeza concluídas

## Fluxo Recomendado

1. **Backup**: Sempre criar backup antes de operações importantes
2. **Análise**: Usar "Analyze Duplicates" para ver o estado atual
3. **Limpeza** (opcional): Usar "Remove Duplicates" se necessário
4. **Sincronização**: Usar "Sync Data" para buscar novos dados da API
5. **Verificação**: Usar "Analyze Duplicates" novamente para confirmar

## Arquivos Modificados

- `syncService.js`: Lógica principal de merge e deduplicação
- `index.html`: Novos botões na interface
- `style.css`: Estilos para os novos botões
- `renderer.js`: Inicialização dos novos componentes

## Benefícios

- 🚫 **Zero Duplicatas**: Sistema garante dados únicos
- 🔄 **Sincronização Inteligente**: Preserva dados locais importantes
- 📊 **Visibilidade**: Relatórios detalhados de duplicatas
- 🛡️ **Segurança**: Validações e confirmações de segurança
- 🎯 **Performance**: Algoritmos otimizados com Map/Set
- 🧹 **Manutenção**: Ferramentas de limpeza integradas
