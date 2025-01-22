import pool from '../database/db';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/UserModels';

export class UserService {
    public static async login_suporte( id_secao:string, id_usuario:number  ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('INSERT INTO suporte.tb_login_logoff_suporte (id_secao, pk_id_usuario, dt_login, hr_login, status) VALUES($1, $2, now()::date, now()::time, 1) ', [id_secao, id_usuario]);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na vinculação do login:', e);
            throw e;
        }finally {
            client.release();
        }
    }
    public static async deslog_suporte( id_secao:string  ): Promise<any> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('update suporte.tb_login_logoff_suporte  set status = 0, hr_logoff=  now()::time where id_secao = $1  ', [id_secao]);
            await client.query('COMMIT');
            const result = await client.query('SELECT pk_id_usuario FROM suporte.tb_login_logoff_suporte where status = 0 and id_secao = $1 ',[id_secao]);
            if (result.rows.length === 0) {
                throw new Error('seção não encontrado');
            } 
            const secao = result.rows[0];
            return secao;
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na vinculação do logoff:', e);
            throw e;
        }finally {
            client.release();
        }
    }
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
    public static async autenticacao(matricula: number, password: string, socketId:string): Promise<any> {
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
            await this.login_suporte(socketId, user.id_usuario);
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