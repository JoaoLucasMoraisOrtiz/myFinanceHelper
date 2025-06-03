// authService.js
// Responsável por gerenciar autenticação e tokens de acesso
import { mostrarNotificacao } from './notificationService.js';

const API_BASE_URL = 'https://lightsalmon-alpaca-756067.hostingersite.com/api';
const TOKEN_STORAGE_KEY = 'finance_app_token';
const USER_STORAGE_KEY = 'finance_app_user';

let currentUser = null;
let currentToken = null;
let initApplicationCallback = null;

// Função para definir callback de inicialização
export function setInitApplicationCallback(callback) {
    initApplicationCallback = callback;
}

export function initAuth() {
    // Carregar dados de autenticação salvos
    loadStoredAuth();
    
    // Verificar se o usuário já está logado
    if (currentToken && currentUser) {
        showDashboard();
    } else {
        showLoginScreen();
    }
}

function loadStoredAuth() {
    try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        
        if (storedToken && storedUser) {
            currentToken = storedToken;
            currentUser = JSON.parse(storedUser);
        }
    } catch (error) {
        console.warn('Erro ao carregar dados de autenticação:', error);
        clearStoredAuth();
    }
}

function saveAuth(token, user) {
    currentToken = token;
    currentUser = user;
    
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function clearStoredAuth() {
    currentToken = null;
    currentUser = null;
    
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
}

export async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro na autenticação');
        }

        if (!data.token || !data.user) {
            throw new Error('Resposta inválida do servidor');
        }

        // Salvar dados de autenticação
        saveAuth(data.token, data.user);
        
        mostrarNotificacao('Sucesso', `Bem-vindo(a), ${data.user.name}!`, 'success');
        
        // Mostrar dashboard
        showDashboard();
        
        return { success: true, user: data.user, token: data.token };

    } catch (error) {
        console.error('Erro no login:', error);
        mostrarNotificacao('Erro', error.message, 'error');
        return { success: false, error: error.message };
    }
}

export function logout() {
    clearStoredAuth();
    showLoginScreen();
    mostrarNotificacao('Info', 'Logout realizado com sucesso', 'info');
}

export function getCurrentUser() {
    return currentUser;
}

export function getCurrentToken() {
    return currentToken;
}

export function isAuthenticated() {
    return !!(currentToken && currentUser);
}

export async function syncWithAPI() {
    if (!isAuthenticated()) {
        throw new Error('Usuário não autenticado');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/financas`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            // Token expirado - fazer logout e solicitar novo login
            logout();
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Erro ao sincronizar dados');
        }

        return result.data;

    } catch (error) {
        console.error('Erro na sincronização:', error);
        
        // Se o erro for de autenticação, fazer logout
        if (error.message.includes('401') || error.message.includes('expirada')) {
            logout();
        }
        
        throw error;
    }
}

export function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    const loginButton = document.getElementById('login-button');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                mostrarNotificacao('Erro', 'Por favor, preencha todos os campos', 'error');
                return;
            }
            
            // Mostrar loading
            setLoginLoading(true);
            
            try {
                await login(email, password);
            } finally {
                // Restaurar botão
                setLoginLoading(false);
            }
        });
    }
    
    // Toggle de mostrar/ocultar senha
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('login-password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = togglePassword.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    }
}

function setLoginLoading(loading) {
    const loginButton = document.getElementById('login-btn');
    const btnText = loginButton?.querySelector('.btn-text');
    const btnSpinner = loginButton?.querySelector('.btn-spinner');
    
    if (loginButton && btnText && btnSpinner) {
        loginButton.disabled = loading;
        
        if (loading) {
            btnText.style.display = 'none';
            btnSpinner.style.display = 'inline-block';
        } else {
            btnText.style.display = 'inline-block';
            btnSpinner.style.display = 'none';
        }
    }
}

function showLoginScreen() {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen) loginScreen.style.display = 'flex';
    if (dashboardScreen) dashboardScreen.style.display = 'none';
}

function showDashboard() {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboardScreen) dashboardScreen.style.display = 'block';
    
    // Atualizar nome do usuário
    updateUserDisplay();
    
    // Chamar callback para inicializar aplicação
    if (initApplicationCallback) {
        initApplicationCallback().catch(error => {
            console.error('Erro ao inicializar aplicação:', error);
            mostrarNotificacao('Erro', 'Erro ao carregar dados da aplicação', 'error');
        });
    }
}

function updateUserDisplay() {
    const userNameElement = document.getElementById('user-name');
    
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.name || currentUser.email || 'Usuário';
    }
}

export function initLogoutButton() {
    const logoutButton = document.getElementById('btn-logout');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            logout();
        });
    }
}
