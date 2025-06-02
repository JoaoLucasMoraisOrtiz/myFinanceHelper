# MyAdmFinance - Sistema de Cuidado Pessoal Financeiro

Um aplicativo desktop para controle financeiro pessoal, desenvolvido com Electron.js.

## Funcionalidades

### Implementadas
- Relatório do Mês Passado
  - Registro de receitas (ganhos)
  - Registro de despesas (gastos) com categorização
  - Visualização de relatório com saldo total
  - Listagem de receitas e despesas
  - Exclusão de itens
  - Armazenamento persistente de dados

- Planejamento do Próximo Mês
  - Registro de receitas previstas
  - Registro de despesas previstas com categorização
  - Suporte para despesas parceladas
  - Sugestões de alocação de recursos (25% investimento, 45% gastos necessários, 10% prazeres, 15% conforto, 5% reserva de emergência)
  - Visualização do planejamento financeiro

### Próximas Etapas
- Visualização gráfica (gráficos de barra, pizza, etc.)
- Exportação para CSV
- Comparação entre planejado vs. realizado
- Melhorias na interface e experiência do usuário

## Como usar

1. Clone este repositório
2. Instale as dependências: `npm install`
3. Execute o aplicativo: `npm start`

## Estrutura do Projeto

```
myAdmFinance/
├── data/                  # Armazenamento persistente
├── src/
│   ├── controller/        # Controladores (lógica de negócio)
│   ├── model/             # Modelos e gerenciamento de dados
│   └── view/              # Interface do usuário
│       ├── css/           # Estilos CSS
│       ├── js/            # JavaScript da interface
│       └── pages/         # Páginas HTML
├── index.js               # Ponto de entrada da aplicação (Electron)
├── preload.js             # Script de pré-carregamento do Electron
├── AVALIACAO.md           # Avaliação detalhada do sistema
└── package.json           # Configurações do projeto
```

## Requisitos

- Node.js
- npm ou yarn
- Electron

## Licença

ISC

## Autor

João L. M. Ortiz
