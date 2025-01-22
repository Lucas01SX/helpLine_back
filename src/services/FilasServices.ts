import pool from "../database/db";
import { FilasModels } from "../models/FilasModel";

export class FilasService {
    public static async filasGerais(): Promise<any> {
        try {
            const res = await pool.query(`select distinct segmento, mcdu, fila from trafego.tb_anexo1g where status  <> 'Desativa' and current_date between data_inicio and data_fim order by fila asc`);
            const filas = res.rows;
            return filas;
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }
    public static async consultaSkill(matricula:number): Promise<any> {
        try {
            const res = await pool.query(`select matricula, login, string_agg(mcdu,',') mcdu, string_agg(fila,',') fila from suporte.tb_skills_staff where excluida <> true and matricula = $1 group by matricula, login`,[matricula]);
            if (res.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            } 
            const skills = res.rows[0];
            return skills;
        } catch (e) {
            console.error('Erro na busca das skills:', e);
            throw e;
        }
    }
}