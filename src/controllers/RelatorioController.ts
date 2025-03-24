import { Request, Response } from 'express';
import { RelatorioService } from '../services/RelatorioService';

export class RelatorioController {
    public async relatorioSuporte(req:Request, res:Response): Promise<void> {
        const {suporte, gestor, coordenador, fila, segmento, dataInicio, dataFim, agruparPor } = req.body;
        //console.log("resultad0 controller: ",req.body)
        try{
            const dadosRelatorio = await RelatorioService.relatorioSuporte(suporte, gestor, coordenador, fila, segmento, dataInicio, dataFim, agruparPor);
            res.status(200).json({dadosRelatorio});
        } catch (e){
            if (e instanceof Error){
                res.status(400).json({ message: e.message});
            } else {
                res.status(500).json({ message :'Erro na controller', e});
            }
        }
    }

    public async relatorioCP(req:Request, res:Response): Promise<void> {
        try{
            const dadosCP = await RelatorioService.relatorioCP();
            res.status(200).json({dadosCP});
        } catch (e){
            if (e instanceof Error){
                res.status(400).json({ message: e.message})
            } else {
                res.status(500).json({ message: 'Erro na controller Cp', e})
            }
        }
    }


}
