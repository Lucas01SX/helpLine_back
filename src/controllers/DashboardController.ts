
import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';

export class DashboardController { 
    public async consultaDash(req:Request, res:Response):Promise <void> {
        try {
            const dadosDashboard = await DashboardService.dadosSuporteDash();
            res.status(200).json({dadosDashboard});
        } catch(error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
}

