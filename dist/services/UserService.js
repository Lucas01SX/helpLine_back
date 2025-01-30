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
exports.UserService = void 0;
const db_1 = __importDefault(require("../database/db"));
const TokenService_1 = require("./TokenService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class UserService {
    static login_suporte(id_secao, id_usuario) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                const dados = yield client.query('select id_login, id_secao, pk_id_usuario, dt_login, hr_login, hr_logoff, status from suporte.tb_login_logoff_suporte where dt_login = current_date and pk_id_usuario = $1 and status = 1 and hr_logoff isnull', [id_usuario]);
                if (dados.rows.length === 0) {
                    yield client.query('BEGIN');
                    yield client.query('INSERT INTO suporte.tb_login_logoff_suporte (id_secao, pk_id_usuario, dt_login, hr_login, status) VALUES($1, $2, now()::date, now()::time, 1) ', [id_secao, id_usuario]);
                    yield client.query('COMMIT');
                    return 'Cadastro realizado com sucesso!';
                }
                else {
                    const res = dados.rows[0];
                    return res.id_secao;
                }
            }
            catch (e) {
                yield client.query('ROLLBACK');
                console.error('Erro na vinculação do login:', e);
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
    static deslog_suporte(id_secao) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                yield client.query('update suporte.tb_login_logoff_suporte  set status = 0, hr_logoff =  now()::time where id_secao = $1  ', [id_secao]);
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
    static buscarMatricula(matricula) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield db_1.default.query('select matricula, login, nome, co_funcao from public.cp_jorginho_empregados() where matricula = $1', [matricula]);
                if (res.rows.length === 0) {
                    throw new Error('Usuário não encontrado');
                }
                const user = res.rows[0];
                if (!user.login) {
                    throw new Error('Usuário sem login registrado, gentileza acionar o gestor para orientação!');
                }
                if (!user.nome) {
                    throw new Error('Usuário com nome divergente, gentileza acionar o gestor para orientação!');
                }
                if (!user.co_funcao) {
                    throw new Error('Usuário com a função incorreta, gentileza acionar o gestor para orientação!');
                }
                return user;
            }
            catch (e) {
                console.error('Erro na autenticação:', e);
                throw e;
            }
        });
    }
    static autenticacao(matricula, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield db_1.default.query('SELECT id_usuario, matricula, login, nome, codfuncao, password FROM suporte.tb_login_suporte WHERE matricula = $1', [matricula]);
                if (res.rows.length === 0) {
                    throw new Error('Usuário não encontrado');
                }
                const user = res.rows[0];
                if (!user.password) {
                    throw new Error('Não há senha cadastrada, por gentileza cadastre sua senha!');
                }
                const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
                if (!isPasswordValid) {
                    throw new Error('Senha inválida');
                }
                const userData = {
                    id_usuario: user.id_usuario,
                    matricula: user.matricula,
                    login: user.login,
                    nome: user.nome,
                    codfuncao: user.codfuncao
                };
                const secretKey = '79F49A2A9A1C99C52E655346CB579';
                const token = jsonwebtoken_1.default.sign({ userId: user.id_usuario }, secretKey, { expiresIn: '1d' });
                const suporte = yield this.login_suporte(token, user.id_usuario);
                if (suporte === 'Cadastro realizado com sucesso!') {
                    TokenService_1.TokenService.atualizarToken(token);
                    return Object.assign(Object.assign({}, userData), { token: token });
                }
                else {
                    TokenService_1.TokenService.atualizarToken(suporte);
                    return Object.assign(Object.assign({}, userData), { token: suporte });
                }
            }
            catch (e) {
                console.error('Erro na autenticação:', e);
                throw e;
            }
        });
    }
    static criacaoUsuario(matricula, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                const dados = yield this.buscarMatricula(matricula);
                const hashPass = yield bcryptjs_1.default.hash(password, 10);
                yield client.query('BEGIN');
                const ret = yield client.query('INSERT INTO suporte.tb_login_suporte (matricula, login, nome, codfuncao, password) VALUES($1,$2,$3,$4, $5) RETURNING * ', [dados.matricula, dados.login, dados.nome, dados.co_funcao, hashPass]);
                yield client.query('COMMIT');
                return ret;
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
    static atualizacaoSenha(matricula, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                const hashPass = yield bcryptjs_1.default.hash(password, 10);
                const ret = yield client.query('UPDATE suporte.tb_login_suporte SET password=$1 WHERE matricula=$2', [hashPass, matricula]);
                yield client.query('COMMIT');
                return ret;
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
    static usuariosLogados() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db_1.default.query(`select b.login, b.nome from suporte.tb_login_logoff_suporte a join suporte.tb_login_suporte b on a.pk_id_usuario = b.id_usuario where a.dt_login = current_date and a.status = 1 order by b.nome asc`);
                return result.rows;
            }
            catch (e) {
                console.error('Erro na autenticação:', e);
                throw e;
            }
        });
    }
    static idResetSenha(matricula_resetado, matricula_solicitante) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db_1.default.query(`select id_usuario, matricula from suporte.tb_login_suporte where matricula in($1,$2)`, [matricula_resetado, matricula_solicitante]);
                return result.rows;
            }
            catch (e) {
                console.error('Erro na autenticação:', e);
                throw e;
            }
        });
    }
    static logResetSenha(id_suporte_resetado, id_suporte_solicitacao) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                yield client.query(`INSERT INTO suporte.tb_log_reset_senha (dt_reset_senha, hr_reset_senha, pk_id_usuario_resetado, pk_id_usuario_solicitante) VALUES(current_date, now()::time, $1, $2) `, [id_suporte_resetado, id_suporte_solicitacao]);
                yield client.query('COMMIT');
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
    static resetSenha(matricula_reset) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                yield client.query(`UPDATE suporte.tb_login_suporte SET password=null WHERE matricula=$1`, [matricula_reset]);
                yield client.query('COMMIT');
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
    static reset(matricula_reset, matricula_solicitacao) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.idResetSenha(matricula_reset, matricula_solicitacao);
                let id_resetado = undefined;
                let id_solicitante = undefined;
                result.forEach((row) => {
                    if (row.matricula === matricula_reset) {
                        id_resetado = row.id_usuario;
                    }
                    else if (row.matricula === matricula_solicitacao) {
                        id_solicitante = row.id_usuario;
                    }
                });
                if (id_resetado === undefined || id_solicitante === undefined) {
                    throw new Error('IDs não encontrados para as matrículas fornecidas.');
                }
                yield this.logResetSenha(id_resetado, id_solicitante);
                yield this.resetSenha(matricula_reset);
            }
            catch (e) {
                console.error('Erro na autenticação:', e);
                throw e;
            }
        });
    }
}
exports.UserService = UserService;
