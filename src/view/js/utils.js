// utils.js
// Funções utilitárias compartilhadas
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

export function traduzirCategoria(categoria) {
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