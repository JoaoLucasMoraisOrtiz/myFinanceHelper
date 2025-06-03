// syncService.js
// Responsável por sincronização de dados com APIs externas
import { financas, salvarDados } from './dataService.js';
import { atualizarRelatorio, atualizarPlanejamento } from './reportService.js';
import { mostrarNotificacao, mostrarConfirmacao } from './notificationService.js';
import { getCurrentToken, isAuthenticated, syncWithAPI, logout } from './authService.js';

export function initSincronizacaoDados() {
    const btnSyncData = document.getElementById('btn-sync-data');
    const btnSaveToCloud = document.getElementById('btn-save-to-cloud');
    const btnAnalyzeDuplicates = document.getElementById('btn-analyze-duplicates');
    const btnRemoveDuplicates = document.getElementById('btn-remove-duplicates');
    
    if (btnSyncData) {
        btnSyncData.addEventListener('click', async () => {
            if (!isAuthenticated()) {
                mostrarNotificacao('Erro', 'Você precisa estar logado para sincronizar dados', 'error');
                return;
            }
            
            const confirmacao = await mostrarConfirmacao(
                'Sincronizar Dados',
                'Deseja sincronizar os dados financeiros com a API? Esta ação pode sobrescrever dados locais.'
            );
            
            if (confirmacao) {
                await sincronizarDadosAutenticado();
            }
        });
    }
    
    if (btnSaveToCloud) {
        btnSaveToCloud.addEventListener('click', async () => {
            if (!isAuthenticated()) {
                mostrarNotificacao('Erro', 'Você precisa estar logado para salvar na nuvem', 'error');
                return;
            }
            
            // Verificar se há dados para enviar
            const stats = verificarDadosParaEnvio();
            if (!stats.temDados) {
                mostrarNotificacao('Info', 'Nenhum dado financeiro encontrado para salvar na nuvem', 'info');
                return;
            }
            
            let mensagem = `Deseja enviar os seguintes dados para a nuvem?\n\n`;
            mensagem += `📊 Receitas: ${stats.receitas}\n`;
            mensagem += `💸 Despesas: ${stats.despesas}\n`;
            mensagem += `📈 Planejamento Receitas: ${stats.planejamentoReceitas}\n`;
            mensagem += `📉 Planejamento Despesas: ${stats.planejamentoDespesas}\n\n`;
            mensagem += `📦 Total: ${stats.total} registros\n\n`;
            mensagem += `⚠️ Esta ação sobrescreverá os dados remotos.`;
            
            const confirmacao = await mostrarConfirmacao('Salvar na Nuvem', mensagem);
            
            if (confirmacao) {
                await salvarDadosNaNuvem();
            }
        });
    }
    
    if (btnAnalyzeDuplicates) {
        btnAnalyzeDuplicates.addEventListener('click', async () => {
            const analise = analisarDuplicatas();
            
            let mensagem = `Análise de Duplicatas:\n\n`;
            mensagem += `📊 Receitas: ${analise.receitas.total} total, ${analise.receitas.duplicatas} duplicatas\n`;
            mensagem += `💸 Despesas: ${analise.despesas.total} total, ${analise.despesas.duplicatas} duplicatas\n`;
            mensagem += `📈 Planejamento Receitas: ${analise.planejamentoReceitas.total} total, ${analise.planejamentoReceitas.duplicatas} duplicatas\n`;
            mensagem += `📉 Planejamento Despesas: ${analise.planejamentoDespesas.total} total, ${analise.planejamentoDespesas.duplicatas} duplicatas\n\n`;
            mensagem += `🔍 Total de duplicatas encontradas: ${analise.total.duplicatas}`;
            
            if (analise.total.duplicatas > 0) {
                mensagem += `\n\n💡 Use o botão "Remover Duplicatas" para limpá-las.`;
            }
            
            mostrarNotificacao(
                'Análise de Duplicatas', 
                mensagem, 
                analise.total.duplicatas > 0 ? 'warning' : 'info'
            );
        });
    }
    
    if (btnRemoveDuplicates) {
        btnRemoveDuplicates.addEventListener('click', async () => {
            const analise = analisarDuplicatas();
            
            if (analise.total.duplicatas === 0) {
                mostrarNotificacao('Info', 'Nenhuma duplicata encontrada nos dados locais', 'info');
                return;
            }
            
            const confirmacao = await mostrarConfirmacao(
                'Remover Duplicatas',
                `Foram encontradas ${analise.total.duplicatas} duplicatas nos seus dados locais. Deseja removê-las?\n\nEsta ação não pode ser desfeita. Recomenda-se fazer um backup antes.`
            );
            
            if (confirmacao) {
                await removerDuplicatasLocais();
            }
        });
    }
}

async function sincronizarDadosAutenticado() {
    mostrarNotificacao('Info', 'Iniciando sincronização...', 'info');
    
    try {
        // Usar a função do authService que já tem autenticação
        const dadosAPI = await syncWithAPI();
        
        if (!dadosAPI) {
            throw new Error('Nenhum dado foi retornado da API');
        }
        
        // Validar estrutura dos dados
        if (!validarEstruturaDados(dadosAPI)) {
            throw new Error('Estrutura de dados da API é inválida');
        }
        
        // Processar e mesclar os dados
        await processarDadosSincronizados(dadosAPI, true);
        
        mostrarNotificacao('Sucesso', 'Dados sincronizados com sucesso!', 'success');
        
        // Atualizar relatórios
        atualizarRelatorio();
        atualizarPlanejamento();
        
    } catch (error) {
        console.error('Erro na sincronização:', error);
        mostrarNotificacao('Erro', `Falha na sincronização: ${error.message}`, 'error');
    }
}

function validarEstruturaDados(dados) {
    // Validar se os dados têm a estrutura esperada
    if (!dados || typeof dados !== 'object') return false;
    
    const estruturaEsperada = {
        receitas: Array.isArray(dados.receitas),
        despesas: Array.isArray(dados.despesas),
        planejamento: dados.planejamento && 
                     Array.isArray(dados.planejamento.receitas) && 
                     Array.isArray(dados.planejamento.despesas)
    };
    
    return Object.values(estruturaEsperada).every(Boolean);
}

async function processarDadosSincronizados(dadosNovos, mesclar) {
    if (mesclar) {
        // Mesclar dados com lógica inteligente de deduplicação
        await mesclarDadosInteligente(dadosNovos);
    } else {
        // Substituir todos os dados
        financas.receitas = dadosNovos.receitas || [];
        financas.despesas = dadosNovos.despesas || [];
        financas.planejamento = dadosNovos.planejamento || { receitas: [], despesas: [] };
        
        // Garantir IDs únicos
        garantirIDsUnicos(financas.receitas);
        garantirIDsUnicos(financas.despesas);
        garantirIDsUnicos(financas.planejamento.receitas);
        garantirIDsUnicos(financas.planejamento.despesas);
    }
    
    await salvarDados();
    atualizarRelatorio();
    atualizarPlanejamento();
}

/**
 * Gera uma chave única para identificar dados baseada em descrição, categoria e data
 * @param {Object} item - Item de receita ou despesa
 * @returns {string} - Chave única normalizada
 */
function gerarChaveUnica(item) {
    const descricao = (item.descricao || '').toLowerCase().trim();
    const categoria = (item.categoria || '').toLowerCase().trim();
    const data = (item.data || '').trim();
    
    return `${descricao}|${categoria}|${data}`;
}

/**
 * Mescla arrays removendo duplicatas baseadas em descrição, categoria e data
 * @param {Array} dadosLocais - Dados existentes localmente
 * @param {Array} dadosAPI - Dados vindos da API
 * @returns {Array} - Array mesclado sem duplicatas
 */
function mesclarArraySemDuplicatas(dadosLocais, dadosAPI) {
    if (!Array.isArray(dadosAPI) || dadosAPI.length === 0) {
        return dadosLocais;
    }
    
    // Criar um mapa com os dados locais usando a chave única
    const mapaLocal = new Map();
    dadosLocais.forEach(item => {
        const chave = gerarChaveUnica(item);
        if (chave && chave !== '||') { // Ignorar itens com dados vazios
            mapaLocal.set(chave, item);
        }
    });
    
    // Verificar dados da API e adicionar apenas os que não existem
    const dadosNovos = [];
    dadosAPI.forEach(item => {
        const chave = gerarChaveUnica(item);
        
        if (chave && chave !== '||') { // Ignorar itens com dados vazios
            if (!mapaLocal.has(chave)) {
                // Novo item - adicionar com ID único
                item.id = item.id || gerarNovoID();
                dadosNovos.push(item);
                mapaLocal.set(chave, item); // Adicionar ao mapa para evitar duplicatas dentro da própria API
            } else {
                console.log(`Item duplicado ignorado: ${item.descricao} (${item.categoria}) - ${item.data}`);
            }
        }
    });
    
    // Retornar dados locais + novos dados únicos
    return [...dadosLocais, ...dadosNovos];
}

/**
 * Executa o merge inteligente de todos os tipos de dados
 * @param {Object} dadosNovos - Dados vindos da API
 */
async function mesclarDadosInteligente(dadosNovos) {
    let totalNovos = 0;
    let totalDuplicados = 0;
    
    // Mesclar receitas
    if (dadosNovos.receitas && Array.isArray(dadosNovos.receitas)) {
        const receitasAnteriores = financas.receitas.length;
        financas.receitas = mesclarArraySemDuplicatas(financas.receitas, dadosNovos.receitas);
        const receitasNovas = financas.receitas.length - receitasAnteriores;
        const receitasDuplicadas = dadosNovos.receitas.length - receitasNovas;
        
        totalNovos += receitasNovas;
        totalDuplicados += receitasDuplicadas;
        
        console.log(`Receitas: ${receitasNovas} novas, ${receitasDuplicadas} duplicadas ignoradas`);
    }
    
    // Mesclar despesas
    if (dadosNovos.despesas && Array.isArray(dadosNovos.despesas)) {
        const despesasAnteriores = financas.despesas.length;
        financas.despesas = mesclarArraySemDuplicatas(financas.despesas, dadosNovos.despesas);
        const despesasNovas = financas.despesas.length - despesasAnteriores;
        const despesasDuplicadas = dadosNovos.despesas.length - despesasNovas;
        
        totalNovos += despesasNovas;
        totalDuplicados += despesasDuplicadas;
        
        console.log(`Despesas: ${despesasNovas} novas, ${despesasDuplicadas} duplicadas ignoradas`);
    }
    
    // Mesclar planejamento
    if (dadosNovos.planejamento) {
        if (dadosNovos.planejamento.receitas && Array.isArray(dadosNovos.planejamento.receitas)) {
            const planReceitasAnteriores = financas.planejamento.receitas.length;
            financas.planejamento.receitas = mesclarArraySemDuplicatas(
                financas.planejamento.receitas, 
                dadosNovos.planejamento.receitas
            );
            const planReceitasNovas = financas.planejamento.receitas.length - planReceitasAnteriores;
            totalNovos += planReceitasNovas;
            
            console.log(`Planejamento Receitas: ${planReceitasNovas} novas`);
        }
        
        if (dadosNovos.planejamento.despesas && Array.isArray(dadosNovos.planejamento.despesas)) {
            const planDespesasAnteriores = financas.planejamento.despesas.length;
            financas.planejamento.despesas = mesclarArraySemDuplicatas(
                financas.planejamento.despesas, 
                dadosNovos.planejamento.despesas
            );
            const planDespesasNovas = financas.planejamento.despesas.length - planDespesasAnteriores;
            totalNovos += planDespesasNovas;
            
            console.log(`Planejamento Despesas: ${planDespesasNovas} novas`);
        }
    }
    
    // Mostrar resultado do merge
    if (totalNovos > 0 || totalDuplicados > 0) {
        mostrarNotificacao(
            'Merge Completo', 
            `${totalNovos} novos registros adicionados. ${totalDuplicados} duplicatas ignoradas.`, 
            'info'
        );
    } else {
        mostrarNotificacao('Merge Completo', 'Nenhum dado novo encontrado.', 'info');
    }
}

/**
 * Gera um novo ID único baseado em timestamp e aleatoriedade
 * @returns {string} - ID único
 */
function gerarNovoID() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Garante que todos os itens de um array tenham IDs únicos
 * @param {Array} array - Array de itens para garantir IDs
 */
function garantirIDsUnicos(array) {
    if (!Array.isArray(array)) return;
    
    array.forEach(item => {
        if (!item.id) {
            item.id = gerarNovoID();
        }
    });
}

/**
 * Remove duplicatas dos dados locais existentes baseado nos critérios de descrição, categoria e data
 * @returns {Object} - Relatório de duplicatas removidas
 */
export async function removerDuplicatasLocais() {
    const relatorio = {
        receitas: { removidas: 0, mantidas: 0 },
        despesas: { removidas: 0, mantidas: 0 },
        planejamentoReceitas: { removidas: 0, mantidas: 0 },
        planejamentoDespesas: { removidas: 0, mantidas: 0 }
    };
    
    try {
        // Remover duplicatas das receitas
        const receitasOriginais = financas.receitas.length;
        financas.receitas = removerDuplicatasArray(financas.receitas);
        relatorio.receitas.mantidas = financas.receitas.length;
        relatorio.receitas.removidas = receitasOriginais - financas.receitas.length;
        
        // Remover duplicatas das despesas
        const despesasOriginais = financas.despesas.length;
        financas.despesas = removerDuplicatasArray(financas.despesas);
        relatorio.despesas.mantidas = financas.despesas.length;
        relatorio.despesas.removidas = despesasOriginais - financas.despesas.length;
        
        // Remover duplicatas do planejamento - receitas
        const planReceitasOriginais = financas.planejamento.receitas.length;
        financas.planejamento.receitas = removerDuplicatasArray(financas.planejamento.receitas);
        relatorio.planejamentoReceitas.mantidas = financas.planejamento.receitas.length;
        relatorio.planejamentoReceitas.removidas = planReceitasOriginais - financas.planejamento.receitas.length;
        
        // Remover duplicatas do planejamento - despesas
        const planDespesasOriginais = financas.planejamento.despesas.length;
        financas.planejamento.despesas = removerDuplicatasArray(financas.planejamento.despesas);
        relatorio.planejamentoDespesas.mantidas = financas.planejamento.despesas.length;
        relatorio.planejamentoDespesas.removidas = planDespesasOriginais - financas.planejamento.despesas.length;
        
        // Salvar dados limpos
        await salvarDados();
        
        // Atualizar interface
        atualizarRelatorio();
        atualizarPlanejamento();
        
        const totalRemovidas = relatorio.receitas.removidas + relatorio.despesas.removidas + 
                             relatorio.planejamentoReceitas.removidas + relatorio.planejamentoDespesas.removidas;
        
        if (totalRemovidas > 0) {
            mostrarNotificacao(
                'Limpeza Concluída', 
                `${totalRemovidas} duplicatas removidas dos dados locais`, 
                'success'
            );
        } else {
            mostrarNotificacao('Limpeza Concluída', 'Nenhuma duplicata encontrada', 'info');
        }
        
        return relatorio;
        
    } catch (error) {
        console.error('Erro ao remover duplicatas:', error);
        mostrarNotificacao('Erro', 'Falha ao remover duplicatas: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Remove duplicatas de um array mantendo apenas a primeira ocorrência de cada item único
 * @param {Array} array - Array para remover duplicatas
 * @returns {Array} - Array sem duplicatas
 */
function removerDuplicatasArray(array) {
    if (!Array.isArray(array)) return array;
    
    const mapaUnicos = new Map();
    const arrayLimpo = [];
    
    array.forEach(item => {
        const chave = gerarChaveUnica(item);
        
        if (chave && chave !== '||') { // Ignorar itens com dados vazios
            if (!mapaUnicos.has(chave)) {
                mapaUnicos.set(chave, true);
                arrayLimpo.push(item);
            } else {
                console.log(`Duplicata removida: ${item.descricao} (${item.categoria}) - ${item.data}`);
            }
        } else {
            // Manter itens com dados vazios (podem ser editados depois)
            arrayLimpo.push(item);
        }
    });
    
    return arrayLimpo;
}

/**
 * Analisa os dados locais e retorna estatísticas sobre duplicatas
 * @returns {Object} - Estatísticas de duplicatas
 */
export function analisarDuplicatas() {
    const analise = {
        receitas: analisarDuplicatasArray(financas.receitas),
        despesas: analisarDuplicatasArray(financas.despesas),
        planejamentoReceitas: analisarDuplicatasArray(financas.planejamento.receitas),
        planejamentoDespesas: analisarDuplicatasArray(financas.planejamento.despesas)
    };
    
    const totalDuplicatas = analise.receitas.duplicatas + analise.despesas.duplicatas + 
                           analise.planejamentoReceitas.duplicatas + analise.planejamentoDespesas.duplicatas;
    
    analise.total = {
        duplicatas: totalDuplicatas,
        precisaLimpeza: totalDuplicatas > 0
    };
    
    return analise;
}

/**
 * Analisa um array e conta quantas duplicatas existem
 * @param {Array} array - Array para analisar
 * @returns {Object} - Estatísticas do array
 */
function analisarDuplicatasArray(array) {
    if (!Array.isArray(array)) return { total: 0, unicos: 0, duplicatas: 0 };
    
    const mapaContadores = new Map();
    
    array.forEach(item => {
        const chave = gerarChaveUnica(item);
        if (chave && chave !== '||') {
            mapaContadores.set(chave, (mapaContadores.get(chave) || 0) + 1);
        }
    });
    
    let duplicatas = 0;
    mapaContadores.forEach(contador => {
        if (contador > 1) {
            duplicatas += contador - 1; // Contar apenas as duplicatas (mantém 1 original)
        }
    });
    
    return {
        total: array.length,
        unicos: mapaContadores.size,
        duplicatas: duplicatas
    };
}

/**
 * Salva os dados locais na nuvem (API)
 * @returns {Promise<boolean>} - True se salvou com sucesso
 */
export async function salvarDadosNaNuvem() {
    if (!isAuthenticated()) {
        throw new Error('Usuário não autenticado');
    }
    
    try {
        mostrarNotificacao('Info', 'Enviando dados para a nuvem...', 'info');
        
        // Preparar dados para envio conforme especificação da API
        const dadosParaEnvio = {
            receitas: financas.receitas.map(receita => ({
                descricao: receita.descricao,
                valor: parseFloat(receita.valor) || 0,
                data: receita.data,
                categoria: receita.categoria || ''
            })),
            despesas: financas.despesas.map(despesa => ({
                descricao: despesa.descricao,
                categoria: despesa.categoria || '',
                valor: parseFloat(despesa.valor) || 0,
                data: despesa.data,
                parcelas: despesa.parcelas || 1,
                taxaJuros: parseFloat(despesa.taxaJuros) || 0
            })),
            planejamento: {
                receitas: (financas.planejamento?.receitas || []).map(receita => ({
                    descricao: receita.descricao,
                    valor: parseFloat(receita.valor) || 0,
                    categoria: receita.categoria || ''
                })),
                despesas: (financas.planejamento?.despesas || []).map(despesa => ({
                    descricao: despesa.descricao,
                    categoria: despesa.categoria || 'outros',
                    valorTotal: parseFloat(despesa.valorTotal) || parseFloat(despesa.valor) || 0,
                    valor: parseFloat(despesa.valor) || 0,
                    parcelada: despesa.parcelada || false,
                    numParcelas: despesa.numParcelas || 1,
                    parcelaAtual: despesa.parcelaAtual || 1,
                    taxaJuros: parseFloat(despesa.taxaJuros) || 0
                }))
            }
        };
        
        // Validar dados antes do envio
        if (!validarDadosParaEnvio(dadosParaEnvio)) {
            throw new Error('Dados locais inválidos para envio');
        }
        
        // Fazer requisição para a API
        const token = getCurrentToken();
        const response = await window.electronAPI.fazerRequisicaoHTTP({
            url: 'https://lightsalmon-alpaca-756067.hostingersite.com/api/financas',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: dadosParaEnvio
        });
        
        if (!response.success) {
            throw new Error(`Erro na requisição: ${response.error}`);
        }
        
        if (response.response.status === 401) {
            // Token expirado - tentar reautenticar
            mostrarNotificacao('Erro', 'Sessão expirada. Faça login novamente.', 'error');
            logout();
            return false;
        }
        
        if (response.response.status !== 200 && response.response.status !== 201) {
            const errorMessage = response.response.data?.message || 'Erro desconhecido no servidor';
            throw new Error(`Erro ${response.response.status}: ${errorMessage}`);
        }
        
        // Sucesso
        const totalItens = dadosParaEnvio.receitas.length + dadosParaEnvio.despesas.length;
        const totalPlanejamento = dadosParaEnvio.planejamento.receitas.length + dadosParaEnvio.planejamento.despesas.length;
        
        mostrarNotificacao(
            'Sucesso', 
            `Dados salvos na nuvem! ${totalItens} registros financeiros e ${totalPlanejamento} itens de planejamento enviados.`, 
            'success'
        );
        
        console.log('Dados salvos na nuvem:', response.response.data);
        return true;
        
    } catch (error) {
        console.error('Erro ao salvar na nuvem:', error);
        mostrarNotificacao('Erro', `Falha ao salvar na nuvem: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Valida se os dados estão prontos para envio à API
 * @param {Object} dados - Dados para validar
 * @returns {boolean} - True se dados são válidos
 */
function validarDadosParaEnvio(dados) {
    try {
        // Verificar estrutura básica
        if (!dados || typeof dados !== 'object') return false;
        
        // Verificar arrays obrigatórios
        if (!Array.isArray(dados.receitas) || !Array.isArray(dados.despesas)) return false;
        
        // Verificar planejamento
        if (!dados.planejamento || 
            !Array.isArray(dados.planejamento.receitas) || 
            !Array.isArray(dados.planejamento.despesas)) return false;
        
        // Validar estrutura de cada receita
        for (let receita of dados.receitas) {
            if (!receita.descricao || typeof receita.valor !== 'number' || !receita.data) {
                console.warn('Receita inválida encontrada:', receita);
                return false;
            }
        }
        
        // Validar estrutura de cada despesa
        for (let despesa of dados.despesas) {
            if (!despesa.descricao || typeof despesa.valor !== 'number' || !despesa.data) {
                console.warn('Despesa inválida encontrada:', despesa);
                return false;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('Erro na validação:', error);
        return false;
    }
}

/**
 * Verifica se há dados válidos para enviar para a nuvem
 * @returns {Object} - Estatísticas dos dados locais
 */
export function verificarDadosParaEnvio() {
    const stats = {
        receitas: financas.receitas?.length || 0,
        despesas: financas.despesas?.length || 0,
        planejamentoReceitas: financas.planejamento?.receitas?.length || 0,
        planejamentoDespesas: financas.planejamento?.despesas?.length || 0,
        total: 0,
        temDados: false
    };
    
    stats.total = stats.receitas + stats.despesas + stats.planejamentoReceitas + stats.planejamentoDespesas;
    stats.temDados = stats.total > 0;
    
    return stats;
}
