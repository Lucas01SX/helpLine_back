import pool from "../database/db";

export class GestaoAcessoService {
    public static async cargosGerais(): Promise<any> {
        try {
            const res = await pool.query(`select a.co_funcao, a.de_funcao from trafego.tb_funcao a join cp_jorginho_empregados() b on a.co_funcao::int = b.co_funcao::int where a.co_funcao in('000000944','000001066','000014936','000014937','000000232','000000791','000014943','000000765') group by a.co_funcao, a.de_funcao order by a.de_funcao asc`);
            const cargos = res.rows;
            return cargos;
        } catch (e) {
            console.error('Erro na busca de cargosGerais:', e);
            throw e;
        }
    }
    public static async perfisAcesso(): Promise<any> {
        try {   
            const res = await pool.query(`select a.id_usuario, a.matricula, a.login, a.nome, f.de_funcao, string_agg(ane.segmento,',') segmentos, string_agg(t.fila, ',') filas, string_agg(t.mcdu, ',') mcdu from suporte.tb_login_suporte a left join trafego.tb_funcao f on f.co_funcao::int = a.codfuncao::int left join suporte.tb_skills_staff t on a.matricula = t.matricula::int and t.excluida <> true left join trafego.tb_anexo1g ane on t.mcdu::int = ane.mcdu group by a.id_usuario, a.matricula, a.login, a.nome, f.de_funcao`);
            const perfis = res.rows;
            return perfis;
        } catch (e) {
            console.error('Erro na busca de perfisAcesso:', e);
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
            console.error('Erro na vinculação do registerLog:', e);
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
            console.error('Erro na getIdUsuario:', e);
            throw e;
        }
    }
    public static async atualizarPerfil(id_usuario:number, id_perfil:number, matricula:number, nome_perfil:string): Promise<void> {
        try {   
            
            const { id_usuario: pk_id_usuario_responsavel } = await this.getIdUsuario(matricula);
            await this.updateProfile(id_usuario, id_perfil);
            await this.registerLog(id_usuario, pk_id_usuario_responsavel, nome_perfil)
        } catch (e) {
            console.error('Erro na atualizarPerfil:', e);
            throw e;
        }
    }
    private static async cadastrarFilas(matricula:number, login:string,  filas:string, mcdu:string, mat_responsavel:string): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`INSERT INTO suporte.tb_skills_staff (matricula, login, fila, mcdu,  data_treinamento, matricula_registro, status, observacao, data_alteracao, excluida, prioridade) VALUES($1, $2, $3, $4, current_date, $5, true, 'Inclusão de fila pelo HelpLine', current_timestamp, false, 1) `, [matricula, login, filas, mcdu, mat_responsavel]);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro no cadastro das Filas:', e);
            throw e;
        }finally {
            client.release();
        }
    }
    private static async obterFilasAtuais(matricula: number): Promise<Array<{fila: string, mcdu: string}>> {
        try {
            const res = await pool.query(`
                SELECT fila, mcdu 
                FROM suporte.tb_skills_staff 
                WHERE matricula = $1 
                AND excluida = false
            `, [matricula]);
            
            return res.rows.map(row => ({
                fila: row.fila,
                mcdu: row.mcdu
            }));
        } catch (e) {
            console.error('Erro ao obter filas atuais:', e);
            throw e;
        }
    }
    private static async atualizarStatusFila(matricula: number, fila: string, mcdu: string, excluida: boolean, mat_responsavel: string): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`
                UPDATE suporte.tb_skills_staff 
                SET excluida = $1, 
                    matricula_alteracao = $2,
                    data_alteracao = current_timestamp,
                    observacao = 'Alteração realizada pelo HelpppLine'
                WHERE matricula = $3 
                AND fila = $4 
                AND mcdu = $5
            `, [excluida, mat_responsavel, matricula, fila, mcdu]);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na atualização da fila:', e);
            throw e;
        } finally {
            client.release();
        }
    }

    private static async verificarFilaExistente(matricula: number, fila: string, mcdu: string): Promise<{exists: boolean, excluida: boolean}> {
        try {
            const res = await pool.query(`
                SELECT excluida 
                FROM suporte.tb_skills_staff 
                WHERE matricula = $1 
                AND fila = $2 
                AND mcdu = $3
            `, [matricula, fila, mcdu]);
            
            if (res.rows.length === 0) {
                return {exists: false, excluida: false};
            }
            return {exists: true, excluida: res.rows[0].excluida};
        } catch (e) {
            console.error('Erro na verificação da fila:', e);
            throw e;
        }
    }
    private static async validarFilas(matricula: number, login: string, filas: string, mcdu: string, segmentos: string, situacao: string, mat_responsavel: string): Promise<any> {
    try {   
        const filasVazias = !filas || filas.trim() === '' || filas.trim() === ',';
        const mcduVazios = !mcdu || mcdu.trim() === '' || mcdu.trim() === ',';
        if (filasVazias && mcduVazios) {
            if (situacao === 'ajuste') {
                const filasAtuais = await this.obterFilasAtuais(matricula);
                await Promise.all(filasAtuais.map(async (item) => {
                    await this.atualizarStatusFila(matricula, item.fila, item.mcdu, true, mat_responsavel);
                }));
            }
            return; 
        }
        const filaComMcdu = filas.split(',')
            .map((fila, index) => ({
                fila: fila.trim(),
                mcdu: mcdu.split(',')[index]?.trim() || '' 
            }))
            .filter(item => item.fila && item.mcdu); 

        if (filaComMcdu.length === 0) {
            return; 
        }
        const filasAtuais = await this.obterFilasAtuais(matricula);

        await Promise.all(filaComMcdu.map(async (item) => {
            const {exists, excluida} = await this.verificarFilaExistente(matricula, item.fila, item.mcdu);
            
            if (!exists) {
                await this.cadastrarFilas(matricula, login, item.fila, item.mcdu, mat_responsavel);
            } else if (excluida) {
                await this.atualizarStatusFila(matricula, item.fila, item.mcdu, false, mat_responsavel);
            }
        }));

        const filasParaRemover = filasAtuais.filter(filaAtual => 
            !filaComMcdu.some(item => 
                item.fila === filaAtual.fila && item.mcdu === filaAtual.mcdu
            )
        );

        await Promise.all(filasParaRemover.map(async (item) => {
            await this.atualizarStatusFila(matricula, item.fila, item.mcdu, true, mat_responsavel);
        }));
    } catch (e) {
        console.error('Erro no processamento das filas:', e);
        throw e;
    }
}
    public static async atualizarFila(idUsuario:number, matricula:number, login:string, nome:string, filas:string, mcdu:string, segmentos:string, situacao:string, mat_responsavel:string): Promise<void> {
        try {   
            await this.validarFilas(matricula, login, filas, mcdu, segmentos, situacao, mat_responsavel);
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }
}
