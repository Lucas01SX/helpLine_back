"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioService = void 0;
const cacheService_1 = require("./cacheService");
class RelatorioService {
    static consultaRelatorioSuporte(suporte, gestor, coordenador, fila, segmento, dataInicio, dataFim, agruparPor) {
        return __awaiter(this, void 0, void 0, function* () {
            let entrada1;
            let entrada2 = null;
            switch (agruparPor) {
                case 'suporte':
                    entrada1 = 'suporte';
                    entrada2 = 'gestor';
                    break;
                case 'fila':
                    entrada1 = 'fila';
                    entrada2 = 'segmento';
                    break;
                case 'coordenador':
                    entrada1 = 'coordenador';
                    entrada2 = null;
                    break;
                case 'supervisor':
                    entrada1 = 'gestor';
                    entrada2 = 'coordenador';
                    break;
                case 'data':
                    entrada1 = 'data';
                    entrada2 = null;
                    break;
                case 'geral':
                    entrada1 = 'data';
                    entrada2 = null;
                    break;
                case 'ns_suporte':
                    entrada1 = 'data';
                    entrada2 = null;
                    break;
                default:
                    entrada1 = 'data';
                    entrada2 = null;
                //throw new Error('Agrupamento inválido');
            }
            //console.log(`Agrupar por: ${agruparPor}`);
            try {
                console.log('Verificando dados no cache...');
                let cache = yield (0, cacheService_1.getCacheRel)();
                if (!cache || cache.length === 0) {
                    console.log('Cache vazio, atualizando...');
                    yield (0, cacheService_1.cacheRelatorio)(); //ATUALIZACACHE
                    cache = yield (0, cacheService_1.getCacheRel)();
                }
                if (!cache || cache.length === 0) {
                    throw new Error('Cache não retornou nada');
                }
                const dataInicioDate = new Date(dataInicio);
                const dataFimDate = new Date(dataFim);
                const filtroDatas = cache.filter((dado) => {
                    const dataRegistro = new Date(dado.data || dado.avaliacao).toISOString().split('T')[0];
                    const dataInicioISO = dataInicioDate.toISOString().split('T')[0];
                    const dataFimISO = dataFimDate.toISOString().split('T')[0];
                    return dataRegistro >= dataInicioISO && dataRegistro <= dataFimISO;
                });
                const filtroGestor = gestor ? filtroDatas.filter(dado => dado.gestor === gestor) : filtroDatas;
                const filtroSuporte = suporte ? filtroGestor.filter(dado => dado.suporte === suporte) : filtroGestor;
                const filtroSegmento = segmento ? filtroSuporte.filter(dado => dado.segmento === segmento) : filtroSuporte;
                const filtroFilas = fila ? filtroSegmento.filter(dado => dado.fila === fila) : filtroSegmento;
                if (agruparPor === 'geral') {
                    return filtroFilas;
                }
                const agrupamento = {};
                filtroFilas.forEach(item => {
                    const chave = entrada2 ? `${item[entrada1]}-${item[entrada2]}` : item[entrada1];
                    if (!agrupamento[chave]) {
                        agrupamento[chave] = {
                            somaAbandonadas: 0,
                            somaSla: 0,
                            quant: 0,
                            somaNotas: 0,
                            totalNotas: 0,
                            somaTme: 0,
                            somaTma: 0,
                            somaAtendidas: 0,
                            somaAtn_TME: 0,
                            somaAtn_maior_tme: 0,
                            sla: 0,
                            agrupamento1: item[entrada1],
                            agrupamento2: entrada2 ? item[entrada2] : undefined
                        };
                    }
                    if (item.avaliacao) {
                        agrupamento[chave].somaNotas += item.avaliacao; // soma das avaliações
                        agrupamento[chave].totalNotas += 1;
                    }
                    if (item.hora_inicio_suporte == null) {
                        agrupamento[chave].somaAbandonadas += 1;
                    }
                    if (item.hora_inicio_suporte !== null) {
                        agrupamento[chave].somaAtendidas += 1;
                    }
                    agrupamento[chave].quant += 1; // soma com null
                    //console.log(agrupamento[chave].somaAtendidas, agrupamento[chave].quant)
                    const horaInicioSuporte = item.hora_inicio_suporte ? new Date(new Date(`1970-01-01T${item.hora_inicio_suporte}`).getTime() - 3 * 60 * 60 * 1000) : null;
                    const horaSolicitacaoSuporte = item.hora_solicitacao_suporte ? new Date(new Date(`1970-01-01T${item.hora_solicitacao_suporte}`).getTime() - 3 * 60 * 60 * 1000) : null;
                    const horaFimSuporte = item.hora_fim_suporte ? new Date(new Date(`1970-01-01T${item.hora_fim_suporte}`).getTime() - 3 * 60 * 60 * 1000) : null;
                    if (horaInicioSuporte && horaSolicitacaoSuporte && !isNaN(horaInicioSuporte.getTime()) && !isNaN(horaSolicitacaoSuporte.getTime())) {
                        agrupamento[chave].somaTme += (horaInicioSuporte.getTime() - horaSolicitacaoSuporte.getTime());
                        const diferenca = horaInicioSuporte.getTime() - horaSolicitacaoSuporte.getTime();
                        if (diferenca <= 60000) { //60000 milissegundos=1 minuto
                            agrupamento[chave].somaAtn_TME += 1;
                        }
                        if (diferenca > 60000) {
                            agrupamento[chave].somaAtn_maior_tme += 1;
                        }
                    }
                    if (horaInicioSuporte && horaFimSuporte && !isNaN(horaInicioSuporte.getTime()) && !isNaN(horaFimSuporte.getTime())) {
                        agrupamento[chave].somaTma += (horaFimSuporte.getTime() - horaInicioSuporte.getTime());
                    }
                });
                console.log(filtroFilas);
                const find = Object.values(agrupamento).map(item => {
                    const nota = item.totalNotas > 0 ? (item.somaNotas / item.totalNotas).toFixed(2) : 'N/A';
                    const tme = item.somaAtendidas > 0 ? new Date(item.somaTme / item.somaAtendidas).toISOString().substr(11, 8) : '00:00:00';
                    const tma = item.somaAtendidas > 0 ? new Date(item.somaTma / item.somaAtendidas).toISOString().substr(11, 8) : '00:00:00';
                    const totalSolicitacoes = item.somaAtendidas + item.somaAbandonadas;
                    if (totalSolicitacoes > 0) {
                        item.sla = parseFloat(((item.somaAtn_TME / totalSolicitacoes) * 100).toFixed(2));
                    }
                    else {
                        item.sla = 0;
                    }
                    return Object.assign(Object.assign({}, item), { nota,
                        tme,
                        tma });
                });
                //console.log(find)
                return find;
            }
            catch (e) {
                console.error('Erro na consulta relatorio:', e);
                throw e;
            }
        });
    }
    static relatorioCP() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cp = yield (0, cacheService_1.getCachedData)();
                if (cp) {
                    const codGestao = [1110, 765, 572];
                    const codSuporte = [791, 14943, 524, 14938, 572, 574, 1110, 61, 836, 1113, 232, 14937, 944];
                    const filteredData = cp.filter(item => (codGestao.includes(parseInt(item.cod)) || codSuporte.includes(parseInt(item.cod))) &&
                        item.nome && item.nome !== '');
                    return filteredData.map(item => ({
                        nomeGestor: item.nome_super,
                        nomeSuporte: item.nome
                    }));
                }
                return [];
            }
            catch (error) {
                console.error('Erro ao trazer gestao e suporte', error);
                throw error;
            }
        });
    }
    static relatorioSuporte(suporte, gestor, coordenador, fila, segmento, dataInicio, dataFim, agruparPor) {
        return __awaiter(this, void 0, void 0, function* () {
            const relatorio = yield this.consultaRelatorioSuporte(suporte, gestor, coordenador, fila, segmento, dataInicio, dataFim, agruparPor);
            return relatorio;
        });
    }
}
exports.RelatorioService = RelatorioService;
