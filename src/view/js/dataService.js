// dataService.js
// Responsável por gerenciar a persistência de dados financeiros via IPC
export let financas = {
    receitas: [],
    despesas: [],
    planejamento: { receitas: [], despesas: [] }
};

export async function carregarDados() {
    try {
        const resultado = await window.electronAPI.carregarDados();

        if (resultado.success) {
            financas = resultado.dados;
            if (!financas.receitas) financas.receitas = [];
            if (!financas.despesas) financas.despesas = [];
            if (!financas.planejamento) financas.planejamento = { receitas: [], despesas: [] };
            if (!financas.planejamento.receitas) financas.planejamento.receitas = [];
            if (!financas.planejamento.despesas) financas.planejamento.despesas = [];
        } else {
            console.error('Erro ao carregar dados:', resultado.error);
            alert(`Erro ao carregar dados: ${resultado.error}`);
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert(`Erro ao carregar dados: ${error.message || error}`);
    }
}

export async function salvarDados() {
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
