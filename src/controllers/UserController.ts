import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

export class UserController {
    public async validacaoUsuario(req: Request, res: Response): Promise<void> {
        const { matricula, senha } = req.body;
        const mat = parseInt(matricula);
        try {
            const user = await UserService.autenticacao(mat, senha);
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
}