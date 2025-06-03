// notificationService.js
// Responsável por gerenciar notificações do sistema

let notificationsContainer = null;

function getNotificationsContainer() {
    if (!notificationsContainer) {
        notificationsContainer = document.createElement('div');
        notificationsContainer.className = 'notifications-container';
        document.body.appendChild(notificationsContainer);
    }
    return notificationsContainer;
}

export function mostrarNotificacao(titulo, mensagem, tipo = 'info') {
    console.log(`[${tipo.toUpperCase()}] ${titulo}: ${mensagem}`);
    
    const container = getNotificationsContainer();
    
    // Criar elemento de notificação visual (toast)
    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    notification.innerHTML = `
        <div class="notification-content">
            <strong>${titulo}</strong>
            <p>${mensagem}</p>
        </div>
        <button class="notification-close" aria-label="Fechar notificação">&times;</button>
    `;
    
    // Adicionar ao container
    container.appendChild(notification);
    
    // Auto-remover após 5 segundos
    const autoRemoveTimeout = setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    // Permitir fechar manualmente
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        clearTimeout(autoRemoveTimeout);
        removeNotification(notification);
    });
}

function removeNotification(notification) {
    if (notification.parentNode) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300); // Tempo da animação
    }
}

export function mostrarModal(titulo, mensagem, opcoes = {}) {
    console.log('🔄 [mostrarModal] Criando modal...');
    console.log('📝 [mostrarModal] Título:', titulo);
    console.log('📝 [mostrarModal] Mensagem:', mensagem);
    console.log('⚙️ [mostrarModal] Opções:', opcoes);
    
    return new Promise((resolve) => {
        const {
            tipo = 'confirmacao',
            textoBotaoConfirmar = 'Confirmar',
            textoBotaoCancelar = 'Cancelar',
            mostrarCancelar = true
        } = opcoes;
        
        console.log('🔘 [mostrarModal] Configuração dos botões:', {
            textoBotaoConfirmar,
            textoBotaoCancelar,
            mostrarCancelar
        });
        

        // Criar overlay (fundo escuro)
        const overlay = document.createElement('div');

        overlay.className = 'modal-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '2000';
        overlay.style.pointerEvents = 'auto';

        // Criar modal (caixa)
        const modal = document.createElement('div');
        modal.className = 'modal-dialog';
        modal.style.position = 'fixed';
        modal.style.left = '50%';
        modal.style.top = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.zIndex = '2101';
        modal.style.background = '#fff';
        modal.style.borderRadius = '8px';
        modal.style.padding = '25px';
        modal.style.maxWidth = '400px';
        modal.style.width = '90%';
        modal.style.textAlign = 'center';
        modal.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
        modal.style.pointerEvents = 'auto';

        const buttonsHtml = mostrarCancelar 
            ? `<button class="btn btn-secondary" data-action="cancel">${textoBotaoCancelar}</button>
               <button class="btn btn-primary" data-action="confirm">${textoBotaoConfirmar}</button>`
            : `<button class="btn btn-primary" data-action="confirm">${textoBotaoConfirmar}</button>`;

        modal.innerHTML = `
            <h3>${titulo}</h3>
            <p>${mensagem}</p>
            <div class="modal-actions">
                ${buttonsHtml}
            </div>
        `;

        // Adicionar overlay antes do modal para garantir ordem correta
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        

        // Adicionar event listeners diretos aos botões para maior confiabilidade
        const buttons = modal.querySelectorAll('[data-action]');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const action = button.dataset.action;
                console.log('🎯 [mostrarModal] Botão clicado diretamente:', action);
                console.log('📝 [mostrarModal] Texto do botão:', button.textContent);
                closeModal(overlay, modal);
                const result = action === 'confirm';
                console.log('✅ [mostrarModal] Resultado (listener direto):', result);
                resolve(result);
            });
        });
        

        // Mostrar modal com animação
        setTimeout(() => {
            overlay.classList.add('show');
            modal.classList.add('show');
        }, 10);

        // Clique no overlay cancela
        overlay.addEventListener('click', () => {
            console.log('❌ [mostrarModal] Clique fora do modal (no overlay), cancelando...');
            closeModal(overlay, modal);
            resolve(false);
        });
        
        // Fechar com ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal(overlay);
                resolve(false);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}


function closeModal(overlay, modal) {
    overlay.classList.remove('show');
    if (modal) modal.classList.remove('show');
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }, 300);
}

// Função de conveniência para alertas simples
export function mostrarAlerta(titulo, mensagem, tipo = 'info') {
    return mostrarModal(titulo, mensagem, {
        mostrarCancelar: false,
        textoBotaoConfirmar: 'OK'
    });
}

// Função de conveniência para confirmações
export function mostrarConfirmacao(titulo, mensagem) {
    console.log('❓ [mostrarConfirmacao] Criando modal de confirmação...');
    console.log('📝 [mostrarConfirmacao] Título:', titulo);
    console.log('📝 [mostrarConfirmacao] Mensagem:', mensagem);
    
    return mostrarModal(titulo, mensagem, {
        textoBotaoConfirmar: 'Sim',
        textoBotaoCancelar: 'Não'
    });
}
