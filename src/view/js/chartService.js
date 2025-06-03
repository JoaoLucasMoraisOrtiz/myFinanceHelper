// chartService.js
// Responsável por gerenciar todos os gráficos da aplicação
import { financas } from './dataService.js';
import { formatarMoeda } from './configurationService.js';
import { filtrarPorMesAtual, traduzirCategoria } from './utils.js';

// Variáveis para armazenar instâncias dos gráficos
let graficoCategoriasInstance = null;
let graficoComparativoInstance = null;
let graficoReceitasPrevistasInstance = null;
let graficoPlanejadoRealizadoInstance = null;

export function atualizarGraficos() {
    // Verificar se Chart.js está disponível antes de tentar criar gráficos
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js não está carregado. Pulando atualização de gráficos.');
        return;
    }
    
    try {
        atualizarGraficoCategorias();
        atualizarGraficoComparativo();
    } catch (error) {
        console.error('Erro ao atualizar gráficos:', error);
    }
}

export function atualizarGraficosPlano() {
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
            categorias[despesa.categoria] = (categorias[despesa.categoria] || 0) + despesa.valor;
            totalGeral += despesa.valor;
        }
    });
    
    const labels = Object.keys(categorias).map(cat => traduzirCategoria(cat));
    const dados = Object.values(categorias);
    
    if (labels.length === 0 || totalGeral === 0) {
        return;
    }
    
    const cores = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
        '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
    ];
    
    // Verificar se o elemento existe
    const canvasElement = document.getElementById('grafico-categorias');
    if (!canvasElement) {
        console.warn('Elemento grafico-categorias não encontrado');
        return;
    }
    
    try {
        // Destroi o gráfico anterior se existir
        if (graficoCategoriasInstance) {
            graficoCategoriasInstance.destroy();
        }
        
        const ctx = canvasElement.getContext('2d');
        graficoCategoriasInstance = new Chart(ctx, {
            type: 'pie',
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
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const valor = context.parsed;
                                const percentual = ((valor / totalGeral) * 100).toFixed(1);
                                return `${context.label}: ${formatarMoeda(valor)} (${percentual}%)`;
                            }
                        }
                    }
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
        if (graficoComparativoInstance) {
            graficoComparativoInstance.destroy();
        }
        
        const ctx = canvasElement.getContext('2d');
        graficoComparativoInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Receitas', 'Despesas'],
                datasets: [{
                    label: 'Valor',
                    data: [totalReceitas, totalDespesas],
                    backgroundColor: ['#2ecc71', '#e74c3c'],
                    borderColor: ['#27ae60', '#c0392b'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${formatarMoeda(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatarMoeda(value);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao criar gráfico comparativo:', error);
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
        const tipo = receita.categoria || 'Outros';
        tiposReceita[tipo] = (tiposReceita[tipo] || 0) + receita.valor;
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
        if (graficoReceitasPrevistasInstance) {
            graficoReceitasPrevistasInstance.destroy();
        }
        
        const ctx = canvasElement.getContext('2d');
        graficoReceitasPrevistasInstance = new Chart(ctx, {
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
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${formatarMoeda(context.parsed)}`;
                            }
                        }
                    }
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
        if (despesa.finalizada) return total;
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
        if (graficoPlanejadoRealizadoInstance) {
            graficoPlanejadoRealizadoInstance.destroy();
        }
        
        const ctx = canvasElement.getContext('2d');
        graficoPlanejadoRealizadoInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Receitas', 'Despesas'],
                datasets: [
                    {
                        label: 'Planejado (Próx. Mês)',
                        data: [totalReceitasPrevistas, totalDespesasPrevistas],
                        backgroundColor: ['#3498db', '#e67e22'],
                        borderColor: ['#2980b9', '#d35400'],
                        borderWidth: 2
                    },
                    {
                        label: 'Realizado (Mês Atual)',
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
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatarMoeda(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatarMoeda(value);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao criar gráfico planejado vs realizado:', error);
    }
}
