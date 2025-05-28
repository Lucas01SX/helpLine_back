import pool from "../database/db";

export class GestaoAcessoService {
    public static async cargosGerais(): Promise<any> {
        try {
            const res = await pool.query(`select a.co_funcao, a.de_funcao from trafego.tb_funcao a join cp_jorginho_empregados() b on a.co_funcao::int = b.co_funcao::int where a.co_funcao in('000000944','000001066','000014936','000014937','000000232','000000791','000014943','000000765') group by a.co_funcao, a.de_funcao order by a.de_funcao asc`);
            const cargos = res.rows;
            return cargos;
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }
    public static async perfisAcesso(): Promise<any> {
        try {   
            const res = await pool.query(`select a.id_usuario, a.matricula, a.login, a.nome, f.de_funcao, string_agg(ane.segmento,',') segmentos, string_agg(t.fila, ',') filas, string_agg(t.mcdu, ',') mcdu from suporte.tb_login_suporte a left join trafego.tb_funcao f on f.co_funcao::int = a.codfuncao::int left join suporte.tb_skills_staff t on a.matricula = t.matricula::int left join trafego.tb_anexo1g ane on t.mcdu::int = ane.mcdu group by a.id_usuario, a.matricula, a.login, a.nome, f.de_funcao`);
            const perfis = res.rows;
            return perfis;
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }
    private static async updateProfile( id_usuario:number, perfil:number ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`update suporte.tb_login_suporte set codfuncao = $1 where id_usuario = $2  `, [perfil, id_usuario]);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na vinculação do logoff:', e);
            throw e;
        }finally {
            client.release();
        }
    }
    private static async registerLog( id_usuario:number, pk_id_usuario:number, perfil:string ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`INSERT INTO suporte.tb_log_alteracao_perfil (pk_id_usuario_resetado, pk_id_usuario_responsavel, perfil_selecionado, data_alteracao) VALUES($1,$2,$3 , now() - interval '3 hours'); `, [id_usuario, pk_id_usuario,perfil]);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na vinculação do logoff:', e);
            throw e;
        }finally {
            client.release();
        }
    }
    private static async getIdUsuario(matricula: number): Promise<any> {
        try {
            const res = await pool.query('select id_usuario from suporte.tb_login_suporte where matricula = $1', [matricula]);
            if (res.rows.length === 0) {
                console.log(res.rows, matricula);
                throw new Error('Dados não encontrado');
            } 
            const user = res.rows[0];
            return user;
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }
    public static async atualizarPerfil(id_usuario:number, id_perfil:number, matricula:number, nome_perfil:string): Promise<void> {
        try {   
            
            const { id_usuario: pk_id_usuario_responsavel } = await this.getIdUsuario(matricula);
            await this.updateProfile(id_usuario, id_perfil);
            await this.registerLog(id_usuario, pk_id_usuario_responsavel, nome_perfil)
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }
}