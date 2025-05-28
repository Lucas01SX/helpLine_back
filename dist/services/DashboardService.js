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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const db_1 = __importDefault(require("../database/db"));
const date_fns_1 = require("date-fns");
class DashboardService {
    static horaParaMinutos(hora) {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + (m || 0);
    }
    static usuariosLogadosDash() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db_1.default.query(`SELECT DISTINCT ON (a.pk_id_usuario) a.pk_id_usuario, STRING_AGG(DISTINCT d.segmento, ',') AS segmento, STRING_AGG(DISTINCT d.mcdu::TEXT, ',') AS mcdu, STRING_AGG(DISTINCT d.fila, ',') AS fila, a.hr_login, a.hr_logoff FROM suporte.tb_login_logoff_suporte a JOIN suporte.tb_login_suporte b ON a.pk_id_usuario = b.id_usuario JOIN suporte.tb_skills_staff c ON b.matricula = c.matricula::INT JOIN trafego.tb_anexo1g d ON c.mcdu::INT = d.mcdu WHERE a.dt_login = CURRENT_DATE group by A.pk_id_usuario, a.id_login ORDER BY a.pk_id_usuario, a.id_login desc`);
                return result.rows.map((usuario) => ({
                    id: usuario.pk_id_usuario,
                    segmento: usuario.segmento,
                    mcdu: usuario.mcdu,
                    fila: usuario.fila,
                    hr_login: usuario.hr_login ? usuario.hr_login.split(':')[0] : null,
                    hr_logoff: usuario.hr_logoff ? usuario.hr_logoff.split(':')[0] : null,
                }));
            }
            catch (e) {
                console.error('Erro ao obter usuários logados:', e);
                throw e;
            }
        });
    }
    static dadosGeraisSuporteDash() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db_1.default.query(`SELECT a.id_suporte, b.segmento, b.mcdu, b.fila, a.hora_solicitacao_suporte, a.tempo_aguardando_suporte, a.cancelar_suporte FROM suporte.tb_chamado_suporte a join trafego.tb_anexo1g b on a.mcdu::int = b.mcdu WHERE a.dt_solicitacao_suporte = CURRENT_DATE group by a.id_suporte, b.segmento, b.mcdu, b.fila, a.hora_solicitacao_suporte, a.tempo_aguardando_suporte, a.cancelar_suporte ;`);
                return result.rows.map((chamado) => (Object.assign(Object.assign({}, chamado), { hora_solicitacao_suporte: chamado.hora_solicitacao_suporte.split(':')[0] })));
            }
            catch (e) {
                console.error('Erro ao obter dados gerais de suporte:', e);
                throw e;
            }
        });
    }
    static obterHoraAtual() {
        return (0, date_fns_1.format)(new Date(), 'HH');
    }
    static gerarIntervalosHora(inicio = '08', fim = '21') {
        const intervalos = [];
        let horaInicio = parseInt(inicio, 10);
        const horaFim = parseInt(fim, 10);
        while (horaInicio <= horaFim) {
            intervalos.push(horaInicio.toString().padStart(2, '0'));
            horaInicio++;
        }
        return intervalos;
    }
    static tratamentoDadosDash(usuariosLogadosDash, dadosGeraisSuporteDash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const faixasHorarias = this.gerarIntervalosHora();
                const horaAtual = this.obterHoraAtual();
                const faixasFiltradas = faixasHorarias.filter(faixa => faixa <= horaAtual);
                const resultado = faixasFiltradas.map(faixa => ({
                    horario: faixa,
                    segmentos: {}
                }));
                dadosGeraisSuporteDash.forEach((chamado) => {
                    const horaSolicitacao = chamado.hora_solicitacao_suporte;
                    const segmento = chamado.segmento;
                    const fila = chamado.fila;
                    resultado.forEach(faixa => {
                        if (faixa.horario === horaSolicitacao) {
                            if (!faixa.segmentos[segmento]) {
                                faixa.segmentos[segmento] = { filas: {} };
                            }
                            if (!faixa.segmentos[segmento].filas[fila]) {
                                faixa.segmentos[segmento].filas[fila] = {
                                    acionamentos: 0,
                                    tempoTotalEspera: 0,
                                    chamadosCancelados: 0
                                };
                            }
                            faixa.segmentos[segmento].filas[fila].acionamentos += 1;
                            if (chamado.tempo_aguardando_suporte && !chamado.cancelar_suporte) {
                                const tempoEsperaMinutos = this.horaParaMinutos(chamado.tempo_aguardando_suporte);
                                faixa.segmentos[segmento].filas[fila].tempoTotalEspera += tempoEsperaMinutos;
                            }
                            if (chamado.cancelar_suporte) {
                                faixa.segmentos[segmento].filas[fila].chamadosCancelados += 1;
                            }
                        }
                    });
                });
                const logadosPorHora = faixasFiltradas.map(faixa => ({
                    horario: faixa,
                    usuarios: usuariosLogadosDash.filter((usuario) => {
                        const hrLoginMinutos = this.horaParaMinutos(usuario.hr_login);
                        const hrLogoffMinutos = usuario.hr_logoff ? this.horaParaMinutos(usuario.hr_logoff) : Infinity;
                        const faixaInicioMinutos = this.horaParaMinutos(faixa);
                        const faixaFimMinutos = faixaInicioMinutos + 60;
                        return hrLoginMinutos <= faixaInicioMinutos && (hrLogoffMinutos >= faixaFimMinutos || usuario.hr_logoff === null);
                    }).map((usuario) => ({
                        id_usuario: usuario.id,
                        segmento: usuario.segmento,
                        mcdu: usuario.mcdu,
                        fila: usuario.fila,
                        logoff: usuario.hr_logoff !== null
                    }))
                }));
                return { logados: logadosPorHora, resultado };
            }
            catch (e) {
                console.error('Erro no tratamento de dados do Dash:', e);
                throw e;
            }
        });
    }
    static obterDashboard() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const usuariosLogados = yield this.usuariosLogadosDash();
                const dadosGerais = yield this.dadosGeraisSuporteDash();
                const resultado = yield this.tratamentoDadosDash(usuariosLogados, dadosGerais);
                return resultado;
            }
            catch (e) {
                console.error('Erro ao obter dados do dashboard:', e);
                throw e;
            }
        });
    }
}
exports.DashboardService = DashboardService;
