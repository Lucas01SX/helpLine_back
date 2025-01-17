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
class SuporteServices {
    static consultaMatriculaSolicitante(matricula) {
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
                const localizarIdSuporte = yield db_1.default.query('select id_suporte from suporte.tb_chamado_suporte where pk_id_solicitante = $1 and dt_solicitacao_suporte = $2 and hora_solicitacao_suporte = $3 and mcdu = $4 and telefone = $5 and unique_id_ligacao = $6', [id_solicitante, dt_solicitacao_suporte, hora_solicitacao, mcdu, telefone, unique_id_ligacao]);
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
                const login = yield this.consultaMatriculaSolicitante(matricula);
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
                return "Cancelamento realizado com sucesso";
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
    static atenderSuporte(idSuporte, idOperador) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                const atualizarSuporte = yield client.query('UPDATE suporte.tb_chamado_suporte SET status = $1, operador_atendimento = $2 WHERE id_suporte = $3', ['atendido', idOperador, idSuporte]);
                yield client.query('COMMIT');
                return atualizarSuporte;
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
            const client = yield db_1.default.connect();
            try {
                const consultaSuporte = yield client.query('SELECT a.id_suporte, a.dt_solicitacao_suporte, a.hora_solicitacao_suporte, b.fila FROM suporte.tb_chamado_suporte a INNER JOIN trafego.tb_anexo1g b ON a.mcdu = b.mcdu WHERE a.cancelar_suporte <> true AND a.pk_id_prestador_suporte IS NULL GROUP BY a.id_suporte, a.hora_solicitacao_suporte, b.fila ORDER BY id_suporte ASC');
                return consultaSuporte.rows;
            }
            catch (e) {
                console.error('Erro ao atualizar o suporte: ', e);
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
}
exports.SuporteServices = SuporteServices;
