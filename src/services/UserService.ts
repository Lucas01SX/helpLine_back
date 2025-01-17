import pool from '../database/db';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/UserModels';

export class UserService {
    public static async buscarMatricula(matricula:number): Promise<any> {
        try {
            const res = await pool.query('select matricula, login, nome, co_funcao from public.cp_jorginho_empregados() where matricula = $1', [matricula]);
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
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }
    public static async autenticacao(matricula: number, password: string): Promise<any> {
        try {
            const res = await pool.query('SELECT id_usuario, matricula, login, nome, codfuncao, password FROM suporte.tb_login_suporte WHERE matricula = $1', [matricula]);
            if (res.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }
            const user = res.rows[0];
            if (!user.password) {
                throw new Error('Não há senha cadastrada, por gentileza cadastre sua senha!');
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
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
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }
    public static async criacaoUsuario(matricula: number, password:string): Promise<any> {
        const client = await pool.connect();
        try {
            const dados = await this.buscarMatricula(matricula);
            const hashPass = await bcrypt.hash(password, 10);
            await client.query('BEGIN');
            const ret = await client.query('INSERT INTO suporte.tb_login_suporte (matricula, login, nome, codfuncao, password) VALUES($1,$2,$3,$4, $5) RETURNING * ', [dados.matricula, dados.login, dados.nome, dados.co_funcao, hashPass]);
            await client.query('COMMIT');
            return ret;
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na autenticação:', e);
            throw e;
        } finally {
            client.release();
        }
    }
    public static async atualizacaoSenha(matricula:number, password:string): Promise<any> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const hashPass = await bcrypt.hash(password,10);
            const ret = await client.query('UPDATE suporte.tb_login_suporte SET password=$1 WHERE matricula=$2', [hashPass, matricula]);
            await client.query('COMMIT');
            return ret
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na autenticação:', e);
            throw e;
        } finally {
            client.release();
        }
    }
}