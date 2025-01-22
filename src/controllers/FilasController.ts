import { Request, Response } from 'express';
import { FilasService } from '../services/FilasServices';

export class FilasController {
    public async filasGerais(req:Request, res:Response): Promise<void> {
        try {  
            const filas = await FilasService.filasGerais();
            res.status(200).json({ filas });            
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async consultaSkill(req:Request, res:Response): Promise<void> {
        try {
            const { matricula }  = req.body;
            const mat = parseInt(matricula)
            const filas = await FilasService.consultaSkill(mat);
            res.status(200).json({ message: 'Consulta realizada com sucesso',filas });            
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
}