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
exports.SuporteServices = void 0;
const db_1 = __importDefault(require("../database/db"));
const RequestSuporte_1 = require("./RequestSuporte");
const cacheService_1 = require("./cacheService");
class SuporteServices {
    static consultaMatricula(matricula) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const getLogin = yield db_1.default.query('select id_usuario, matricula, login from suporte.tb_login_suporte where matricula = $1', [matricula]);
                if (getLogin.rows.length === 0) {
                    throw new Error('Usuário não encontrado');
                }
                const login = getLogin.rows[0];
                if (!login.login) {
                    throw new Error('Usuário sem login registrado, gentileza acionar o gestor para orientação!');
                }
                if (!login.id_usuario) {
                    throw new Error('Usuário com dados divergentes, gentileza acionar o gestor para orientação!');
                }
                return login;
            }
            catch (e) {
                console.error('Erro na autenticação:', e);
                throw e;
            }
        });
    }
    static cadastrarSuporte(id_solicitante, dt_solicitacao_suporte, hora_solicitacao, mcdu, telefone, unique_id_ligacao) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                const cadastroSuporte = yield client.query('INSERT INTO suporte.tb_chamado_suporte (pk_id_solicitante, dt_solicitacao_suporte, hora_solicitacao_suporte, mcdu, telefone, unique_id_ligacao) values ($1, $2, $3, $4, $5, $6)', [id_solicitante, dt_solicitacao_suporte, hora_solicitacao, mcdu, telefone, unique_id_ligacao]);
                yield client.query('COMMIT');
                return cadastroSuporte;
            }
            catch (e) {
                yield client.query('ROLLBACK');
                console.error('Erro na inserção do suporte: ', e);
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
    static obterIdSuporte(id_solicitante, dt_solicitacao_suporte, hora_solicitacao, mcdu, telefone, unique_id_ligacao) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const localizarIdSuporte = yield db_1.default.query('select distinct a.id_suporte, c.login, a.dt_solicitacao_suporte, a.hora_solicitacao_suporte, b.fila from suporte.tb_chamado_suporte a join trafego.tb_anexo1g b on a.mcdu = b.mcdu join suporte.tb_login_suporte c on a.pk_id_solicitante = c.id_usuario where a.pk_id_solicitante = $1 and a.dt_solicitacao_suporte = $2 and a.hora_solicitacao_suporte = $3 and a.mcdu = $4 and a.telefone = $5 and a.unique_id_ligacao = $6', [id_solicitante, dt_solicitacao_suporte, hora_solicitacao, mcdu, telefone, unique_id_ligacao]);
                if (localizarIdSuporte.rows.length === 0) {
                    throw new Error('Número de suporte não localizado!');
                }
                const id_suporte = localizarIdSuporte.rows[0];
                return id_suporte;
            }
            catch (e) {
                console.error('Erro no select do suporte: ', e);
                throw e;
            }
        });
    }
    static solicitar(matricula, fila, date, hora) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mcdu = parseInt(fila);
                const login = yield this.consultaMatricula(matricula);
                const dados = yield RequestSuporte_1.RequestsSuport.main(login.login);
                if (!dados) {
                    throw new Error('Erro em localizar os dados na request 2cx');
                }
                yield this.cadastrarSuporte(login.id_usuario, date, hora, mcdu, dados.telefone, dados.uniqueId);
                const id_suporte = yield this.obterIdSuporte(login.id_usuario, date, hora, mcdu, dados.telefone, dados.uniqueId);
                return id_suporte;
            }
            catch (e) {
                console.error('Erro na autenticação:', e);
                throw e;
            }
        });
    }
    static cancelar(idCancelamento) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                yield client.query('UPDATE suporte.tb_chamado_suporte SET cancelar_suporte = true where id_suporte = $1', [idCancelamento]);
                yield client.query('COMMIT');
                return idCancelamento;
            }
            catch (e) {
                yield client.query('ROLLBACK');
                console.error('Erro na autenticação:', e);
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
    static atenderSuporte(idSuporte, matSuporte, dtSuporte, hrSuporte, tpAguardado) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                const idSup = yield this.consultaMatricula(matSuporte);
                const checkQuery = 'SELECT pk_id_prestador_suporte, dt_inicio_suporte, hora_inicio_suporte FROM suporte.tb_chamado_suporte WHERE id_suporte = $1';
                const checkResult = yield client.query(checkQuery, [idSuporte]);
                const chamado = checkResult.rows[0];
                if (chamado.pk_id_prestador_suporte || chamado.dt_inicio_suporte || chamado.hora_inicio_suporte) {
                    throw new Error('Chamado já está sendo atendido');
                }
                yield client.query('BEGIN');
                yield client.query('update suporte.tb_chamado_suporte set pk_id_prestador_suporte = $1, dt_inicio_suporte = $2, hora_inicio_suporte = $3, tempo_aguardando_suporte = $4 where id_suporte =$5', [idSup.id_usuario, dtSuporte, hrSuporte, tpAguardado, idSuporte]);
                yield client.query('COMMIT');
                const checkSuport = 'SELECT A.ID_SUPORTE, B.MATRICULA, A.DT_INICIO_SUPORTE, A.HORA_INICIO_SUPORTE FROM SUPORTE.TB_CHAMADO_SUPORTE A JOIN SUPORTE.TB_LOGIN_SUPORTE B ON A.PK_ID_PRESTADOR_SUPORTE = B.ID_USUARIO WHERE A.ID_SUPORTE = $1';
                const result = yield client.query(checkSuport, [idSuporte]);
                const resultado = result.rows[0];
                if (!resultado.id_suporte || !resultado.dt_inicio_suporte || !resultado.hora_inicio_suporte || !resultado.matricula) {
                    throw new Error('Chamado não localizado');
                }
                return resultado;
            }
            catch (e) {
                yield client.query('ROLLBACK');
                console.error('Erro ao atualizar o suporte: ', e);
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
    static consultaSuporte() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const consultaSuporte = yield db_1.default.query('select a.id_suporte, c.login, a.dt_solicitacao_suporte, a.hora_solicitacao_suporte, b.fila from suporte.tb_chamado_suporte a inner join trafego.tb_anexo1g b on a.mcdu = b.mcdu inner join suporte.tb_login_suporte c on a.pk_id_solicitante = c.id_usuario where a.cancelar_suporte <> true and a.pk_id_prestador_suporte is null group by a.id_suporte, a.hora_solicitacao_suporte, b.fila, c.login order by id_suporte asc');
                return consultaSuporte.rows;
            }
            catch (e) {
                console.error('Erro ao atualizar o suporte: ', e);
                throw e;
            }
        });
    }
    static finalizarSuporte(horaFimSuporte, matricula, idSuporte) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                yield client.query('update suporte.tb_chamado_suporte set hora_fim_suporte=$1, encerrado_por=$2 where id_suporte = $3', [horaFimSuporte, matricula, idSuporte]);
                yield client.query('COMMIT');
                return idSuporte;
            }
            catch (e) {
                yield client.query('ROLLBACK');
                console.error('Erro ao atualizar o suporte: ', e);
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
    static consultaChamadosGestao() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cp = yield (0, cacheService_1.getCachedData)();
                if (cp) {
                    const consulta = yield db_1.default.query('select a.id_suporte, c.matricula, c.login, c.nome, a.hora_solicitacao_suporte, a.mcdu, b.fila, a.hora_inicio_suporte, a.tempo_aguardando_suporte, d.nome nome_suporte from suporte.tb_chamado_suporte a join trafego.tb_anexo1g b on a.mcdu = b.mcdu join suporte.tb_login_suporte c on a.pk_id_solicitante = c.id_usuario left join suporte.tb_login_suporte d on a.pk_id_prestador_suporte = d.id_usuario where a.cancelar_suporte <> true and a.encerrado_por isnull and a.dt_solicitacao_suporte = current_date group by a.id_suporte, c.login, c.nome, a.hora_solicitacao_suporte, a.mcdu, b.fila, a.hora_inicio_suporte, a.tempo_aguardando_suporte, d.nome,c.matricula;');
                    const data = consulta.rows;
                    const dataComGestor = data.map(item => {
                        const gestor = cp.find(cpItem => cpItem.matricula === item.matricula);
                        return Object.assign(Object.assign({}, item), { nome_super: gestor ? gestor.nome_super : null });
                    });
                    return dataComGestor;
                }
                else {
                    throw new Error('Dados não encontrados na consulta do CP');
                }
            }
            catch (e) {
                console.error('Erro ao localizar dados de suporte: ', e);
                throw e;
            }
        });
    }
    static cadastrarDemanda(idSuporte, horario_descricao, descricao) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                const cadastroDemanda = yield client.query('insert into suporte.tb_descricao_suporte (pk_id_suporte, horario_descricao, descricao) values ($1, $2, $3)', [idSuporte, horario_descricao, descricao]);
                yield client.query('COMMIT');
                return cadastroDemanda;
            }
            catch (e) {
                yield client.query('ROLLBACK');
                console.error('Erro na inserção do suporte: ', e);
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
    static cadastrarAvaliacao(idSuporte, horario_avaliacao, avaliacao) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                const cadastroDemanda = yield client.query('insert into suporte.tb_avaliacao_suporte (pk_id_suporte,horario_avaliacao, avaliacao) values ($1, $2, $3)', [idSuporte, horario_avaliacao, avaliacao]);
                yield client.query('COMMIT');
                return cadastroDemanda;
            }
            catch (e) {
                yield client.query('ROLLBACK');
                console.error('Erro na inserção do suporte: ', e);
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
}
exports.SuporteServices = SuporteServices;
