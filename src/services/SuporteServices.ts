import { homedir } from 'os';
import pool from '../database/db';
import { RequestsSuport } from './RequestSuporte';
import { getCachedData  } from './cacheService';
import { CachedData } from '../models/Cache';
import { FilasService } from './FilasServices';


export class SuporteServices {
    public static async consultaMatricula(matricula:number): Promise<any> {
        try {
            const getLogin = await pool.query('select id_usuario, matricula, login from suporte.tb_login_suporte where matricula = $1', [matricula]);
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
            return login
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }
    public static async cadastrarSuporte(id_solicitante:number, dt_solicitacao_suporte:string, hora_solicitacao:string, mcdu:number, telefone:string, unique_id_ligacao:string): Promise<any> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const cadastroSuporte = await client.query('INSERT INTO suporte.tb_chamado_suporte (pk_id_solicitante, dt_solicitacao_suporte, hora_solicitacao_suporte, mcdu, telefone, unique_id_ligacao) values ($1, $2, $3, $4, $5, $6)', [id_solicitante, dt_solicitacao_suporte, hora_solicitacao, mcdu, telefone, unique_id_ligacao]);
            await client.query('COMMIT');
            return cadastroSuporte;
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na inserção do suporte: ', e);
            throw e;
        }finally {
            client.release();
        }
    }
    public static async obterIdSuporte(id_solicitante:number, dt_solicitacao_suporte:string, hora_solicitacao:string, mcdu:number, telefone:string, unique_id_ligacao:string) : Promise<number>{
        try {
            const localizarIdSuporte = await pool.query('select distinct a.id_suporte, c.login, a.dt_solicitacao_suporte, a.hora_solicitacao_suporte, b.fila from suporte.tb_chamado_suporte a join trafego.tb_anexo1g b on a.mcdu = b.mcdu join suporte.tb_login_suporte c on a.pk_id_solicitante = c.id_usuario where a.pk_id_solicitante = $1 and a.dt_solicitacao_suporte = $2 and a.hora_solicitacao_suporte = $3 and a.mcdu = $4 and a.telefone = $5 and a.unique_id_ligacao = $6', [id_solicitante, dt_solicitacao_suporte, hora_solicitacao, mcdu, telefone, unique_id_ligacao]);
            if (localizarIdSuporte.rows.length === 0) {
                throw new Error('Número de suporte não localizado!');
            }
            const id_suporte = localizarIdSuporte.rows[0];
            return id_suporte;
        } catch (e) {
            console.error('Erro no select do suporte: ', e);
            throw e;
        }
    }
    public static async solicitar(matricula:number, fila:string, date:string, hora:string): Promise<any> {
        try {
            const mcdu = parseInt(fila);
            const login = await this.consultaMatricula(matricula);
            
            // Obter todas as filas de WhatsApp
            const filasWhatsapp = await FilasService.filasGerais();
            const whatsappMcduList = filasWhatsapp
                .filter((f: any) => f.segmento === 'WHATSAPP')
                .map((f: any) => parseInt(f.mcdu));
            
            // Verificar se o mcdu atual é uma fila de WhatsApp
            const isWhatsapp = whatsappMcduList.includes(mcdu);
            
            let telefone = '';
            let uniqueId = '';
            
            if (!isWhatsapp) {
                // Fluxo normal com request
                const dados = await RequestsSuport.main(login.login);
                if (!dados) {
                    throw new Error('Erro em localizar os dados na request 2cx');
                }
                telefone = dados.telefone;
                uniqueId = dados.uniqueId;
            } else {
                // Fluxo WhatsApp - valores padrão
                telefone = 'WHATSAPP';
                uniqueId = 'WHATSAPP_' + Date.now().toString();
            }
            
            await this.cadastrarSuporte(login.id_usuario, date, hora, mcdu, telefone, uniqueId);
            const id_suporte = await this.obterIdSuporte(
                login.id_usuario, date, hora, mcdu, telefone, uniqueId
            );
            
            return id_suporte;
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        } 
    }
    public static async cancelar(idCancelamento:number): Promise<any> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client .query('UPDATE suporte.tb_chamado_suporte SET cancelar_suporte = true where id_suporte = $1', [idCancelamento]);
            await client.query('COMMIT');
            return idCancelamento;
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na autenticação:', e);
            throw e;
        } finally {
            client.release();
        }
    }
    public static async atenderSuporte(idSuporte: number, matSuporte:number, dtSuporte:string, hrSuporte:string, tpAguardado:string): Promise<void | any> {
        const client = await pool.connect();
        try {
            const idSup = await this.consultaMatricula(matSuporte);
            const checkQuery = 'SELECT pk_id_prestador_suporte, dt_inicio_suporte, hora_inicio_suporte FROM suporte.tb_chamado_suporte WHERE id_suporte = $1';
            const checkResult = await client.query(checkQuery, [idSuporte]);
            const chamado = checkResult.rows[0];
            if (chamado.pk_id_prestador_suporte || chamado.dt_inicio_suporte || chamado.hora_inicio_suporte) {
                throw new Error('Chamado já está sendo atendido');
            }
            await client.query('BEGIN');
            await client.query('update suporte.tb_chamado_suporte set pk_id_prestador_suporte = $1, dt_inicio_suporte = $2, hora_inicio_suporte = $3, tempo_aguardando_suporte = $4 where id_suporte =$5',[ idSup.id_usuario, dtSuporte, hrSuporte, tpAguardado,  idSuporte]);
            await client.query('COMMIT');
            const checkSuport = 'SELECT A.ID_SUPORTE, B.MATRICULA, A.DT_INICIO_SUPORTE, A.HORA_INICIO_SUPORTE FROM SUPORTE.TB_CHAMADO_SUPORTE A JOIN SUPORTE.TB_LOGIN_SUPORTE B ON A.PK_ID_PRESTADOR_SUPORTE = B.ID_USUARIO WHERE A.ID_SUPORTE = $1';
            const result = await client.query(checkSuport, [idSuporte]);
            const resultado = result.rows[0];
            if (!resultado.id_suporte || !resultado.dt_inicio_suporte || !resultado.hora_inicio_suporte || !resultado.matricula) {
                throw new Error('Chamado não localizado');
            }
            return resultado;
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro ao atualizar o suporte: ', e);
            throw e;
        } finally {
            client.release();
        }
    }
    public static async consultaSuporte(): Promise<any> {
        try {
            const consultaSuporte = await pool.query('select a.id_suporte, c.login, a.dt_solicitacao_suporte, a.hora_solicitacao_suporte, b.fila from suporte.tb_chamado_suporte a inner join trafego.tb_anexo1g b on a.mcdu = b.mcdu inner join suporte.tb_login_suporte c on a.pk_id_solicitante = c.id_usuario where a.cancelar_suporte <> true and a.pk_id_prestador_suporte is null group by a.id_suporte, a.hora_solicitacao_suporte, b.fila, c.login order by id_suporte asc');
            return consultaSuporte.rows;
        } catch (e) {
            console.error('Erro ao atualizar o suporte: ', e);
            throw e;
        }
    }
    public static async finalizarSuporte(horaFimSuporte:string, matricula:string, idSuporte:number): Promise<void | any> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('update suporte.tb_chamado_suporte set hora_fim_suporte=$1, encerrado_por=$2 where id_suporte = $3',[horaFimSuporte, matricula, idSuporte]);
            await client.query('COMMIT');
            return idSuporte;
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro ao atualizar o suporte: ', e);
            throw e;
        } finally {
            client.release();
        }
    }
    public static async consultaChamadosGestao(): Promise<void | any> {
        try {
            const cp: CachedData[] = await getCachedData();
            if (cp) {
                const consulta = await pool.query('select a.id_suporte, c.matricula, c.login, c.nome, a.hora_solicitacao_suporte, a.mcdu, b.fila, a.hora_inicio_suporte, a.tempo_aguardando_suporte, d.nome nome_suporte from suporte.tb_chamado_suporte a join trafego.tb_anexo1g b on a.mcdu = b.mcdu join suporte.tb_login_suporte c on a.pk_id_solicitante = c.id_usuario left join suporte.tb_login_suporte d on a.pk_id_prestador_suporte = d.id_usuario where a.cancelar_suporte <> true and a.encerrado_por isnull and a.dt_solicitacao_suporte = current_date group by a.id_suporte, c.login, c.nome, a.hora_solicitacao_suporte, a.mcdu, b.fila, a.hora_inicio_suporte, a.tempo_aguardando_suporte, d.nome,c.matricula;');
                const data = consulta.rows;
                const dataComGestor = data.map(item => {
                    const gestor = cp.find(cpItem => cpItem.matricula === item.matricula);
                    return {
                        ...item,
                        nome_super: gestor ? gestor.nome_super : null
                    };
                });
                return dataComGestor;
            } else {
                throw new Error('Dados não encontrados na consulta do CP');
            }
        } catch (e) {
            console.error('Erro ao localizar dados de suporte: ', e);
            throw e;
        } 
    }
    public static async cadastrarDemanda(idSuporte:number,horario_descricao:string, descricao:string): Promise<any> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const cadastroDemanda = await client.query('insert into suporte.tb_descricao_suporte (pk_id_suporte, horario_descricao, descricao) values ($1, $2, $3)', [idSuporte, horario_descricao, descricao]);
            await client.query('COMMIT');
            return cadastroDemanda;
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na inserção do suporte: ', e);
            throw e;
        }finally {
            client.release();
        }
    }
    public static async cadastrarAvaliacao(idSuporte:number,horario_avaliacao:string, avaliacao:number): Promise<any> {
        const client = await pool.connect();
        if (avaliacao==0){
            console.log(avaliacao)
            console.error('Suporte não avaliado')
        }
        else{
        try {
            await client.query('BEGIN');
            const cadastroDemanda = await client.query('insert into suporte.tb_avaliacao_suporte (pk_id_suporte,horario_avaliacao, avaliacao) values ($1, $2, $3)', [idSuporte, horario_avaliacao, avaliacao]);
            await client.query('COMMIT');
            return cadastroDemanda;
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Erro na inserção do suporte: ', e);
            throw e;
        }finally {
            client.release();
        }
        }
    }

}
