// configurationService.js
// Responsável por gerenciar configurações do sistema
export let configuracoes = {
    tema: 'light',
    moeda: 'BRL',
    notificacoes: true,
    autoBackup: false
};

export function initConfiguracoes() {
    const btnConfiguracoes = document.getElementById('btn-configuracoes');
    const btnBackup = document.getElementById('btn-backup');
    const btnToggleTheme = document.getElementById('btn-toggle-theme');
    const modal = document.getElementById('modal-configuracoes');
    const closeModal = document.querySelector('.close');
    const configForm = document.getElementById('config-form');

    // Abrir modal de configurações
    btnConfiguracoes.addEventListener('click', () => {
        preencherFormularioConfig();
        modal.style.display = 'block';
    });

    // Fechar modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Salvar configurações
    configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Desabilita o botão temporariamente para evitar duplo clique
        const submitBtn = configForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';
        
        try {
            configuracoes.tema = document.getElementById('config-tema').value;
            configuracoes.moeda = document.getElementById('config-moeda').value;
            configuracoes.notificacoes = document.getElementById('config-notificacoes').checked;
            configuracoes.autoBackup = document.getElementById('config-auto-backup').checked;
            
            await salvarConfiguracoes();
            aplicarTema();
            modal.style.display = 'none';
            
            // Atualizar relatório com nova configuração de moeda
            atualizarRelatorio();
            atualizarPlanejamento();
            
            console.log('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            alert('Erro ao salvar configurações. Por favor, tente novamente.');
        } finally {
            // Reabilita o botão
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // Toggle rápido de tema
    btnToggleTheme.addEventListener('click', async () => {
        configuracoes.tema = configuracoes.tema === 'light' ? 'dark' : 'light';
        await salvarConfiguracoes();
        aplicarTema();
        atualizarIconeTema();
    });

    // Criar backup
    btnBackup.addEventListener('click', async () => {
        try {
            const resultado = await window.electronAPI.criarBackup();
            if (resultado.success) {
                alert('Backup criado com sucesso!');
            } else {
                alert('Erro ao criar backup: ' + (resultado.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            alert('Erro ao criar backup. Verifique o console para mais detalhes.');
        }
    });
}

export async function carregarConfiguracoes() {
    try {
        const resultado = await window.electronAPI.carregarConfiguracoes();
        if (resultado.success) {
            configuracoes = { ...configuracoes, ...resultado.dados };
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

export async function salvarConfiguracoes() {
    try {
        const resultado = await window.electronAPI.salvarConfiguracoes(configuracoes);
        if (resultado.success) {
            console.log('Configurações salvas com sucesso');
        }
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
    }
}

export function aplicarTema() {
    document.documentElement.setAttribute('data-theme', configuracoes.tema);
    atualizarIconeTema();
}

export function atualizarIconeTema() {
    const btnToggleTheme = document.getElementById('btn-toggle-theme');
    if (btnToggleTheme) {
        const icon = btnToggleTheme.querySelector('i');
        if (icon) {
            if (configuracoes.tema === 'dark') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    }
}

export function formatarMoeda(valor) {
    const simbolos = {
        BRL: 'R$',
        USD: '$',
        EUR: '€'
    };
    
    const simbolo = simbolos[configuracoes.moeda] || 'R$';
    return `${simbolo} ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
