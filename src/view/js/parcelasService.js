// parcelasService.js
// Responsável por gerenciar parcelas e despesas recorrentes
import { financas, salvarDados } from './dataService.js';
import { obterProximoMes } from './dateService.js';
import { atualizarPlanejamento } from './reportService.js';
import { mostrarNotificacao } from './notificationService.js';

export function processarParcelasFuturas() {
    const despesasParceladas = financas.planejamento.despesas.filter(despesa => despesa.ehParcelada);
    
    despesasParceladas.forEach(despesa => {
        if (despesa.parcelaAtual <= despesa.numParcelas) {
            // Processar próxima parcela automaticamente quando necessário
            console.log(`Processando parcela ${despesa.parcelaAtual}/${despesa.numParcelas} de ${despesa.descricao}`);
        }
    });
}

export async function avancarParcela(despesaId) {
    const despesa = financas.planejamento.despesas.find(d => d.id === despesaId);
    
    if (!despesa || !despesa.ehParcelada) {
        mostrarNotificacao('Erro', 'Despesa não encontrada ou não é parcelada', 'error');
        return;
    }
    
    if (despesa.parcelaAtual >= despesa.numParcelas) {
        mostrarNotificacao('Info', 'Esta despesa já foi finalizada', 'warning');
        return;
    }
    
    // Criar despesa no mês atual
    const novaDespesaRealizada = {
        id: Date.now(),
        descricao: `${despesa.descricao} (${despesa.parcelaAtual}/${despesa.numParcelas})`,
        categoria: despesa.categoria,
        valor: despesa.valor,
        data: new Date().toISOString().split('T')[0],
        origemParcela: despesaId
    };
    
    financas.despesas.push(novaDespesaRealizada);
    
    // Avançar parcela
    despesa.parcelaAtual++;
    
    if (despesa.parcelaAtual <= despesa.numParcelas) {
        // Criar próxima parcela no planejamento
        criarDespesaProximoMes(despesa);
        mostrarNotificacao('Sucesso', `Parcela ${despesa.parcelaAtual - 1} realizada. Próxima parcela criada.`, 'success');
    } else {
        mostrarNotificacao('Sucesso', 'Última parcela realizada. Despesa finalizada!', 'success');
    }
    
    await salvarDados();
    atualizarPlanejamento();
}

function criarDespesaProximoMes(despesaBase) {
    const { mes, ano } = obterProximoMes();
    
    // Verificar se já existe uma despesa para o próximo mês
    const jaExiste = financas.planejamento.despesas.some(d => 
        d.origemParcela === despesaBase.id && d.mesReferencia === mes && d.anoReferencia === ano
    );
    
    if (!jaExiste && despesaBase.parcelaAtual <= despesaBase.numParcelas) {
        const novaDespesa = {
            ...despesaBase,
            id: Date.now() + Math.random(), // Garantir ID único
            mesReferencia: mes,
            anoReferencia: ano
        };
        
        financas.planejamento.despesas.push(novaDespesa);
    }
}
