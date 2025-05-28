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
exports.GestaoAcessoService = void 0;
const db_1 = __importDefault(require("../database/db"));
class GestaoAcessoService {
    static cargosGerais() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield db_1.default.query(`select a.co_funcao, a.de_funcao from trafego.tb_funcao a join cp_jorginho_empregados() b on a.co_funcao::int = b.co_funcao::int where a.co_funcao in('000000944','000001066','000014936','000014937','000000232','000000791','000014943','000000765') group by a.co_funcao, a.de_funcao order by a.de_funcao asc`);
                const cargos = res.rows;
                return cargos;
            }
            catch (e) {
                console.error('Erro na busca de cargosGerais:', e);
                throw e;
            }
        });
    }
    static perfisAcesso() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield db_1.default.query(`select a.id_usuario, a.matricula, a.login, a.nome, f.de_funcao, string_agg(ane.segmento,',') segmentos, string_agg(t.fila, ',') filas, string_agg(t.mcdu, ',') mcdu from suporte.tb_login_suporte a left join trafego.tb_funcao f on f.co_funcao::int = a.codfuncao::int left join suporte.tb_skills_staff t on a.matricula = t.matricula::int and t.excluida <> true left join trafego.tb_anexo1g ane on t.mcdu::int = ane.mcdu group by a.id_usuario, a.matricula, a.login, a.nome, f.de_funcao`);
                const perfis = res.rows;
                return perfis;
            }
            catch (e) {
                console.error('Erro na busca de perfisAcesso:', e);
                throw e;
            }
        });
    }
    static updateProfile(id_usuario, perfil) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                yield client.query(`update suporte.tb_login_suporte set codfuncao = $1 where id_usuario = $2  `, [perfil, id_usuario]);
                yield client.query('COMMIT');
            }
            catch (e) {
                yield client.query('ROLLBACK');
                console.error('Erro na vinculação do logoff:', e);
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
    static registerLog(id_usuario, pk_id_usuario, perfil) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                yield client.query(`INSERT INTO suporte.tb_log_alteracao_perfil (pk_id_usuario_resetado, pk_id_usuario_responsavel, perfil_selecionado, data_alteracao) VALUES($1,$2,$3 , now() - interval '3 hours'); `, [id_usuario, pk_id_usuario, perfil]);
                yield client.query('COMMIT');
            }
            catch (e) {
                yield client.query('ROLLBACK');
                console.error('Erro na vinculação do registerLog:', e);
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
    static getIdUsuario(matricula) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield db_1.default.query('select id_usuario from suporte.tb_login_suporte where matricula = $1', [matricula]);
                if (res.rows.length === 0) {
                    console.log(res.rows, matricula);
                    throw new Error('Dados não encontrado');
                }
                const user = res.rows[0];
                return user;
            }
            catch (e) {
                console.error('Erro na getIdUsuario:', e);
                throw e;
            }
        });
    }
    static atualizarPerfil(id_usuario, id_perfil, matricula, nome_perfil) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id_usuario: pk_id_usuario_responsavel } = yield this.getIdUsuario(matricula);
                yield this.updateProfile(id_usuario, id_perfil);
                yield this.registerLog(id_usuario, pk_id_usuario_responsavel, nome_perfil);
            }
            catch (e) {
                console.error('Erro na atualizarPerfil:', e);
                throw e;
            }
        });
    }
    static cadastrarFilas(matricula, login, filas, mcdu, mat_responsavel) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                yield client.query(`INSERT INTO suporte.tb_skills_staff (matricula, login, fila, mcdu,  data_treinamento, matricula_registro, status, observacao, data_alteracao, excluida, prioridade) VALUES($1, $2, $3, $4, current_date, $5, true, 'Inclusão de fila pelo HelpLine', current_timestamp, false, 1) `, [matricula, login, filas, mcdu, mat_responsavel]);
                yield client.query('COMMIT');
            }
            catch (e) {
                yield client.query('ROLLBACK');
                console.error('Erro no cadastro das Filas:', e);
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
    static obterFilasAtuais(matricula) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield db_1.default.query(`
                SELECT fila, mcdu 
                FROM suporte.tb_skills_staff 
                WHERE matricula = $1 
                AND excluida = false
            `, [matricula]);
                return res.rows.map(row => ({
                    fila: row.fila,
                    mcdu: row.mcdu
                }));
            }
            catch (e) {
                console.error('Erro ao obter filas atuais:', e);
                throw e;
            }
        });
    }
    static atualizarStatusFila(matricula, fila, mcdu, excluida, mat_responsavel) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                yield client.query(`
                UPDATE suporte.tb_skills_staff 
                SET excluida = $1, 
                    matricula_alteracao = $2,
                    data_alteracao = current_timestamp,
                    observacao = 'Alteração realizada pelo HelpppLine'
                WHERE matricula = $3 
                AND fila = $4 
                AND mcdu = $5
            `, [excluida, mat_responsavel, matricula, fila, mcdu]);
                yield client.query('COMMIT');
            }
            catch (e) {
                yield client.query('ROLLBACK');
                console.error('Erro na atualização da fila:', e);
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
    static verificarFilaExistente(matricula, fila, mcdu) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield db_1.default.query(`
                SELECT excluida 
                FROM suporte.tb_skills_staff 
                WHERE matricula = $1 
                AND fila = $2 
                AND mcdu = $3
            `, [matricula, fila, mcdu]);
                if (res.rows.length === 0) {
                    return { exists: false, excluida: false };
                }
                return { exists: true, excluida: res.rows[0].excluida };
            }
            catch (e) {
                console.error('Erro na verificação da fila:', e);
                throw e;
            }
        });
    }
    static validarFilas(matricula, login, filas, mcdu, segmentos, situacao, mat_responsavel) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filasVazias = !filas || filas.trim() === '' || filas.trim() === ',';
                const mcduVazios = !mcdu || mcdu.trim() === '' || mcdu.trim() === ',';
                if (filasVazias && mcduVazios) {
                    if (situacao === 'ajuste') {
                        const filasAtuais = yield this.obterFilasAtuais(matricula);
                        yield Promise.all(filasAtuais.map((item) => __awaiter(this, void 0, void 0, function* () {
                            yield this.atualizarStatusFila(matricula, item.fila, item.mcdu, true, mat_responsavel);
                        })));
                    }
                    return;
                }
                const filaComMcdu = filas.split(',')
                    .map((fila, index) => {
                    var _a;
                    return ({
                        fila: fila.trim(),
                        mcdu: ((_a = mcdu.split(',')[index]) === null || _a === void 0 ? void 0 : _a.trim()) || ''
                    });
                })
                    .filter(item => item.fila && item.mcdu);
                if (filaComMcdu.length === 0) {
                    return;
                }
                const filasAtuais = yield this.obterFilasAtuais(matricula);
                yield Promise.all(filaComMcdu.map((item) => __awaiter(this, void 0, void 0, function* () {
                    const { exists, excluida } = yield this.verificarFilaExistente(matricula, item.fila, item.mcdu);
                    if (!exists) {
                        yield this.cadastrarFilas(matricula, login, item.fila, item.mcdu, mat_responsavel);
                    }
                    else if (excluida) {
                        yield this.atualizarStatusFila(matricula, item.fila, item.mcdu, false, mat_responsavel);
                    }
                })));
                const filasParaRemover = filasAtuais.filter(filaAtual => !filaComMcdu.some(item => item.fila === filaAtual.fila && item.mcdu === filaAtual.mcdu));
                yield Promise.all(filasParaRemover.map((item) => __awaiter(this, void 0, void 0, function* () {
                    yield this.atualizarStatusFila(matricula, item.fila, item.mcdu, true, mat_responsavel);
                })));
            }
            catch (e) {
                console.error('Erro no processamento das filas:', e);
                throw e;
            }
        });
    }
    static atualizarFila(idUsuario, matricula, login, nome, filas, mcdu, segmentos, situacao, mat_responsavel) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.validarFilas(matricula, login, filas, mcdu, segmentos, situacao, mat_responsavel);
            }
            catch (e) {
                console.error('Erro na autenticação:', e);
                throw e;
            }
        });
    }
}
exports.GestaoAcessoService = GestaoAcessoService;
