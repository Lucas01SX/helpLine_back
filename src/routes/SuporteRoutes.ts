import express from 'express';
import { SuporteController } from '../controllers/SuporteController';

const suporteController = new SuporteController();
const router = express.Router();



const routeMap: { [key: string]: (req: express.Request, res: express.Response) => void } = {
    solicitarSuporte: (req, res) => suporteController.solicitarSuporte(req, res),
    atenderSuporte: (req, res) => suporteController.atenderSuporte(req, res),
    cancelarSuporte: (req, res) => suporteController.cancelarSuporte(req, res),
    consultarSuporte: (req, res) => suporteController.consultarSuporte(req, res),
    finalizarSuporte: (req, res) => suporteController.finalizarSuporte(req, res),
    atualizarSuporteManager: (req, res) => suporteController.consultarSuporteGestao(req, res),
};

export { router as suporteRoutes, routeMap };