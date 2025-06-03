// Preload.js - Expõe APIs específicas do Electron para o processo de renderização
const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs selecionadas para o processo de renderização
contextBridge.exposeInMainWorld('electronAPI', {
  // Métodos para dados financeiros
  salvarDados: (dados) => ipcRenderer.invoke('salvar-dados', dados),
  carregarDados: () => ipcRenderer.invoke('carregar-dados'),
  exportarCSV: (dados) => ipcRenderer.invoke('exportar-csv', dados),
  
  // Métodos para configurações
  salvarConfiguracoes: (config) => ipcRenderer.invoke('salvar-configuracoes', config),
  carregarConfiguracoes: () => ipcRenderer.invoke('carregar-configuracoes'),
  
  // Métodos para backup
  criarBackup: () => ipcRenderer.invoke('criar-backup'),
  
  // ========== NOVOS MÉTODOS PARA AUTENTICAÇÃO ==========
  
  // Autenticação segura
  salvarAuthToken: (token) => ipcRenderer.invoke('salvar-auth-token', token),
  carregarAuthToken: () => ipcRenderer.invoke('carregar-auth-token'),
  limparAuthData: () => ipcRenderer.invoke('limpar-auth-data'),
  
  // Requisições HTTP autenticadas
  fazerRequisicaoHTTP: (opcoes) => ipcRenderer.invoke('fazer-requisicao-http', opcoes),
  
  // ========== MÉTODOS UTILITÁRIOS ==========
  
  // Informações da aplicação
  obterInfoApp: () => ipcRenderer.invoke('obter-info-app'),
  abrirDiretorioDados: () => ipcRenderer.invoke('abrir-diretorio-dados'),
  reiniciarApp: () => ipcRenderer.invoke('reiniciar-app'),
  
  // Debug (apenas desenvolvimento)
  logDebug: (nivel, mensagem, dados) => ipcRenderer.invoke('log-debug', nivel, mensagem, dados)
});

console.log('Preload.js carregado com sucesso - Sistema de autenticação integrado');
