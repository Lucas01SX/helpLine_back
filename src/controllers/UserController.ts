import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

export class UserController {
    public async validacaoUsuario(req: Request, res: Response): Promise<void> {
        const { matricula, senha, socketId } = req.body;
        const mat = parseInt(matricula);
        try {
            const user = await UserService.autenticacao(mat, senha, socketId);
            res.status(200).json({ message: 'Autenticação bem-sucedida!', user });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async criarUsuario(req:Request, res:Response): Promise<void> {
        const { matricula, senha } = req.body;
        const mat = parseInt(matricula);
        try {
            await UserService.criacaoUsuario(mat, senha);
            res.status(200).json({message: 'Usuário cadastrado com sucesso!'})
        } catch(error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async atualizarSenha(req:Request, res:Response): Promise<void> {
        const { matricula, senha, confirmarSenha } = req.body;
        const mat = parseInt(matricula);
        try {
            if (senha === confirmarSenha) {
                await UserService.atualizacaoSenha(mat, senha);
                res.status(200).json({message: 'Senha cadastrada com sucesso!'})
            } else {
                res.status(400).json({ message: 'As senhas não conferem, por gentileza verifique!' }); 
            }
        } catch(error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async deslogar(req:Request, res:Response):Promise <void> {
        const { socketId } = req.body;
        try {
            const logoff = await UserService.deslog_suporte(socketId);
            res.status(200).json({message: 'Logoff realizado', logoff})
        } catch(error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
}