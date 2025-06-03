// reportService.js
// Responsável por gerar e atualizar relatórios financeiros
import { financas } from './dataService.js';
import { filtrarPorMesAtual } from './dateService.js';
import { formatarMoeda } from './configurationService.js';
import { atualizarGraficos, atualizarGraficosPlano } from './chartService.js';

export function atualizarRelatorio() {
    atualizarResumo();
    atualizarListaReceitas();
    atualizarListaDespesas();
    atualizarGraficos();
}

export function atualizarPlanejamento() {
    atualizarResumoPlanejamento();
    atualizarDistribuicaoSugerida();
    atualizarListaReceitasPrevistas();
    atualizarListaDespesasPrevistas();
    atualizarListaParcelasFinalizadas();
    atualizarGraficosPlano();
}

function atualizarResumo() {
    const receitasMesAtual = filtrarPorMesAtual(financas.receitas);
    const despesasMesAtual = filtrarPorMesAtual(financas.despesas);
    
    const totalReceitas = receitasMesAtual.reduce((total, receita) => total + receita.valor, 0);
    const totalDespesas = despesasMesAtual.reduce((total, despesa) => total + despesa.valor, 0);
    const saldo = totalReceitas - totalDespesas;
    
    const totalReceitasEl = document.getElementById('total-receitas');
    const totalDespesasEl = document.getElementById('total-despesas');
    const saldoFinalEl = document.getElementById('saldo-final');
    
    if (totalReceitasEl) totalReceitasEl.textContent = formatarMoeda(totalReceitas);
    if (totalDespesasEl) totalDespesasEl.textContent = formatarMoeda(totalDespesas);
    if (saldoFinalEl) {
        saldoFinalEl.textContent = formatarMoeda(saldo);
        saldoFinalEl.className = saldo >= 0 ? 'saldo-positivo' : 'saldo-negativo';
    }
}

function atualizarListaReceitas() {
    const listaReceitas = document.getElementById('lista-receitas');
    if (!listaReceitas) return;
    
    const receitasMesAtual = filtrarPorMesAtual(financas.receitas);
    
    if (receitasMesAtual.length === 0) {
        listaReceitas.innerHTML = '<li class="lista-vazia">Nenhuma receita registrada</li>';
        return;
    }
    
    listaReceitas.innerHTML = receitasMesAtual.map(receita => `
        <li class="item-financeiro">
            <div class="item-info">
                <span class="item-descricao">${receita.descricao}</span>
                <span class="item-categoria">${receita.categoria}</span>
                <span class="item-data">${new Date(receita.data).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="item-valor receita">${formatarMoeda(receita.valor)}</div>
            <button class="btn-excluir" onclick="excluirItem('receita', ${receita.id})">
                <i class="fas fa-trash"></i>
            </button>
        </li>
    `).join('');
}

function atualizarListaDespesas() {
    const listaDespesas = document.getElementById('lista-despesas');
    if (!listaDespesas) return;
    
    const despesasMesAtual = filtrarPorMesAtual(financas.despesas);
    
    if (despesasMesAtual.length === 0) {
        listaDespesas.innerHTML = '<li class="lista-vazia">Nenhuma despesa registrada</li>';
        return;
    }
    
    listaDespesas.innerHTML = despesasMesAtual.map(despesa => `
        <li class="item-financeiro">
            <div class="item-info">
                <span class="item-descricao">${despesa.descricao}</span>
                <span class="item-categoria">${despesa.categoria}</span>
                <span class="item-data">${new Date(despesa.data).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="item-valor despesa">${formatarMoeda(despesa.valor)}</div>
            <button class="btn-excluir" onclick="excluirItem('despesa', ${despesa.id})">
                <i class="fas fa-trash"></i>
            </button>
        </li>
    `).join('');
}

function atualizarResumoPlanejamento() {
    const totalReceitasPrevistas = financas.planejamento.receitas.reduce((total, receita) => total + receita.valor, 0);
    const totalDespesasPrevistas = financas.planejamento.despesas.reduce((total, despesa) => total + despesa.valor, 0);
    const saldoPrevisto = totalReceitasPrevistas - totalDespesasPrevistas;
    
    const totalReceitasPrevistasEl = document.getElementById('total-receitas-previstas');
    const totalDespesasPrevistasEl = document.getElementById('total-despesas-previstas');
    const saldoPrevistwoEl = document.getElementById('saldo-previsto');
    
    if (totalReceitasPrevistasEl) totalReceitasPrevistasEl.textContent = formatarMoeda(totalReceitasPrevistas);
    if (totalDespesasPrevistasEl) totalDespesasPrevistasEl.textContent = formatarMoeda(totalDespesasPrevistas);
    if (saldoPrevistwoEl) {
        saldoPrevistwoEl.textContent = formatarMoeda(saldoPrevisto);
        saldoPrevistwoEl.className = saldoPrevisto >= 0 ? 'saldo-positivo' : 'saldo-negativo';
    }
}

function atualizarDistribuicaoSugerida() {
    const totalReceitasPrevistas = financas.planejamento.receitas.reduce((total, receita) => total + receita.valor, 0);
    
    const investimento = totalReceitasPrevistas * 0.25;
    const necessarios = totalReceitasPrevistas * 0.45;
    const prazeres = totalReceitasPrevistas * 0.10;
    const conforto = totalReceitasPrevistas * 0.15;
    const emergencia = totalReceitasPrevistas * 0.05;
    
    const valorInvestimentoEl = document.getElementById('valor-investimento');
    const valorNecessariosEl = document.getElementById('valor-necessarios');
    const valorPrazeresEl = document.getElementById('valor-prazeres');
    const valorConfortoEl = document.getElementById('valor-conforto');
    const valorEmergenciaEl = document.getElementById('valor-emergencia');
    
    if (valorInvestimentoEl) valorInvestimentoEl.textContent = formatarMoeda(investimento);
    if (valorNecessariosEl) valorNecessariosEl.textContent = formatarMoeda(necessarios);
    if (valorPrazeresEl) valorPrazeresEl.textContent = formatarMoeda(prazeres);
    if (valorConfortoEl) valorConfortoEl.textContent = formatarMoeda(conforto);
    if (valorEmergenciaEl) valorEmergenciaEl.textContent = formatarMoeda(emergencia);
}

function atualizarListaReceitasPrevistas() {
    const listaReceitasPrevistas = document.getElementById('lista-receitas-previstas');
    if (!listaReceitasPrevistas) return;
    
    if (financas.planejamento.receitas.length === 0) {
        listaReceitasPrevistas.innerHTML = '<li class="lista-vazia">Nenhuma receita prevista registrada</li>';
        return;
    }
    
    listaReceitasPrevistas.innerHTML = financas.planejamento.receitas.map(receita => `
        <li class="item-financeiro">
            <div class="item-info">
                <span class="item-descricao">${receita.descricao}</span>
                <span class="item-categoria">${receita.categoria}</span>
            </div>
            <div class="item-valor receita">${formatarMoeda(receita.valor)}</div>
            <button class="btn-excluir" onclick="excluirItemPlanejamento('receita', ${receita.id})">
                <i class="fas fa-trash"></i>
            </button>
        </li>
    `).join('');
}

function atualizarListaDespesasPrevistas() {
    const listaDespesasPrevistas = document.getElementById('lista-despesas-previstas');
    if (!listaDespesasPrevistas) return;
    
    if (financas.planejamento.despesas.length === 0) {
        listaDespesasPrevistas.innerHTML = '<li class="lista-vazia">Nenhuma despesa prevista registrada</li>';
        return;
    }
    
    listaDespesasPrevistas.innerHTML = financas.planejamento.despesas.map(despesa => `
        <li class="item-financeiro">
            <div class="item-info">
                <span class="item-descricao">${despesa.descricao}</span>
                <span class="item-categoria">${despesa.categoria}</span>
                ${despesa.ehParcelada ? `<span class="item-parcela">Parcela ${despesa.parcelaAtual}/${despesa.numParcelas}</span>` : ''}
            </div>
            <div class="item-valor despesa">${formatarMoeda(despesa.valor)}</div>
            <div class="item-acoes">
                ${despesa.ehParcelada ? `<button class="btn-avancar" onclick="avancarParcela(${despesa.id})">Próxima</button>` : ''}
                <button class="btn-excluir" onclick="excluirItemPlanejamento('despesa', ${despesa.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </li>
    `).join('');
}

function atualizarListaParcelasFinalizadas() {
    const listaParcelasFinalizadas = document.getElementById('lista-parcelas-finalizadas');
    if (!listaParcelasFinalizadas) return;
    
    const parcelasFinalizadas = financas.planejamento.despesas.filter(despesa => 
        despesa.ehParcelada && despesa.parcelaAtual > despesa.numParcelas
    );
    
    if (parcelasFinalizadas.length === 0) {
        listaParcelasFinalizadas.innerHTML = '<li class="lista-vazia">Nenhuma parcela finalizada</li>';
        return;
    }
    
    listaParcelasFinalizadas.innerHTML = parcelasFinalizadas.map(despesa => `
        <li class="item-financeiro finalizada">
            <div class="item-info">
                <span class="item-descricao">${despesa.descricao}</span>
                <span class="item-categoria">${despesa.categoria}</span>
                <span class="item-status">✓ Finalizada</span>
            </div>
            <div class="item-valor">${formatarMoeda(despesa.valorTotal)}</div>
        </li>
    `).join('');
}
