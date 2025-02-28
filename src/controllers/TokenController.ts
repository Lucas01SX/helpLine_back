import { Request, Response } from 'express';
import { TokenService } from '../services/TokenService';

export class TokenController {
    public async atualizarToken(req: Request, res: Response): Promise<void> {
        const { token } = req.body;
        try {
            const dados = await TokenService.atualizarToken(token);
            res.status(200).json({ message: dados });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }        
    }
    public async verificarTokens(req: Request, res: Response): Promise<void> {
        try {
            const tokens = await TokenService.verificarTokens();
            res.status(200).json({ message: 'Tokenn deslogados!', tokens });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }        
    }

}