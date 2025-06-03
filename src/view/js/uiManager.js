// uiManager.js
// Responsável por gerenciar a interface do usuário e navegação
import { financas, salvarDados } from './dataService.js';
import { formatarMoeda } from './configurationService.js';
import { formatarData, traduzirCategoria } from './utils.js';

export function initTabs() {
    const tabLinks = document.querySelectorAll('.tab-navigation li');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabLinks.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove classe ativa de todas as abas
            tabLinks.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Adiciona classe ativa à aba clicada
            tab.classList.add('active');
            
            // Mostra o conteúdo correspondente
            const targetTab = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

export function initCollapsibleForms() {
    const formHeaders = document.querySelectorAll('.form-header[data-toggle]');
    
    formHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.getAttribute('data-toggle');
            const targetContent = document.getElementById(targetId);
            const toggleIcon = header.querySelector('.toggle-icon');
            
            if (targetContent) {
                targetContent.classList.toggle('collapsed');
                
                // Atualiza o ícone
                if (targetContent.classList.contains('collapsed')) {
                    toggleIcon.textContent = '▼';
                } else {
                    toggleIcon.textContent = '▲';
                }
            }
        });
    });
}

export function atualizarResumo() {
    const receitas = financas.receitas || [];
    const despesas = financas.despesas || [];
    
    const totalReceitas = receitas.reduce((total, receita) => total + receita.valor, 0);
    const totalDespesas = despesas.reduce((total, despesa) => total + despesa.valor, 0);
    const saldo = totalReceitas - totalDespesas;
    
    document.getElementById('total-receitas').textContent = formatarMoeda(totalReceitas);
    document.getElementById('total-despesas').textContent = formatarMoeda(totalDespesas);
    
    const saldoElement = document.getElementById('saldo-final');
    saldoElement.textContent = formatarMoeda(saldo);
    
    // Muda a cor do saldo conforme o valor
    if (saldo < 0) {
        saldoElement.style.color = '#e74c3c';
    } else if (saldo > 0) {
        saldoElement.style.color = '#2ecc71';
    } else {
        saldoElement.style.color = '#34495e';
    }
}

export function atualizarListaReceitas() {
    const listaReceitas = document.getElementById('lista-receitas');
    
    // Limpa a lista atual
    listaReceitas.innerHTML = '';
    
    const receitas = financas.receitas || [];
    
    if (receitas.length === 0) {
        listaReceitas.innerHTML = '<li class="lista-vazia">Nenhuma receita registrada</li>';
        return;
    }
    
    // Ordena as receitas por data (mais recente primeiro)
    const receitasOrdenadas = [...receitas].sort((a, b) => 
        new Date(b.data) - new Date(a.data)
    );
    
    // Adiciona cada receita à lista
    receitasOrdenadas.forEach(receita => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="item-descricao">${receita.descricao}</div>
            <div class="item-valor">${formatarMoeda(receita.valor)}</div>
            <div class="item-data">${formatarData(receita.data)}</div>
            <div class="item-acoes">
                <button class="btn-excluir" data-id="${receita.id}" data-tipo="receita">Excluir</button>
            </div>
        `;
        listaReceitas.appendChild(li);
    });
    
    // Adiciona eventos para os botões de excluir
    document.querySelectorAll('.btn-excluir[data-tipo="receita"]').forEach(btn => {
        btn.addEventListener('click', () => {
            excluirItem('receita', btn.getAttribute('data-id'));
        });
    });
}

export function atualizarListaDespesas() {
    const listaDespesas = document.getElementById('lista-despesas');
    
    // Limpa a lista atual
    listaDespesas.innerHTML = '';
    
    const despesas = financas.despesas || [];
    
    if (despesas.length === 0) {
        listaDespesas.innerHTML = '<li class="lista-vazia">Nenhuma despesa registrada</li>';
        return;
    }
    
    // Ordena as despesas por data (mais recente primeiro)
    const despesasOrdenadas = [...despesas].sort((a, b) => 
        new Date(b.data) - new Date(a.data)
    );
    
    // Adiciona cada despesa à lista
    despesasOrdenadas.forEach(despesa => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="item-descricao">${despesa.descricao}</div>
            <div class="item-categoria">${traduzirCategoria(despesa.categoria)}</div>
            <div class="item-valor">${formatarMoeda(despesa.valor)}</div>
            <div class="item-data">${formatarData(despesa.data)}</div>
            <div class="item-acoes">
                <button class="btn-excluir" data-id="${despesa.id}" data-tipo="despesa">Excluir</button>
            </div>
        `;
        listaDespesas.appendChild(li);
    });
    
    // Adiciona eventos para os botões de excluir
    document.querySelectorAll('.btn-excluir[data-tipo="despesa"]').forEach(btn => {
        btn.addEventListener('click', () => {
            excluirItem('despesa', btn.getAttribute('data-id'));
        });
    });
}

export function excluirItem(tipo, id) {
    if (confirm(`Tem certeza que deseja excluir este item?`)) {
        if (!financas.receitas) financas.receitas = [];
        if (!financas.despesas) financas.despesas = [];
        
        if (tipo === 'receita') {
            financas.receitas = financas.receitas.filter(item => item.id != id);
        } else if (tipo === 'despesa') {
            financas.despesas = financas.despesas.filter(item => item.id != id);
        }
        
        salvarDados().then(() => {
            atualizarResumo();
            atualizarListaReceitas();
            atualizarListaDespesas();
        });
    }
}

export function adicionarReceita(descricao, valor, data) {
    const novaReceita = {
        id: gerarId(),
        descricao,
        valor: parseFloat(valor),
        data
    };
    
    if (!financas.receitas) financas.receitas = [];
    financas.receitas.push(novaReceita);
    
    return salvarDados();
}

export function adicionarDespesa(descricao, categoria, valor, data) {
    const novaDespesa = {
        id: gerarId(),
        descricao,
        categoria,
        valor: parseFloat(valor),
        data
    };
    
    if (!financas.despesas) financas.despesas = [];
    financas.despesas.push(novaDespesa);
    
    return salvarDados();
}
