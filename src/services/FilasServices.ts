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
}