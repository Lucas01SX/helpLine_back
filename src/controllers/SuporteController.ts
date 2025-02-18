import { Request, Response } from 'express';
import { SuporteServices } from '../services/SuporteServices';

export class SuporteController { 
    public async solicitarSuporte(req: Request, res: Response): Promise<void> {
        const { matricula, mcdu, date, hora } = req.body;
        const mat = parseInt(matricula)
        try {
            const gerarSuporte = await SuporteServices.solicitar(mat, mcdu, date, hora);
            res.status(200).json({ message: 'Suporte registrado com sucesso', gerarSuporte });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async cancelarSuporte(req: Request, res: Response) : Promise<void> {
        const { idCancelamento } = req.body;
        const id_cancelamento = parseInt(idCancelamento)
        try {
            const id_suporte = await SuporteServices.cancelar(id_cancelamento);
            res.status(200).json({  message: "Cancelamento realizado com sucesso",id_suporte });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message }); 
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async atenderSuporte(req: Request, res: Response): Promise<void> {
        const { idSuporte, matSuporte, dtSuporte, hrSuporte, tpAguardado  } = req.body;
        const idSup = parseInt(idSuporte);
        const matSup = parseInt(matSuporte);
        try {
            const suporte = await SuporteServices.atenderSuporte(idSup, matSup, dtSuporte, hrSuporte, tpAguardado );
            res.status(200).json({ message: 'Suporte atendido com sucesso', suporte});
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async consultarSuporte(req: Request, res: Response): Promise<void> {
        try {
            const consulta = await SuporteServices.consultaSuporte();
            res.status(200).json({ message: 'Dados de consulta atualizados', consulta });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async finalizarSuporte(req: Request, res: Response): Promise<void> {
        const {idSuporte,matSuporte,  hrSuporte } = req.body
        try {
            const id_suporte = await SuporteServices.finalizarSuporte(hrSuporte, matSuporte, idSuporte);
            res.status(200).json({ message: 'Suporte finalizado com sucesso', id_suporte });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async consultarSuporteGestao(req: Request, res: Response): Promise<void> {
        try {
            const consulta = await SuporteServices.consultaChamadosGestao();
            res.status(200).json({ message: 'Dados de consulta atualizados', consulta });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async cadastrarDemanda(req: Request, res: Response): Promise<void> {
        const {idSuporte, horario_descricao, descricao} = req.body
        //console.log(req.body)
        //console.log(idSuporte, horario_descricao, descricao)
        try {
            const id_suporte = await SuporteServices.cadastrarDemanda(idSuporte, horario_descricao, descricao);
            res.status(200).json({ message: 'Descricao de atendimento cadastrada',id_suporte });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
    public async cadastrarAvaliacao(req: Request, res: Response): Promise<void> {
        const {idSuporte,horario_avaliacao,  avaliacao } = req.body
        try {
            const id_suporte = await SuporteServices.cadastrarAvaliacao(idSuporte, horario_avaliacao, avaliacao);
            res.status(200).json({ message: 'Avaliação cadastrada com sucesso!', id_suporte });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Erro desconhecido na controller', error });
            }
        }
    }
}
 