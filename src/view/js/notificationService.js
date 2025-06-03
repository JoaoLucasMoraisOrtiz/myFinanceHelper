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
    return new Promise((resolve) => {
        const {
            tipo = 'confirmacao',
            textoBotaoConfirmar = 'Confirmar',
            textoBotaoCancelar = 'Cancelar',
            mostrarCancelar = true
        } = opcoes;
        
        // Criar overlay do modal
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const buttonsHtml = mostrarCancelar 
            ? `<button class="btn btn-secondary" data-action="cancel">${textoBotaoCancelar}</button>
               <button class="btn btn-primary" data-action="confirm">${textoBotaoConfirmar}</button>`
            : `<button class="btn btn-primary" data-action="confirm">${textoBotaoConfirmar}</button>`;
        
        overlay.innerHTML = `
            <div class="modal-dialog">
                <h3>${titulo}</h3>
                <p>${mensagem}</p>
                <div class="modal-actions">
                    ${buttonsHtml}
                </div>
            </div>
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(overlay);
        
        // Mostrar modal com animação
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);
        
        // Gerenciar cliques nos botões
        overlay.addEventListener('click', (e) => {
            if (e.target.closest('[data-action]')) {
                const action = e.target.closest('[data-action]').dataset.action;
                closeModal(overlay);
                resolve(action === 'confirm');
            } else if (e.target === overlay) {
                // Clique fora do modal
                closeModal(overlay);
                resolve(false);
            }
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

function closeModal(overlay) {
    overlay.classList.remove('show');
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
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
    return mostrarModal(titulo, mensagem, {
        textoBotaoConfirmar: 'Sim',
        textoBotaoCancelar: 'Não'
    });
}
