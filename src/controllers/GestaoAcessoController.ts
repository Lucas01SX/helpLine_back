import { Request, Response } from 'express';
import { GestaoAcessoService } from '../services/GestaoAcessoService';

export class GestaoAcessoController {
    public async cargosGerais(req:Request, res:Response): Promise<void> {
        try {  
            const cargos = await GestaoAcessoService.cargosGerais();
            res.status(200).json({ cargos });            
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async PerfisGerais(req:Request, res:Response): Promise<void> {
        try {  
            const perfis = await GestaoAcessoService.perfisAcesso();
            res.status(200).json({ perfis });            
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async atualizarPerfil(req:Request, res:Response): Promise<void> {
        try {  
            const { idUsuario, matriculaLocal, novoPerfilId, perfilSelecionado } = req.body;
            await GestaoAcessoService.atualizarPerfil(idUsuario, novoPerfilId, matriculaLocal, perfilSelecionado);
            res.status(200).json({ message: 'Perfil alterado com sucesso. Gentileza solicitar ao colaborador que relogue na ferramenta para refletir a alteração!' });            
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async atualizarFilas(req:Request, res:Response): Promise<void> {
        try {  
            const { idUsuario, matricula, login, nome, filas, mcdu, segmentos, situacao, mat_responsavel } = req.body;
            await GestaoAcessoService.atualizarFila(idUsuario, matricula, login, nome, filas, mcdu, segmentos, situacao, mat_responsavel);
            res.status(200).json({ message: 'success' });            
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
}