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
class DashboardService {
    static usuariosLogadosDash() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db_1.default.query(`select pk_id_usuario, hr_login, hr_logoff from suporte.tb_login_logoff_suporte where dt_login = current_date`);
                const usuarios = result.rows.map((usuario) => {
                    const hr_login = new Date(`1970-01-01T${usuario.hr_login}Z`);
                    hr_login.setHours(hr_login.getHours());
                    const hr_login_formatted = hr_login.toTimeString().split(' ')[0];
                    let hr_logoff_formatted = null;
                    if (usuario.hr_logoff) {
                        const hr_logoff = new Date(`1970-01-01T${usuario.hr_logoff}Z`);
                        hr_logoff.setHours(hr_logoff.getHours());
                        hr_logoff_formatted = hr_logoff.toTimeString().split(' ')[0];
                    }
                    return Object.assign(Object.assign({}, usuario), { hr_login: hr_login_formatted, hr_logoff: hr_logoff_formatted });
                });
                return usuarios;
            }
            catch (e) {
                console.error('Erro em validar logados:', e);
                throw e;
            }
        });
    }
    static dadosGeraisSuporteDash() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db_1.default.query(`select a.id_suporte, a.hora_solicitacao_suporte, a.dt_solicitacao_suporte, a.tempo_aguardando_suporte, a.cancelar_suporte from suporte.tb_chamado_suporte a where a.dt_solicitacao_suporte = current_date`);
                return result.rows;
            }
            catch (e) {
                console.error('Erro na autenticação:', e);
                throw e;
            }
        });
    }
    static tratamentoDadosDash(usuariosLogadosDash, dadosGeraisSuporteDash) {
        return __awaiter(this, void 0, void 0, function* () {
            const usuarios = usuariosLogadosDash;
            const dadosGerais = dadosGeraisSuporteDash;
            try {
                const faixasHorarias = ['07:00:00', '08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00', '18:00:00', '19:00:00', '20:00:00', '21:00:00'];
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const faixasFiltradas = faixasHorarias.filter(faixa => {
                    const [h, m, s] = faixa.split(':').map(Number);
                    return h < currentHour || (h === currentHour && m <= currentMinute);
                });
                const resultado = faixasFiltradas.map(faixa => ({
                    hora: faixa,
                    logados: 0,
                    acionamentos: 0,
                    tempoMedioEspera: 0,
                    chamadosCancelados: 0,
                    tempoMedioEsperaFormatado: "00:00:00"
                }));
                const horaParaMinutos = (hora) => {
                    const [h, m, s] = hora.split(':').map(Number);
                    return h * 60 + m + s / 60;
                };
                usuarios.forEach((usuario) => {
                    const hrLoginMinutos = horaParaMinutos(usuario.hr_login);
                    const hrLogoffMinutos = usuario.hr_logoff ? horaParaMinutos(usuario.hr_logoff) : Infinity;
                    resultado.forEach(faixa => {
                        const faixaInicioMinutos = horaParaMinutos(faixa.hora);
                        const faixaFimMinutos = faixaInicioMinutos + 60;
                        if (hrLoginMinutos <= faixaFimMinutos && hrLogoffMinutos >= faixaInicioMinutos) {
                            faixa.logados += 1;
                        }
                    });
                });
                dadosGerais.forEach((chamado) => {
                    const horaSolicitacaoMinutos = horaParaMinutos(chamado.hora_solicitacao_suporte);
                    resultado.forEach(faixa => {
                        const faixaInicioMinutos = horaParaMinutos(faixa.hora);
                        const faixaFimMinutos = faixaInicioMinutos + 60;
                        if (horaSolicitacaoMinutos >= faixaInicioMinutos && horaSolicitacaoMinutos <= faixaFimMinutos) {
                            faixa.acionamentos += 1;
                            if (chamado.tempo_aguardando_suporte) {
                                const tempoEsperaMinutos = horaParaMinutos(chamado.tempo_aguardando_suporte);
                                faixa.tempoMedioEspera += tempoEsperaMinutos;
                            }
                            if (chamado.cancelar_suporte) {
                                faixa.chamadosCancelados += 1;
                            }
                        }
                    });
                });
                resultado.forEach(faixa => {
                    if (faixa.acionamentos > 0) {
                        const totalMinutos = faixa.tempoMedioEspera / faixa.acionamentos;
                        const horas = Math.floor(totalMinutos / 60);
                        const minutos = Math.floor(totalMinutos % 60);
                        const segundos = Math.floor((totalMinutos * 60) % 60);
                        faixa.tempoMedioEsperaFormatado = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
                    }
                    else {
                        faixa.tempoMedioEsperaFormatado = "00:00:00";
                    }
                });
                return resultado;
            }
            catch (e) {
                console.error('Erro no tratamento de dados do Dash:', e);
                throw e;
            }
        });
    }
    static dadosSuporteDash() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.tratamentoDadosDash(yield this.usuariosLogadosDash(), yield this.dadosGeraisSuporteDash());
                return result;
            }
            catch (e) {
                console.error('Erro na autenticação:', e);
                throw e;
            }
        });
    }
}
exports.DashboardService = DashboardService;
