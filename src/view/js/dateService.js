// dateService.js
// Responsável por operações relacionadas a datas
export function obterMesAnoAtual() {
    const agora = new Date();
    return {
        mes: agora.getMonth(),
        ano: agora.getFullYear()
    };
}

export function filtrarPorMesAtual(itens, campoData = 'data') {
    const { mes, ano } = obterMesAnoAtual();
    return itens.filter(item => {
        if (!item[campoData]) return false;
        const dataItem = new Date(item[campoData]);
        return dataItem.getMonth() === mes && dataItem.getFullYear() === ano;
    });
}

export function obterProximoMes() {
    const agora = new Date();
    const proximoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
    return {
        mes: proximoMes.getMonth(),
        ano: proximoMes.getFullYear()
    };
}

export function formatarData(data) {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
}

export function validarDataNaoFutura(data) {
    if (!data) return false;
    
    const dataInput = new Date(data);
    const hoje = new Date();
    
    // Remove as horas para comparar apenas as datas
    hoje.setHours(0, 0, 0, 0);
    dataInput.setHours(0, 0, 0, 0);
    
    return dataInput <= hoje;
}

export function obterDataAtual() {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0]; // Retorna no formato YYYY-MM-DD
}
