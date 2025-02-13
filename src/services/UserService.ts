import pool from '../database/db';
import { TokenService } from './TokenService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class UserService {
    public static async login_suporte( id_secao:string, id_usuario:number  ): Promise<any> {
        const client = await pool.connect();
        try {
            const dados = await client.query('select id_login, id_secao, pk_id_usuario, dt_login, hr_login, hr_logoff, status from suporte.tb_login_logoff_suporte where dt_login = current_date and pk_id_usuario = $1 and status = 1 and hr_logoff isnull', [id_usuario]);
            if (dados.rows.length === 0) {
                await client.query('BEGIN');
                await client.query(`INSERT INTO suporte.tb_login_logoff_suporte (id_secao, pk_id_usuario, dt_login, hr_login, status) VALUES($1, $2, now()::date, now()::time - '03:00:00'::time, 1) `, [id_secao, id_usuario]);
                await client.query('COMMIT');
                return 'Cadastro realizado com sucesso!';
            } else {
                const res = dados.rows[0];
                return res.id_secao;
            }
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na vinculação do login:', e);
            throw e;
        }finally {
            client.release();
        }
    }
    public static async deslog_suporte( id_secao:string  ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`update suporte.tb_login_logoff_suporte  set status = 0, hr_logoff =  now()::time - '03:00:00'::time where id_secao = $1  `, [id_secao]);
            await client.query('COMMIT');
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
            const secretKey = '79F49A2A9A1C99C52E655346CB579';
            const token = jwt.sign({userId: user.id_usuario}, secretKey, {expiresIn: '1d'});
            const suporte = await this.login_suporte(token, user.id_usuario);
            if (suporte === 'Cadastro realizado com sucesso!') {
                TokenService.atualizarToken(token);
                return {...userData, token: token};
            } else {
                TokenService.atualizarToken(suporte);
                return {...userData, token: suporte};
            }
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
    public static async usuariosLogados() :Promise<any> {
        try {
            const result = await pool.query(`select b.login, b.nome, b.codfuncao, e.de_funcao, string_agg(d.segmento, ',') as segmento, string_agg(c.fila, ',') as fila, string_agg(c.mcdu, ',') as mcdu from suporte.tb_login_logoff_suporte a join suporte.tb_login_suporte b on a.pk_id_usuario = b.id_usuario join suporte.tb_skills_staff c on b.matricula = c.matricula::int join trafego.tb_anexo1g d on c.mcdu::int = d.mcdu join trafego.tb_funcao e on e.co_funcao::int = b.codfuncao where a.dt_login = current_date and a.status = 1 and c.excluida = false group by b.login, b.nome, e.de_funcao, b.codfuncao order by b.nome asc`);
            return result.rows;
        } catch (e) {
            console.error('Erro em validar logados:', e);
            throw e;
        }
    }
    public static async idResetSenha(matricula_resetado:number, matricula_solicitante:number): Promise<any> {
        try {
            const result = await pool.query(`select id_usuario, matricula from suporte.tb_login_suporte where matricula in($1,$2)`, [matricula_resetado, matricula_solicitante]);
            return result.rows;
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }
    public static async logResetSenha(id_suporte_resetado:number, id_suporte_solicitacao:number): Promise<any> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`INSERT INTO suporte.tb_log_reset_senha (dt_reset_senha, hr_reset_senha, pk_id_usuario_resetado, pk_id_usuario_solicitante) VALUES(current_date, now()::time - '03:00:00'::time, $1, $2) `, [id_suporte_resetado,id_suporte_solicitacao]);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na autenticação:', e);
            throw e;
        } finally {
            client.release();
        }
    }
    public static async resetSenha(matricula_reset:number):Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`UPDATE suporte.tb_login_suporte SET password=null WHERE matricula=$1`, [matricula_reset]);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na autenticação:', e);
            throw e;
        } finally {
            client.release();
        }
    }
    public static async reset(matricula_reset: number, matricula_solicitacao: number): Promise<void> {
        try {
            const result = await this.idResetSenha(matricula_reset, matricula_solicitacao);
            let id_resetado: number | undefined = undefined;
            let id_solicitante: number | undefined = undefined;
            result.forEach((row: { id_usuario: number, matricula: number }) => {
                if (row.matricula === matricula_reset) {
                    id_resetado = row.id_usuario;
                } else if (row.matricula === matricula_solicitacao) {
                    id_solicitante = row.id_usuario;
                }
            });
            if (id_resetado === undefined || id_solicitante === undefined) {
                throw new Error('IDs não encontrados para as matrículas fornecidas.');
            }
            await this.logResetSenha(id_resetado, id_solicitante);
            await this.resetSenha(matricula_reset);
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }

}