// renderer.js - Arquivo principal da interface do usuário (renderer process)
// Importa todos os serviços modularizados
import { financas, carregarDados, salvarDados } from './dataService.js';
import { carregarConfiguracoes, initConfiguracoes } from './configurationService.js';
import { initForms } from './formService.js';
import { atualizarRelatorio, atualizarPlanejamento } from './reportService.js';
import { atualizarGraficos } from './chartService.js';
import { initExportacao } from './exportService.js';
import { initSincronizacaoDados } from './syncService.js';
import { processarParcelasFuturas, avancarParcela } from './parcelasService.js';
import { initTabs, initCollapsibleForms } from './uiManager.js';
import { mostrarNotificacao, mostrarConfirmacao } from './notificationService.js';
import { initAuth, initLoginForm, initLogoutButton, setInitApplicationCallback } from './authService.js';

console.log('Renderer.js carregado.');

// Verificar se Chart.js está disponível
if (typeof Chart === 'undefined') {
    console.error('Chart.js não está carregado!');
    mostrarNotificacao('Erro', 'Chart.js não foi carregado corretamente. Algumas funcionalidades de gráficos podem não funcionar.', 'warning');
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM carregado. Inicializando aplicação...');
    
    try {
        // Carregar configurações
        await carregarConfiguracoes();
        
        // Configurar callback para inicialização após login
        setInitApplicationCallback(initApplication);
        
        // Inicializar autenticação
        initAuth();
        initLoginForm();
        initLogoutButton();
        
        console.log('Sistema de autenticação inicializado!');
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        mostrarNotificacao('Erro', 'Erro ao carregar a aplicação. Verifique o console para mais detalhes.', 'error');
    }
});

// Função para inicializar a aplicação (só chamada quando autenticado)
export async function initApplication() {
    try {
        await carregarDados();
        
        initTabs();
        initCollapsibleForms(); // Esta é a função essencial para os formulários colapsáveis
        initForms();
        initPlanejamento();
        initConfiguracoes();
        initExportacao();
        initSincronizacaoDados();
        
        atualizarRelatorio();
        atualizarPlanejamento();
        
        // Processar parcelas futuras
        processarParcelasFuturas();
        
    } catch (error) {
        console.error('Erro ao inicializar dados:', error);
        throw error;
    }
}

// Função para inicializar o planejamento
function initPlanejamento() {
    // Lógica específica do planejamento que não foi movida para outros serviços
    console.log('Planejamento inicializado');
}

// Funções globais expostas para uso nos templates HTML
window.excluirItem = async function(tipo, id) {
    const confirmed = await mostrarConfirmacao(
        'Confirmar Exclusão',
        `Tem certeza que deseja excluir esta ${tipo}? Esta ação não pode ser desfeita.`
    );
    
    if (!confirmed) return;
    
    const lista = tipo === 'receita' ? financas.receitas : financas.despesas;
    const index = lista.findIndex(item => item.id === id);
    
    if (index !== -1) {
        lista.splice(index, 1);
        await salvarDados();
        atualizarRelatorio();
        mostrarNotificacao('Sucesso', `${tipo} removida com sucesso!`, 'success');
    }
};

window.excluirItemPlanejamento = async function(tipo, id) {
    const confirmed = await mostrarConfirmacao(
        'Confirmar Exclusão',
        `Tem certeza que deseja excluir esta ${tipo} prevista? Esta ação não pode ser desfeita.`
    );
    
    if (!confirmed) return;
    
    const lista = tipo === 'receita' ? financas.planejamento.receitas : financas.planejamento.despesas;
    const index = lista.findIndex(item => item.id === id);
    
    if (index !== -1) {
        lista.splice(index, 1);
        await salvarDados();
        atualizarPlanejamento();
        mostrarNotificacao('Sucesso', `${tipo} prevista removida com sucesso!`, 'success');
    }
};

window.avancarParcela = avancarParcela;
