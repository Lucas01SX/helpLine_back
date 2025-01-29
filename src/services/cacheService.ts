import NodeCache from 'node-cache';
import pool from '../database/db';
import { CachedData } from '../models/Cache';

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
export default cache;

export const updateCache = async () => {
    const data = await pool.query(`SELECT a.matricula, a.login, a.nome, a.mat_gestor AS mat_super, b.nome AS nome_super, b.mat_gestor AS mat_coord, c.nome AS coordenador FROM cp_jorginho_empregados() a JOIN cp_jorginho_empregados() b ON a.mat_gestor = b.login JOIN cp_jorginho_empregados() c ON b.mat_gestor = c.login WHERE a.login IS NOT NULL`);
    cache.set('importantData', data.rows);
};

export const getCachedData = async (): Promise<CachedData[]> => {
    const cachedData = cache.get<CachedData[]>('importantData');
    return cachedData ? cachedData : [];
};