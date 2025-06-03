// exportService.js
// Responsável por exportar dados para diferentes formatos
import { financas } from './dataService.js';
import { filtrarPorMesAtual, formatarData } from './dateService.js';
import { mostrarNotificacao } from './notificationService.js';

export function initExportacao() {
    const btnExportarCSV = document.getElementById('btn-exportar-csv');
    
    if (btnExportarCSV) {
        btnExportarCSV.addEventListener('click', () => {
            gerarCSV();
        });
    }
}

export function gerarCSV() {
    try {
        const receitasMesAtual = filtrarPorMesAtual(financas.receitas);
        const despesasMesAtual = filtrarPorMesAtual(financas.despesas);
        
        let csvContent = 'Tipo,Descrição,Categoria,Valor,Data\n';
        
        // Adicionar receitas
        receitasMesAtual.forEach(receita => {
            csvContent += `Receita,"${receita.descricao}","${receita.categoria}",${receita.valor},"${formatarData(receita.data)}"\n`;
        });
        
        // Adicionar despesas
        despesasMesAtual.forEach(despesa => {
            csvContent += `Despesa,"${despesa.descricao}","${despesa.categoria}",${despesa.valor},"${formatarData(despesa.data)}"\n`;
        });
        
        // Criar e baixar arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            mostrarNotificacao('Sucesso', 'Relatório CSV exportado com sucesso!');
        } else {
            mostrarNotificacao('Erro', 'Seu navegador não suporta download de arquivos', 'error');
        }
    } catch (error) {
        console.error('Erro ao gerar CSV:', error);
        mostrarNotificacao('Erro', 'Erro ao exportar relatório', 'error');
    }
}
