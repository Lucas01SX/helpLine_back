import NodeCache from 'node-cache';
import pool from '../database/db';
import { CachedData, cacheRel} from '../models/Cache';

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
const cache_relatorio = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
export default cache; cache_relatorio;

export const updateCache = async () => {
    const data = await pool.query(`SELECT a.matricula, a.login, a.co_funcao::text as cod,a.nome, a.mat_gestor AS mat_super, b.nome AS nome_super, b.mat_gestor AS mat_coord, c.nome AS coordenador FROM cp_jorginho_empregados() a JOIN cp_jorginho_empregados() b ON a.mat_gestor = b.login JOIN cp_jorginho_empregados() c ON b.mat_gestor = c.login WHERE a.login IS NOT null`);
    cache.set('importantData', data.rows);
};

export const cacheRelatorio = async () => {
    const data = await pool.query (`WITH tb_cp AS (SELECT dt_historico::DATE AS data, matricula, login, nome, mat_gestor, co_funcao FROM pesquisa_cp_jorginho(current_date-40, current_date)), anexo AS (SELECT DISTINCT mcdu, fila, segmento FROM trafego.tb_anexo1g) SELECT f.data, a.dt_solicitacao_suporte AS data, a.id_suporte AS id, c.nome AS operador, f.nome AS suporte, h.nome AS gestor, k.nome AS coordenador,a.unique_id_ligacao, b.fila, b.segmento, i.avaliacao, a.hora_inicio_suporte, a.hora_solicitacao_suporte, a.hora_fim_suporte, j.descricao FROM suporte.tb_chamado_suporte a JOIN anexo b ON a.mcdu = b.mcdu LEFT JOIN suporte.tb_login_suporte c ON a.pk_id_solicitante = c.id_usuario LEFT JOIN suporte.tb_login_suporte d ON a.pk_id_prestador_suporte = d.id_usuario LEFT JOIN tb_cp f ON d.login = f.login AND a.dt_solicitacao_suporte = f.data JOIN tb_cp g ON c.login = g.login AND a.dt_solicitacao_suporte = g.data AND g.login NOT IN ('14936') LEFT JOIN tb_cp h ON f.mat_gestor = h.login AND a.dt_solicitacao_suporte = h.data AND h.login NOT IN ('14936') LEFT JOIN suporte.tb_avaliacao_suporte i ON id_suporte = i.pk_id_suporte LEFT JOIN suporte.tb_descricao_suporte j ON id_suporte = j.pk_id_suporte LEFT JOIN tb_cp k ON h.mat_gestor = k.login GROUP BY f.data, f.nome, b.fila, b.segmento, i.avaliacao, a.hora_inicio_suporte, a.hora_solicitacao_suporte, a.hora_fim_suporte, a.dt_solicitacao_suporte, a.id_suporte, h.nome, k.nome, c.nome, j.descricao`)
    cache.set('relatorioData', data.rows);

}
export const getCachedData = async (): Promise<CachedData[]> => {
    const cachedData = cache.get<CachedData[]>('importantData');
    return cachedData ? cachedData : [];
};

export const getCacheRel = async (): Promise<cacheRel[]> => {
    const cacheRelatorio = cache.get<cacheRel[]>('relatorioData');
    return cacheRelatorio ? cacheRelatorio: [];
}   