import express from 'express';
import { RelatorioController } from '../controllers/RelatorioController';

const relatorioController = new RelatorioController();
const router = express.Router();

const relatorioRoutes: { [key:string]: (req: express.Request, res:express.Response) => void } = {
    relatorio: (req, res) => relatorioController.relatorioSuporte(req, res),
    relatorioCP : (req, res) => relatorioController.relatorioCP(req, res),
};

export { router as suporteRoutes, relatorioRoutes };