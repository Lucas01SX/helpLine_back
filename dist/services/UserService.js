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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserService {
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
                return userData;
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
}
exports.UserService = UserService;
