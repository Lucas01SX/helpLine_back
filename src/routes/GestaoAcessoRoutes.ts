import express from 'express';
import { GestaoAcessoController } from "../controllers/GestaoAcessoController";

const gestaoAcesso = new GestaoAcessoController();
const router = express.Router();



const routeGestao: { [key: string]: (req: express.Request, res: express.Response) => void } = {
    cargos: (req, res) => gestaoAcesso.cargosGerais(req, res),
    perfis: (req, res) => gestaoAcesso.PerfisGerais(req, res),
    atualizarPerfil: (req, res) => gestaoAcesso.atualizarPerfil(req, res),
};

export { router as suporteRoutes, routeGestao };

