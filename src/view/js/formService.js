// formService.js
// Responsável por gerenciar formulários e suas validações
import { financas, salvarDados } from './dataService.js';
import { atualizarRelatorio, atualizarPlanejamento } from './reportService.js';
import { mostrarNotificacao } from './notificationService.js';
import { validarDataNaoFutura, obterDataAtual } from './dateService.js';

export function initForms() {
    configurarDataMaxima();
    initReceitaForm();
    initDespesaForm();
    initPlanejamentoForms();
}

function configurarDataMaxima() {
    const hoje = obterDataAtual();
    
    // Configurar data máxima para receitas
    const receitaDataInput = document.getElementById('receita-data');
    if (receitaDataInput) {
        receitaDataInput.setAttribute('max', hoje);
    }
    
    // Configurar data máxima para despesas
    const despesaDataInput = document.getElementById('despesa-data');
    if (despesaDataInput) {
        despesaDataInput.setAttribute('max', hoje);
    }
}

function initReceitaForm() {
    const receitaForm = document.getElementById('receita-form');
    if (!receitaForm) return;
    
    receitaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const descricao = document.getElementById('receita-descricao').value;
        const valor = parseFloat(document.getElementById('receita-valor').value);
        const data = document.getElementById('receita-data').value;
        
        if (!descricao || !valor || !data) {
            mostrarNotificacao('Erro', 'Por favor, preencha todos os campos.', 'error');
            return;
        }
        
        if (!validarDataNaoFutura(data)) {
            mostrarNotificacao('Erro', 'A data da receita não pode ser posterior a hoje.', 'error');
            return;
        }
        
        const novaReceita = {
            id: Date.now(),
            descricao,
            valor,
            data,
            categoria: categorizarReceita(descricao)
        };
        
        financas.receitas.push(novaReceita);
        await salvarDados();
        atualizarRelatorio();
        receitaForm.reset();
        mostrarNotificacao('Sucesso', 'Receita adicionada com sucesso!', 'success');
    });
}

function initDespesaForm() {
    const despesaForm = document.getElementById('despesa-form');
    if (!despesaForm) return;
    
    despesaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const descricao = document.getElementById('despesa-descricao').value;
        const categoria = document.getElementById('despesa-categoria').value;
        const valor = parseFloat(document.getElementById('despesa-valor').value);
        const data = document.getElementById('despesa-data').value;
        
        if (!descricao || !categoria || !valor || !data) {
            mostrarNotificacao('Erro', 'Por favor, preencha todos os campos.', 'error');
            return;
        }
        
        if (!validarDataNaoFutura(data)) {
            mostrarNotificacao('Erro', 'A data da despesa não pode ser posterior a hoje.', 'error');
            return;
        }
        
        const novaDespesa = {
            id: Date.now(),
            descricao,
            categoria,
            valor,
            data
        };
        
        financas.despesas.push(novaDespesa);
        await salvarDados();
        atualizarRelatorio();
        despesaForm.reset();
        mostrarNotificacao('Sucesso', 'Despesa adicionada com sucesso!', 'success');
    });
}

function initPlanejamentoForms() {
    // Formulário de receitas previstas
    const previsaoReceitaForm = document.getElementById('previsao-receita-form');
    if (previsaoReceitaForm) {
        previsaoReceitaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const descricao = document.getElementById('previsao-receita-descricao').value;
            const valor = parseFloat(document.getElementById('previsao-receita-valor').value);
            
            if (!descricao || !valor) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            
            const novaReceitaPrevista = {
                id: Date.now(),
                descricao,
                valor,
                categoria: categorizarReceita(descricao)
            };
            
            financas.planejamento.receitas.push(novaReceitaPrevista);
            await salvarDados();
            atualizarPlanejamento();
            previsaoReceitaForm.reset();
            mostrarNotificacao('Sucesso', 'Receita prevista adicionada!', 'success');
        });
    }
    
    // Formulário de despesas previstas
    const previsaoDespesaForm = document.getElementById('previsao-despesa-form');
    if (previsaoDespesaForm) {
        // Controle de parcelas
        const parcelaSelect = document.getElementById('previsao-despesa-parcela');
        const parcelasContainer = document.getElementById('parcelas-container');
        
        if (parcelaSelect && parcelasContainer) {
            parcelaSelect.addEventListener('change', (e) => {
                parcelasContainer.style.display = e.target.value === 'sim' ? 'block' : 'none';
            });
        }
        
        previsaoDespesaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const descricao = document.getElementById('previsao-despesa-descricao').value;
            const categoria = document.getElementById('previsao-despesa-categoria').value;
            const valorTotal = parseFloat(document.getElementById('previsao-despesa-valor').value);
            const ehParcelada = document.getElementById('previsao-despesa-parcela').value === 'sim';
            
            if (!descricao || !categoria || !valorTotal) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            let novaDespesaPrevista = {
                id: Date.now(),
                descricao,
                categoria,
                valorTotal,
                valor: valorTotal,
                ehParcelada: false
            };
            
            if (ehParcelada) {
                const numParcelas = parseInt(document.getElementById('previsao-despesa-num-parcelas').value);
                const parcelaAtual = parseInt(document.getElementById('previsao-despesa-parcela-atual').value);
                const juros = parseFloat(document.getElementById('previsao-despesa-juros').value) / 100;
                
                // Calcular valor da parcela com juros (se houver)
                let valorParcela = valorTotal / numParcelas;
                if (juros > 0) {
                    const fatorJuros = Math.pow(1 + juros, numParcelas);
                    valorParcela = (valorTotal * juros * fatorJuros) / (fatorJuros - 1);
                }
                
                novaDespesaPrevista = {
                    ...novaDespesaPrevista,
                    ehParcelada: true,
                    numParcelas,
                    parcelaAtual,
                    juros,
                    valor: valorParcela,
                    parcelasRestantes: numParcelas - parcelaAtual + 1
                };
            }
            
            financas.planejamento.despesas.push(novaDespesaPrevista);
            await salvarDados();
            atualizarPlanejamento();
            previsaoDespesaForm.reset();
            document.getElementById('parcelas-container').style.display = 'none';
            document.getElementById('previsao-despesa-parcela').value = 'nao';
            mostrarNotificacao('Sucesso', 'Despesa prevista adicionada!', 'success');
        });
    }
}

function initCollapsibleForms() {
    const formHeaders = document.querySelectorAll('.form-header[data-toggle]');
    
    formHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.getAttribute('data-toggle');
            const targetElement = document.getElementById(targetId);
            const toggleIcon = header.querySelector('.toggle-icon');
            
            if (targetElement) {
                const isCollapsed = targetElement.classList.contains('collapsed');
                
                if (isCollapsed) {
                    targetElement.classList.remove('collapsed');
                    if (toggleIcon) toggleIcon.textContent = '▲';
                } else {
                    targetElement.classList.add('collapsed');
                    if (toggleIcon) toggleIcon.textContent = '▼';
                }
            }
        });
    });
}

function categorizarReceita(descricao) {
    const desc = descricao.toLowerCase();
    
    if (desc.includes('salario') || desc.includes('salário')) return 'salario';
    if (desc.includes('freelance') || desc.includes('extra')) return 'freelance';
    if (desc.includes('investimento') || desc.includes('dividendo')) return 'investimento';
    if (desc.includes('venda')) return 'venda';
    if (desc.includes('aluguel')) return 'aluguel';
    
    return 'outros';
}
