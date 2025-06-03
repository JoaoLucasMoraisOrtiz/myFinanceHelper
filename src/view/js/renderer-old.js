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
import { initTabs } from './uiManager.js';
import { mostrarNotificacao } from './notificationService.js';

console.log('Renderer.js carregado.');

// Verificar se Chart.js está disponível
if (typeof Chart === 'undefined') {
    console.error('Chart.js não está carregado!');
    alert('Erro: Chart.js não foi carregado corretamente. Algumas funcionalidades de gráficos podem não funcionar.');
}

// Funções auxiliares para filtros de data
function obterMesAnoAtual() {
    const agora = new Date();
    return {
        mes: agora.getMonth(),
        ano: agora.getFullYear()
    };
}

function filtrarPorMesAtual(itens, campoData = 'data') {
    const { mes, ano } = obterMesAnoAtual();
    return itens.filter(item => {
        if (!item[campoData]) return false;
        const dataItem = new Date(item[campoData]);
        return dataItem.getMonth() === mes && dataItem.getFullYear() === ano;
    });
}

function obterProximoMes() {
    const agora = new Date();
    const proximoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
    return {
        mes: proximoMes.getMonth(),
        ano: proximoMes.getFullYear()
    };
}

// DOM elementos
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando carregamento da aplicação...');
    
    try {
        // Carrega os dados existentes
        await carregarDados();
        console.log('Dados carregados com sucesso');
        
        await carregarConfiguracoes();
        console.log('Configurações carregadas com sucesso');
        
        // Inicializa a navegação por abas
        initTabs();
        
        // Inicializa formulários
        initForms();
        
        // Inicializa funcionalidades extras
        initExportacao();
        initConfiguracoes();
        initSincronizacaoDados();
        initCollapsibleForms();
        
        // Inicializa o planejamento
        initPlanejamento();
        
        // Define a data padrão para os campos de data como hoje
        const dataHoje = new Date().toISOString().split('T')[0];
        const receitaData = document.getElementById('receita-data');
        const despesaData = document.getElementById('despesa-data');
        
        if (receitaData) receitaData.value = dataHoje;
        if (despesaData) despesaData.value = dataHoje;
        
        // Atualiza o relatório inicialmente
        atualizarRelatorio();
        atualizarPlanejamento();
        
        // Aplica o tema
        aplicarTema();
        
        console.log('Aplicação carregada com sucesso!');
    } catch (error) {
        console.error('Erro durante a inicialização:', error);
    }
});

// Funções de inicialização
function initTabs() {
    const tabLinks = document.querySelectorAll('.tab-navigation li');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabLinks.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove a classe active de todas as abas
            tabLinks.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Adiciona a classe active à aba clicada
            tab.classList.add('active');
            
            // Mostra o conteúdo correspondente
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function initForms() {
    // Formulário de Receitas
    const receitaForm = document.getElementById('receita-form');
    receitaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Desabilita o botão temporariamente para evitar duplo clique
        const submitBtn = receitaForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';
        
        try {
            const receita = {
                id: Date.now(), // ID único baseado no timestamp
                descricao: document.getElementById('receita-descricao').value,
                valor: parseFloat(document.getElementById('receita-valor').value),
                data: document.getElementById('receita-data').value
            };
            
            financas.receitas.push(receita);
            
            await salvarDados();
            
            // Limpa o formulário
            receitaForm.reset();
            document.getElementById('receita-data').value = new Date().toISOString().split('T')[0];
            
            // Atualiza o relatório
            atualizarRelatorio();
            
            console.log('Receita adicionada com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar receita:', error);
            alert('Erro ao salvar receita. Por favor, tente novamente.');
        } finally {
            // Reabilita o botão
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
    
    // Formulário de Despesas
    const despesaForm = document.getElementById('despesa-form');
    despesaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Desabilita o botão temporariamente para evitar duplo clique
        const submitBtn = despesaForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';
        
        try {
            const despesa = {
                id: Date.now(), // ID único baseado no timestamp
                descricao: document.getElementById('despesa-descricao').value,
                categoria: document.getElementById('despesa-categoria').value,
                valor: parseFloat(document.getElementById('despesa-valor').value),
                data: document.getElementById('despesa-data').value
            };
            
            financas.despesas.push(despesa);
            
            await salvarDados();
            
            // Limpa o formulário
            despesaForm.reset();
            document.getElementById('despesa-data').value = new Date().toISOString().split('T')[0];
            
            // Atualiza o relatório
            atualizarRelatorio();
            
            console.log('Despesa adicionada com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar despesa:', error);
            alert('Erro ao salvar despesa. Por favor, tente novamente.');
        } finally {
            // Reabilita o botão
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Inicializar planejamento
function initPlanejamento() {
    // Toggle para mostrar/esconder campos de parcelas
    const selectParcela = document.getElementById('previsao-despesa-parcela');
    const parcelasContainer = document.getElementById('parcelas-container');
    
    selectParcela.addEventListener('change', function() {
        if (this.value === 'sim') {
            parcelasContainer.style.display = 'block';
        } else {
            parcelasContainer.style.display = 'none';
        }
    });
    
    // Formulário de Receitas Previstas
    const previsaoReceitaForm = document.getElementById('previsao-receita-form');
    previsaoReceitaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Desabilita o botão temporariamente para evitar duplo clique
        const submitBtn = previsaoReceitaForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';
        
        try {
            const receita = {
                id: Date.now(),
                descricao: document.getElementById('previsao-receita-descricao').value,
                valor: parseFloat(document.getElementById('previsao-receita-valor').value)
            };
            
            financas.planejamento.receitas.push(receita);
            
            await salvarDados();
            previsaoReceitaForm.reset();
            atualizarPlanejamento();
            console.log('Receita prevista adicionada com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar receita prevista:', error);
            alert('Erro ao salvar receita prevista. Por favor, tente novamente.');
        } finally {
            // Reabilita o botão
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
    
    // Formulário de Despesas Previstas
    const previsaoDespesaForm = document.getElementById('previsao-despesa-form');
    previsaoDespesaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Desabilita o botão temporariamente para evitar duplo clique
        const submitBtn = previsaoDespesaForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';
        
        try {
            const valorTotal = parseFloat(document.getElementById('previsao-despesa-valor').value);
            const parcelada = document.getElementById('previsao-despesa-parcela').value === 'sim';
            
            const despesa = {
                id: Date.now(),
                descricao: document.getElementById('previsao-despesa-descricao').value,
                categoria: document.getElementById('previsao-despesa-categoria').value,
                valorTotal: valorTotal, // Valor total da despesa
                valor: valorTotal, // Por padrão, valor mensal é igual ao total
                parcelada: parcelada
            };
            
            if (despesa.parcelada) {
                despesa.numParcelas = parseInt(document.getElementById('previsao-despesa-num-parcelas').value);
                despesa.parcelaAtual = parseInt(document.getElementById('previsao-despesa-parcela-atual').value);
                despesa.taxaJuros = parseFloat(document.getElementById('previsao-despesa-juros').value) / 100; // Converte % para decimal
                
                // Calcula o valor da parcela mensal considerando juros
                if (despesa.taxaJuros > 0) {
                    // Fórmula para cálculo de parcela com juros compostos
                    const factor = Math.pow(1 + despesa.taxaJuros, despesa.numParcelas);
                    despesa.valor = (valorTotal * despesa.taxaJuros * factor) / (factor - 1);
                } else {
                    // Sem juros, apenas divide o valor total
                    despesa.valor = valorTotal / despesa.numParcelas;
                }
            }
            
            financas.planejamento.despesas.push(despesa);
            
            await salvarDados();
            previsaoDespesaForm.reset();
            document.getElementById('parcelas-container').style.display = 'none';
            atualizarPlanejamento();
            console.log('Despesa prevista adicionada com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar despesa prevista:', error);
            alert('Erro ao salvar despesa prevista. Por favor, tente novamente.');
        } finally {
            // Reabilita o botão
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Funções de atualização do relatório
function atualizarRelatorio() {
    try {
        atualizarResumo();
        atualizarListaReceitas();
        atualizarListaDespesas();
        
        // Só atualiza gráficos se Chart.js estiver disponível
        if (typeof Chart !== 'undefined') {
            atualizarGraficos();
        }
    } catch (error) {
        console.error('Erro ao atualizar relatório:', error);
    }
}

function atualizarResumo() {
    // Verificação de segurança para evitar erros quando os dados ainda não foram carregados
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
        saldoElement.style.color = '#e74c3c'; // Vermelho para negativo
    } else if (saldo > 0) {
        saldoElement.style.color = '#2ecc71'; // Verde para positivo
    } else {
        saldoElement.style.color = '#333'; // Cor padrão para zero
    }
}

function atualizarListaReceitas() {
    const listaReceitas = document.getElementById('lista-receitas');
    
    // Limpa a lista atual
    listaReceitas.innerHTML = '';
    
    // Verificação de segurança
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
            const id = parseInt(btn.getAttribute('data-id'));
            excluirItem('receita', id);
        });
    });
}

function atualizarListaDespesas() {
    const listaDespesas = document.getElementById('lista-despesas');
    
    // Limpa a lista atual
    listaDespesas.innerHTML = '';
    
    // Verificação de segurança
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
            const id = parseInt(btn.getAttribute('data-id'));
            excluirItem('despesa', id);
        });
    });
}

// Atualizar o planejamento
function atualizarPlanejamento() {
    atualizarResumoPlanejamento();
    atualizarDistribuicaoSugerida();
    atualizarListaReceitasPrevistas();
    atualizarListaDespesasPrevistas();
    atualizarListaParcelasFinalizadas();
    
    // Atualizar gráficos do planejamento se Chart.js estiver disponível
    if (typeof Chart !== 'undefined') {
        atualizarGraficosPlano();
    }
}

function atualizarResumoPlanejamento() {
    // Verificações de segurança
    const planejamento = financas.planejamento || { receitas: [], despesas: [] };
    const receitasPrevistas = planejamento.receitas || [];
    const despesasPrevistas = planejamento.despesas || [];
    
    const totalReceitasPrevistas = receitasPrevistas.reduce((total, receita) => total + receita.valor, 0);
    // Considera apenas despesas não finalizadas
    const totalDespesasPrevistas = despesasPrevistas
        .filter(despesa => !despesa.finalizada)
        .reduce((total, despesa) => total + despesa.valor, 0);
    const saldoPrevisto = totalReceitasPrevistas - totalDespesasPrevistas;
    
    document.getElementById('total-receitas-previstas').textContent = formatarMoeda(totalReceitasPrevistas);
    document.getElementById('total-despesas-previstas').textContent = formatarMoeda(totalDespesasPrevistas);
    
    const saldoElement = document.getElementById('saldo-previsto');
    saldoElement.textContent = formatarMoeda(saldoPrevisto);
    
    // Muda a cor do saldo conforme o valor
    if (saldoPrevisto < 0) {
        saldoElement.style.color = '#e74c3c'; // Vermelho para negativo
    } else if (saldoPrevisto > 0) {
        saldoElement.style.color = '#2ecc71'; // Verde para positivo
    } else {
        saldoElement.style.color = '#333'; // Cor padrão para zero
    }
}

function atualizarDistribuicaoSugerida() {
    // Verificação de segurança
    const planejamento = financas.planejamento || { receitas: [] };
    const receitasPrevistas = planejamento.receitas || [];
    
    const totalReceitasPrevistas = receitasPrevistas.reduce((total, receita) => total + receita.valor, 0);
    
    // Calcula valores sugeridos (total 100%)
    const valorInvestimento = totalReceitasPrevistas * 0.25;
    const valorNecessarios = totalReceitasPrevistas * 0.45;
    const valorPrazeres = totalReceitasPrevistas * 0.1;
    const valorConforto = totalReceitasPrevistas * 0.15;
    const valorEmergencia = totalReceitasPrevistas * 0.05;
    
    // Atualiza os valores na interface
    document.getElementById('valor-investimento').textContent = formatarMoeda(valorInvestimento);
    document.getElementById('valor-necessarios').textContent = formatarMoeda(valorNecessarios);
    document.getElementById('valor-prazeres').textContent = formatarMoeda(valorPrazeres);
    document.getElementById('valor-conforto').textContent = formatarMoeda(valorConforto);
    document.getElementById('valor-emergencia').textContent = formatarMoeda(valorEmergencia);
}

function atualizarListaReceitasPrevistas() {
    const listaReceitasPrevistas = document.getElementById('lista-receitas-previstas');
    
    // Limpa a lista atual
    listaReceitasPrevistas.innerHTML = '';
    
    // Verificação de segurança
    const planejamento = financas.planejamento || { receitas: [] };
    const receitasPrevistas = planejamento.receitas || [];
    
    if (receitasPrevistas.length === 0) {
        listaReceitasPrevistas.innerHTML = '<li class="lista-vazia">Nenhuma receita prevista registrada</li>';
        return;
    }
    
    // Adiciona cada receita prevista à lista
    receitasPrevistas.forEach(receita => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="item-descricao">${receita.descricao}</div>
            <div class="item-valor">${formatarMoeda(receita.valor)}</div>
            <div class="item-acoes">
                <button class="btn-excluir" data-id="${receita.id}" data-tipo="receita-prevista">Excluir</button>
            </div>
        `;
        listaReceitasPrevistas.appendChild(li);
    });
    
    // Adiciona eventos para os botões de excluir
    document.querySelectorAll('.btn-excluir[data-tipo="receita-prevista"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            excluirItemPlanejamento('receita', id);
        });
    });
}

function atualizarListaDespesasPrevistas() {
    const listaDespesasPrevistas = document.getElementById('lista-despesas-previstas');
    
    // Limpa a lista atual
    listaDespesasPrevistas.innerHTML = '';
    
    // Verificação de segurança
    const planejamento = financas.planejamento || { despesas: [] };
    const despesasPrevistas = planejamento.despesas || [];
    
    if (despesasPrevistas.length === 0) {
        listaDespesasPrevistas.innerHTML = '<li class="lista-vazia">Nenhuma despesa prevista registrada</li>';
        return;
    }
    
    // Adiciona cada despesa prevista à lista
    despesasPrevistas.forEach(despesa => {
        // Pula despesas finalizadas (todas as parcelas pagas)
        if (despesa.finalizada) return;
        
        let infoExtra = '';
        let valorExibir = despesa.valor;
        
        if (despesa.parcelada) {
            let infoJuros = '';
            if (despesa.taxaJuros && despesa.taxaJuros > 0) {
                infoJuros = ` - Juros: ${(despesa.taxaJuros * 100).toFixed(2)}% a.m.`;
            }
            infoExtra = ` (Parcela ${despesa.parcelaAtual} de ${despesa.numParcelas} - Total: ${formatarMoeda(despesa.valorTotal)}${infoJuros})`;
            // Para despesas parceladas, exibe o valor mensal
            valorExibir = despesa.valor;
        }
        
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="item-descricao">${despesa.descricao}${infoExtra}</div>
            <div class="item-categoria">${traduzirCategoria(despesa.categoria)}</div>
            <div class="item-valor">${formatarMoeda(valorExibir)}/mês</div>
            <div class="item-acoes">
                ${despesa.parcelada && despesa.parcelaAtual < despesa.numParcelas ? 
                    `<button class="btn-avancar" data-id="${despesa.id}">Próxima Parcela</button>` : ''}
                <button class="btn-excluir" data-id="${despesa.id}" data-tipo="despesa-prevista">Excluir</button>
            </div>
        `;
        listaDespesasPrevistas.appendChild(li);
    });
    
    // Adiciona eventos para os botões de excluir
    document.querySelectorAll('.btn-excluir[data-tipo="despesa-prevista"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            excluirItemPlanejamento('despesa', id);
        });
    });
    
    // Adiciona eventos para os botões de avançar parcela
    document.querySelectorAll('.btn-avancar').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            avancarParcela(id);
        });
    });
}

function atualizarListaParcelasFinalizadas() {
    const listaParcelasFinalizadas = document.getElementById('lista-parcelas-finalizadas');
    
    // Limpa a lista atual
    listaParcelasFinalizadas.innerHTML = '';
    
    // Verificação de segurança
    const planejamento = financas.planejamento || { despesas: [] };
    const despesasPrevistas = planejamento.despesas || [];
    
    // Filtra despesas finalizadas
    const despesasFinalizadas = despesasPrevistas.filter(despesa => despesa.finalizada);
    
    if (despesasFinalizadas.length === 0) {
        listaParcelasFinalizadas.innerHTML = '<li class="lista-vazia">Nenhuma parcela finalizada</li>';
        return;
    }
    
    // Adiciona cada despesa finalizada à lista
    despesasFinalizadas.forEach(despesa => {
        let valorTotal = despesa.valorTotal || (despesa.valor * despesa.numParcelas);
        
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="item-descricao">${despesa.descricao} (FINALIZADA)</div>
            <div class="item-categoria">${traduzirCategoria(despesa.categoria)}</div>
            <div class="item-valor">Total pago: ${formatarMoeda(valorTotal)}</div>
            <div class="item-acoes">
                <button class="btn-excluir" data-id="${despesa.id}" data-tipo="despesa-prevista">Remover</button>
            </div>
        `;
        li.style.opacity = '0.7'; // Visual diferenciado para itens finalizados
        listaParcelasFinalizadas.appendChild(li);
    });
    
    // Adiciona eventos para os botões de remover
    document.querySelectorAll('#lista-parcelas-finalizadas .btn-excluir').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            excluirItemPlanejamento('despesa', id);
        });
    });
}

function excluirItemPlanejamento(tipo, id) {
    if (confirm(`Tem certeza que deseja excluir este item do planejamento?`)) {
        // Verificação de segurança
        if (!financas.planejamento) {
            financas.planejamento = { receitas: [], despesas: [] };
        }
        
        if (tipo === 'receita') {
            if (!financas.planejamento.receitas) financas.planejamento.receitas = [];
            financas.planejamento.receitas = financas.planejamento.receitas.filter(item => item.id !== id);
        } else if (tipo === 'despesa') {
            if (!financas.planejamento.despesas) financas.planejamento.despesas = [];
            financas.planejamento.despesas = financas.planejamento.despesas.filter(item => item.id !== id);
        }
        
        salvarDados().then(() => {
            atualizarPlanejamento();
        });
    }
}

// Funções para gerenciamento de parcelas
function processarParcelasFuturas() {
    let alteracoes = false;
    
    financas.planejamento.despesas.forEach(despesa => {
        if (despesa.parcelada && despesa.parcelaAtual < despesa.numParcelas) {
            // Função para simular avanço de mês - pode ser chamada manualmente ou automaticamente
            // Por ora, deixamos como função auxiliar para futuras implementações
        }
    });
    
    if (alteracoes) {
        salvarDados().then(() => {
            atualizarPlanejamento();
        });
    }
}

function avancarParcela(despesaId) {
    // Verificação de segurança
    const planejamento = financas.planejamento || { despesas: [] };
    const despesasPrevistas = planejamento.despesas || [];
    
    const despesa = despesasPrevistas.find(d => d.id === despesaId);
    if (despesa && despesa.parcelada && despesa.parcelaAtual < despesa.numParcelas) {
        // Confirma o avanço da parcela
        if (confirm(`Avançar para a parcela ${despesa.parcelaAtual + 1} de ${despesa.numParcelas}?`)) {
            despesa.parcelaAtual++;
            
            // Se chegou na última parcela, marca como finalizada
            if (despesa.parcelaAtual === despesa.numParcelas) {
                despesa.finalizada = true;
                alert(`Todas as parcelas de "${despesa.descricao}" foram processadas!`);
            } else {
                alert(`Parcela avançada! Agora na parcela ${despesa.parcelaAtual} de ${despesa.numParcelas}.`);
            }
            
            salvarDados().then(() => {
                atualizarPlanejamento();
            });
        }
    }
}

function criarDespesaProximoMes(despesaBase) {
    if (!despesaBase.parcelada || despesaBase.parcelaAtual >= despesaBase.numParcelas) {
        return null;
    }
    
    return {
        ...despesaBase,
        id: Date.now() + Math.random(), // Novo ID único
        parcelaAtual: despesaBase.parcelaAtual + 1
    };
}

// Funcionalidades de configuração
async function carregarConfiguracoes() {
    try {
        const resultado = await window.electronAPI.carregarConfiguracoes();
        if (resultado.success) {
            configuracoes = resultado.config;
            console.log('Configurações carregadas:', configuracoes);
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

async function salvarConfiguracoes() {
    try {
        const resultado = await window.electronAPI.salvarConfiguracoes(configuracoes);
        if (resultado.success) {
            console.log('Configurações salvas com sucesso');
        }
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
    }
}

function initConfiguracoes() {
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

function preencherFormularioConfig() {
    document.getElementById('config-tema').value = configuracoes.tema;
    document.getElementById('config-moeda').value = configuracoes.moeda;
    document.getElementById('config-notificacoes').checked = configuracoes.notificacoes;
    document.getElementById('config-auto-backup').checked = configuracoes.autoBackup;
}

function aplicarTema() {
    document.documentElement.setAttribute('data-theme', configuracoes.tema);
    atualizarIconeTema();
}

function atualizarIconeTema() {
    const btnToggleTheme = document.getElementById('btn-toggle-theme');
    if (btnToggleTheme) {
        const icon = btnToggleTheme.querySelector('i');
        if (icon) {
            // Remove classes existentes
            icon.className = '';
            // Adiciona a classe correta baseada no tema
            if (configuracoes.tema === 'light') {
                icon.className = 'fas fa-moon';
                btnToggleTheme.title = 'Modo Escuro';
            } else {
                icon.className = 'fas fa-sun';
                btnToggleTheme.title = 'Modo Claro';
            }
        }
    }
}

function formatarMoeda(valor) {
    const simbolos = {
        BRL: 'R$',
        USD: '$',
        EUR: '€'
    };
    
    const simbolo = simbolos[configuracoes.moeda] || 'R$';
    return `${simbolo} ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Função para formatar datas
function formatarData(data) {
    if (!data) return '';
    
    // Se a data já está no formato brasileiro, retorna como está
    if (data.includes('/')) {
        return data;
    }
    
    // Converte de YYYY-MM-DD para DD/MM/YYYY
    const partes = data.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    
    return data;
}

// Função para notificações (implementação futura)
function mostrarNotificacao(titulo, mensagem) {
    if (configuracoes.notificacoes && 'Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(titulo, { body: mensagem });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(titulo, { body: mensagem });
                }
            });
        }
    }
}

// Auto backup (desabilitado temporariamente para evitar problemas de performance)
// setInterval(async () => {
//     if (configuracoes.autoBackup) {
//         try {
//             await window.electronAPI.criarBackup();
//             console.log('Backup automático criado');
//         } catch (error) {
//             console.error('Erro no backup automático:', error);
//         }
//     }
// }, 30 * 60 * 1000); // A cada 30 minutos

// Persistência de dados usando IPC
async function salvarDados() {
    try {
        const resultado = await window.electronAPI.salvarDados(financas);
        if (!resultado.success) {
            console.error('Erro ao salvar dados:', resultado.error);
            alert(`Erro ao salvar dados: ${resultado.error}`);
        }
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        alert(`Erro ao salvar dados: ${error.message || error}`);
    }
}

async function carregarDados() {
    try {
        const resultado = await window.electronAPI.carregarDados();
        if (resultado.success) {
            financas = resultado.dados;
            
            // Garante que todas as propriedades existam
            if (!financas.receitas) financas.receitas = [];
            if (!financas.despesas) financas.despesas = [];
            if (!financas.planejamento) financas.planejamento = { receitas: [], despesas: [] };
            if (!financas.planejamento.receitas) financas.planejamento.receitas = [];
            if (!financas.planejamento.despesas) financas.planejamento.despesas = [];
            
            console.log('Dados carregados com sucesso');
        } else {
            console.error('Erro ao carregar dados:', resultado.error);
            alert(`Erro ao carregar dados: ${resultado.error}`);
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert(`Erro ao carregar dados: ${error.message || error}`);
    }
}

// Atualiza as funções que modificam os dados para salvar automaticamente
function excluirItem(tipo, id) {
    if (confirm(`Tem certeza que deseja excluir este item?`)) {
        // Verificação de segurança
        if (!financas.receitas) financas.receitas = [];
        if (!financas.despesas) financas.despesas = [];
        
        if (tipo === 'receita') {
            financas.receitas = financas.receitas.filter(item => item.id !== id);
        } else if (tipo === 'despesa') {
            financas.despesas = financas.despesas.filter(item => item.id !== id);
        }
        
        salvarDados().then(() => {
            atualizarRelatorio();
        });
    }
}

// Variáveis para armazenar instâncias dos gráficos
let graficoCategoriasInstance = null;
let graficoComparativoInstance = null;
let graficoReceitasPrevistasInstance = null;
let graficoPlanejadoRealizadoInstance = null;

function atualizarGraficos() {
    // Verificar se Chart.js está disponível antes de tentar criar gráficos
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js não está carregado. Pulando atualização de gráficos.');
        return;
    }
    
    try {
        atualizarGraficoCategorias();
        atualizarGraficoComparativo();
        atualizarGraficosPlano();
    } catch (error) {
        console.error('Erro ao atualizar gráficos:', error);
    }
}

function atualizarGraficoCategorias() {
    if (typeof Chart === 'undefined') {
        return;
    }
    
    const despesas = financas.despesas || [];
    
    // Se não há despesas, não criar gráfico
    if (despesas.length === 0) {
        return;
    }
    
    // Agrupa despesas por categoria
    const categorias = {};
    let totalGeral = 0;
    
    despesas.forEach(despesa => {
        if (despesa.categoria && despesa.valor) {
            if (categorias[despesa.categoria]) {
                categorias[despesa.categoria] += despesa.valor;
            } else {
                categorias[despesa.categoria] = despesa.valor;
            }
            totalGeral += despesa.valor;
        }
    });
    
    const labels = Object.keys(categorias).map(cat => traduzirCategoria(cat));
    const dados = Object.values(categorias);
    
    if (labels.length === 0 || totalGeral === 0) {
        return;
    }
    
    const cores = [
        '#3498db', // Azul principal
        '#e74c3c', // Vermelho
        '#2ecc71', // Verde
        '#f39c12', // Laranja
        '#9b59b6', // Roxo
        '#1abc9c', // Turquesa
        '#34495e', // Azul escuro
        '#e67e22'  // Laranja escuro
    ];
    
    // Verificar se o elemento existe
    const canvasElement = document.getElementById('grafico-categorias');
    if (!canvasElement) {
        console.warn('Elemento grafico-categorias não encontrado');
        return;
    }
    
    try {
        // Destroi o gráfico anterior se existir
        if (window.graficoCategoriasInstance) {
            window.graficoCategoriasInstance.destroy();
        }
        
        const ctx = canvasElement.getContext('2d');
        window.graficoCategoriasInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dados,
                    backgroundColor: cores.slice(0, labels.length),
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 4,
                    hoverBorderColor: '#333333'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1,
                cutout: '60%', // Aumenta o "buraco" central para melhor legibilidade
                plugins: {
                    legend: {
                        position: 'right',
                        align: 'center',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 13,
                                weight: '500'
                            },
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const value = data.datasets[0].data[i];
                                        const percentage = ((value / totalGeral) * 100).toFixed(1);
                                        return {
                                            text: `${label}: ${percentage}%`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            strokeStyle: data.datasets[0].backgroundColor[i],
                                            pointStyle: 'circle',
                                            hidden: isNaN(data.datasets[0].data[i]) || chart.getDatasetMeta(0).data[i].hidden,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'var(--accent-color)',
                        borderWidth: 2,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const percentage = ((value / totalGeral) * 100).toFixed(1);
                                return `${context.label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 20
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1200,
                    easing: 'easeOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Erro ao criar gráfico de categorias:', error);
    }
}

function atualizarGraficoComparativo() {
    if (typeof Chart === 'undefined') {
        return;
    }
    
    const receitas = financas.receitas || [];
    const despesas = financas.despesas || [];
    
    const totalReceitas = receitas.reduce((total, receita) => total + (receita.valor || 0), 0);
    const totalDespesas = despesas.reduce((total, despesa) => total + (despesa.valor || 0), 0);
    
    // Verificar se o elemento existe
    const canvasElement = document.getElementById('grafico-comparativo');
    if (!canvasElement) {
        console.warn('Elemento grafico-comparativo não encontrado');
        return;
    }
    
    try {
        // Destroi o gráfico anterior se existir
        if (window.graficoComparativoInstance) {
            window.graficoComparativoInstance.destroy();
        }
        
        const ctx = canvasElement.getContext('2d');
        
        // Calcular o saldo para criar contexto visual
        const saldo = totalReceitas - totalDespesas;
        const saldoColor = saldo >= 0 ? '#2ecc71' : '#e74c3c';
        
        window.graficoComparativoInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Receitas', 'Despesas', 'Saldo'],
                datasets: [{
                    label: 'Valor (R$)',
                    data: [totalReceitas, totalDespesas, Math.abs(saldo)],
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.8)', // Verde para receitas
                        'rgba(231, 76, 60, 0.8)',  // Vermelho para despesas
                        saldo >= 0 ? 'rgba(46, 204, 113, 0.6)' : 'rgba(231, 76, 60, 0.6)' // Cor do saldo
                    ],
                    borderColor: [
                        '#2ecc71',
                        '#e74c3c',
                        saldoColor
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.5,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            lineWidth: 1
                        },
                        ticks: {
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            color: 'var(--text-primary)',
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                });
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 13,
                                weight: '600'
                            },
                            color: 'var(--text-secondary)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'var(--accent-color)',
                        borderWidth: 2,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                if (context.label === 'Saldo') {
                                    const saldoPrefix = saldo >= 0 ? '+' : '-';
                                    return `${saldoPrefix} R$ ${Math.abs(saldo).toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}`;
                                }
                                return `R$ ${context.parsed.y.toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}`;
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 15,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Erro ao criar gráfico comparativo:', error);
    }
}

function atualizarGraficosPlano() {
    if (typeof Chart === 'undefined') {
        return;
    }
    
    try {
        atualizarGraficoReceitasPrevistas();
        atualizarGraficoPlanejadoRealizado();
    } catch (error) {
        console.error('Erro ao atualizar gráficos do planejamento:', error);
    }
}

function atualizarGraficoReceitasPrevistas() {
    if (typeof Chart === 'undefined') {
        return;
    }
    
    const planejamento = financas.planejamento || { receitas: [], despesas: [] };
    const receitasPrevistas = planejamento.receitas || [];
    
    // Se não há receitas previstas, não criar gráfico
    if (receitasPrevistas.length === 0) {
        return;
    }
    
    // Agrupa receitas por tipo/categoria
    const tiposReceita = {};
    receitasPrevistas.forEach(receita => {
        if (receita.descricao && receita.valor) {
            // Categoriza por tipo de receita baseado na descrição
            let tipo = categorizarReceita(receita.descricao);
            if (tiposReceita[tipo]) {
                tiposReceita[tipo] += receita.valor;
            } else {
                tiposReceita[tipo] = receita.valor;
            }
        }
    });
    
    const labels = Object.keys(tiposReceita);
    const dados = Object.values(tiposReceita);
    
    if (labels.length === 0) {
        return;
    }
    
    const cores = [
        '#2ecc71', '#3498db', '#9b59b6', '#f39c12', 
        '#e74c3c', '#1abc9c', '#34495e', '#e67e22'
    ];
    
    // Verificar se o elemento existe
    const canvasElement = document.getElementById('grafico-receitas-previstas');
    if (!canvasElement) {
        console.warn('Elemento grafico-receitas-previstas não encontrado');
        return;
    }
    
    try {
        // Destroi o gráfico anterior se existir
        if (window.graficoReceitasPrevistasInstance) {
            window.graficoReceitasPrevistasInstance.destroy();
        }
        
        const ctx = canvasElement.getContext('2d');
        window.graficoReceitasPrevistasInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dados,
                    backgroundColor: cores.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': R$ ' + context.parsed.toFixed(2);
                            }
                        }
                    }
                },
                layout: {
                    padding: 10
                }
            }
        });
    } catch (error) {
        console.error('Erro ao criar gráfico de receitas previstas:', error);
    }
}

function atualizarGraficoPlanejadoRealizado() {
    if (typeof Chart === 'undefined') {
        return;
    }
    
    const planejamento = financas.planejamento || { receitas: [], despesas: [] };
    const receitasPrevistas = planejamento.receitas || [];
    const despesasPrevistas = planejamento.despesas || [];
    const receitasReais = financas.receitas || [];
    const despesasReais = financas.despesas || [];
    
    // Total de receitas previstas para o próximo mês
    const totalReceitasPrevistas = receitasPrevistas.reduce((total, receita) => total + (receita.valor || 0), 0);
    
    // Para despesas previstas, considera apenas o valor mensal das parcelas
    const totalDespesasPrevistas = despesasPrevistas.reduce((total, despesa) => {
        if (despesa.numParcelas && despesa.numParcelas > 1) {
            // Para despesas parceladas, considera apenas o valor da parcela atual
            const valorParcela = despesa.juros > 0 ? 
                calcularParcelaComJuros(despesa.valor, despesa.numParcelas, despesa.juros) : 
                despesa.valor / despesa.numParcelas;
            return total + valorParcela;
        }
        return total + (despesa.valor || 0);
    }, 0);
    
    // Para valores reais, considera apenas o mês atual
    const receitasDoMesAtual = filtrarPorMesAtual(receitasReais);
    const despesasDoMesAtual = filtrarPorMesAtual(despesasReais);
    
    const totalReceitasReais = receitasDoMesAtual.reduce((total, receita) => total + (receita.valor || 0), 0);
    const totalDespesasReais = despesasDoMesAtual.reduce((total, despesa) => total + (despesa.valor || 0), 0);
    
    // Verificar se o elemento existe
    const canvasElement = document.getElementById('grafico-planejado-realizado');
    if (!canvasElement) {
        console.warn('Elemento grafico-planejado-realizado não encontrado');
        return;
    }
    
    try {
        // Destroi o gráfico anterior se existir
        if (window.graficoPlanejadoRealizadoInstance) {
            window.graficoPlanejadoRealizadoInstance.destroy();
        }
        
        const ctx = canvasElement.getContext('2d');
        window.graficoPlanejadoRealizadoInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Receitas', 'Despesas'],
                datasets: [
                    {
                        label: 'Planejado',
                        data: [totalReceitasPrevistas, totalDespesasPrevistas],
                        backgroundColor: ['#3498db', '#e67e22'],
                        borderColor: ['#2980b9', '#d35400'],
                        borderWidth: 2
                    },
                    {
                        label: 'Realizado',
                        data: [totalReceitasReais, totalDespesasReais],
                        backgroundColor: ['#2ecc71', '#e74c3c'],
                        borderColor: ['#27ae60', '#c0392b'],
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.5,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': R$ ' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                layout: {
                    padding: 10
                }
            }
        });
    } catch (error) {
        console.error('Erro ao criar gráfico planejado vs realizado:', error);
    }
}

function categorizarReceita(descricao) {
    const desc = descricao.toLowerCase();
    
    if (desc.includes('salario') || desc.includes('salário') || desc.includes('emprego') || desc.includes('trabalho')) {
        return 'Salário';
    } else if (desc.includes('freelance') || desc.includes('extra') || desc.includes('bico') || desc.includes('consultoria')) {
        return 'Trabalho Extra';
    } else if (desc.includes('investimento') || desc.includes('dividendo') || desc.includes('renda') || desc.includes('juros')) {
        return 'Investimentos';
    } else if (desc.includes('aluguel') || desc.includes('imóvel') || desc.includes('imovel')) {
        return 'Aluguéis';
    } else if (desc.includes('venda') || desc.includes('produto') || desc.includes('serviço') || desc.includes('servico')) {
        return 'Vendas/Serviços';
    } else if (desc.includes('pensão') || desc.includes('pensao') || desc.includes('aposentadoria') || desc.includes('benefício') || desc.includes('beneficio')) {
        return 'Benefícios';
    } else {
        return 'Outros';
    }
}

// Futuramente: Implementar funções para armazenamento persistente e análises
// function salvarDados() { ... }
// function carregarDados() { ... }

function initExportacao() {
    const btnExportarCSV = document.getElementById('btn-exportar-csv');
    
    btnExportarCSV.addEventListener('click', async () => {
        try {
            const dadosCSV = gerarCSV();
            const resultado = await window.electronAPI.exportarCSV(dadosCSV);
            
            if (resultado.success) {
                alert('Dados exportados com sucesso!');
            } else if (!resultado.canceled) {
                alert(`Erro ao exportar: ${resultado.error}`);
            }
        } catch (error) {
            console.error('Erro na exportação:', error);
            alert('Erro ao exportar dados. Verifique o console para mais detalhes.');
        }
    });
}

function gerarCSV() {
    const receitas = financas.receitas || [];
    const despesas = financas.despesas || [];
    
    let csv = 'Tipo,Descrição,Categoria,Valor,Data\n';
    
    // Adiciona receitas
    receitas.forEach(receita => {
        csv += `Receita,"${receita.descricao}",,"${receita.valor.toFixed(2)}","${receita.data}"\n`;
    });
    
    // Adiciona despesas
    despesas.forEach(despesa => {
        csv += `Despesa,"${despesa.descricao}","${traduzirCategoria(despesa.categoria)}","${despesa.valor.toFixed(2)}","${despesa.data}"\n`;
    });
    
    return csv;
}

// Função para traduzir categorias
function traduzirCategoria(categoria) {
    const traducoes = {
        'moradia': 'Moradia',
        'alimentacao': 'Alimentação',
        'transporte': 'Transporte',
        'lazer': 'Lazer',
        'saude': 'Saúde',
        'educacao': 'Educação',
        'dividas': 'Dívidas',
        'outros': 'Outros'
    };
    
    return traducoes[categoria] || categoria;
}

// Função para inicializar formulários colapsáveis
function initCollapsibleForms() {
    // Seleciona todos os cabeçalhos de formulários colapsáveis
    const formHeaders = document.querySelectorAll('.form-header[data-toggle]');
    
    formHeaders.forEach(header => {
        // Adiciona acessibilidade
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'button');
        header.setAttribute('aria-expanded', 'false');
        
        const targetId = header.getAttribute('data-toggle');
        const content = document.getElementById(targetId);
        const icon = header.querySelector('.toggle-icon');
        
        if (!content || !icon) return;
        
        // Função para alternar expansão
        const toggleExpansion = () => {
            const isExpanded = header.getAttribute('data-expanded') === 'true';
            
            // Atualiza estados
            header.setAttribute('data-expanded', !isExpanded);
            header.setAttribute('aria-expanded', !isExpanded);
            
            // Anima o conteúdo
            if (!isExpanded) {
                content.classList.remove('collapsed');
                icon.style.transform = 'rotate(180deg)';
            } else {
                content.classList.add('collapsed');
                icon.style.transform = 'rotate(0deg)';
            }
        };
        
        // Event listeners
        header.addEventListener('click', toggleExpansion);
        
        // Suporte a teclado (Enter e Space)
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleExpansion();
            }
        });
        
        // Inicia com formulários colapsados
        content.classList.add('collapsed');
        header.setAttribute('data-expanded', 'false');
        icon.style.transform = 'rotate(0deg)';
    });
}

// Função para inicializar a sincronização de dados
function initSincronizacaoDados() {
    const btnSyncData = document.getElementById('btn-sync-data');
    const modalSyncData = document.getElementById('modal-sync-data');
    const closeSyncModal = document.getElementById('close-sync-modal');
    const syncForm = document.getElementById('sync-form');
    const btnTestConnection = document.getElementById('btn-test-connection');
    const syncStatus = document.getElementById('sync-status');

    // Abrir modal de sincronização
    btnSyncData.addEventListener('click', () => {
        // Pré-preencher com URL salva se existir
        const savedUrl = localStorage.getItem('api-url');
        if (savedUrl) {
            document.getElementById('api-url').value = savedUrl;
        }
        modalSyncData.style.display = 'block';
        syncStatus.style.display = 'none';
    });

    // Fechar modal
    closeSyncModal.addEventListener('click', () => {
        modalSyncData.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modalSyncData) {
            modalSyncData.style.display = 'none';
        }
    });

    // Testar conexão com a API
    btnTestConnection.addEventListener('click', async () => {
        const apiUrl = document.getElementById('api-url').value.trim();
        
        if (!apiUrl) {
            mostrarStatusSync('error', 'Por favor, insira uma URL válida.');
            return;
        }

        mostrarStatusSync('loading', 'Testando conexão...');
        
        try {
            const response = await fetch(apiUrl, {
                method: 'HEAD',
                mode: 'cors'
            });

            if (response.ok) {
                mostrarStatusSync('success', 'Conexão bem-sucedida! A API está acessível.');
            } else {
                mostrarStatusSync('error', `Erro na conexão: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            console.error('Erro ao testar conexão:', error);
            mostrarStatusSync('error', `Erro de conexão: ${error.message}. Verifique se a URL está correta e se a API suporta CORS.`);
        }
    });

    // Sincronizar dados
    syncForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const apiUrl = document.getElementById('api-url').value.trim();
        const mergeData = document.getElementById('merge-data').checked;
        
        if (!apiUrl) {
            mostrarStatusSync('error', 'Por favor, insira uma URL válida.');
            return;
        }

        mostrarStatusSync('loading', 'Baixando dados financeiros...');
        
        try {
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const dadosFinanceiros = await response.json();
            
            // Validar estrutura dos dados
            if (!validarEstruturaDados(dadosFinanceiros)) {
                throw new Error('Estrutura de dados inválida. O arquivo deve conter as propriedades: receitas, despesas, receitasPrevistas, despesasPrevistas.');
            }

            // Salvar URL para uso futuro
            localStorage.setItem('api-url', apiUrl);

            // Processar dados
            await processarDadosSincronizados(dadosFinanceiros, mergeData);
            
            mostrarStatusSync('success', `Dados sincronizados com sucesso! ${mergeData ? 'Mesclados' : 'Substituídos'} com dados da API.`);
            
            // Atualizar interface
            setTimeout(() => {
                atualizarRelatorio();
                atualizarPlanejamento();
                modalSyncData.style.display = 'none';
            }, 2000);

        } catch (error) {
            console.error('Erro ao sincronizar dados:', error);
            mostrarStatusSync('error', `Erro na sincronização: ${error.message}`);
        }
    });
}

// Função para mostrar status da sincronização
function mostrarStatusSync(tipo, mensagem) {
    const syncStatus = document.getElementById('sync-status');
    const icones = {
        loading: 'fas fa-spinner fa-spin',
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle'
    };

    syncStatus.className = `sync-status ${tipo}`;
    syncStatus.innerHTML = `<i class="${icones[tipo]}"></i>${mensagem}`;
    syncStatus.style.display = 'block';
}

// Função para validar estrutura dos dados
function validarEstruturaDados(dados) {
    return dados && 
           typeof dados === 'object' &&
           Array.isArray(dados.receitas) &&
           Array.isArray(dados.despesas) &&
           Array.isArray(dados.receitasPrevistas) &&
           Array.isArray(dados.despesasPrevistas);
}

// Função para processar dados sincronizados
async function processarDadosSincronizados(dadosNovos, mesclar) {
    try {
        if (mesclar) {
            // Mesclar com dados existentes
            receitas.push(...dadosNovos.receitas);
            despesas.push(...dadosNovos.despesas);
            receitasPrevistas.push(...dadosNovos.receitasPrevistas);
            despesasPrevistas.push(...dadosNovos.despesasPrevistas);
        } else {
            // Substituir dados existentes
            receitas.length = 0;
            despesas.length = 0;
            receitasPrevistas.length = 0;
            despesasPrevistas.length = 0;
            
            receitas.push(...dadosNovos.receitas);
            despesas.push(...dadosNovos.despesas);
            receitasPrevistas.push(...dadosNovos.receitasPrevistas);
            despesasPrevistas.push(...dadosNovos.despesasPrevistas);
        }

        // Salvar dados atualizados
        await salvarDados();
        
        console.log('Dados sincronizados com sucesso:', {
            receitas: receitas.length,
            despesas: despesas.length,
            receitasPrevistas: receitasPrevistas.length,
            despesasPrevistas: despesasPrevistas.length
        });

    } catch (error) {
        console.error('Erro ao processar dados sincronizados:', error);
        throw error;
    }
}
