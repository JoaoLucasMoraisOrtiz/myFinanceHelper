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
  criarBackup: () => ipcRenderer.invoke('criar-backup')
});

console.log('Preload.js carregado com sucesso');
