import express  from "express";
import { TokenController } from "../controllers/TokenController";


const tokenController = new TokenController();
const router = express.Router();

const tokenRoutes: { [key: string]: (req: express.Request, res: express.Response) => void } = {
    atualizarToken: (req, res) => tokenController.atualizarToken(req, res),
    verificarToken: (req, res) => tokenController.verificarTokens(req, res),
};


export { router as suporteRoutes, tokenRoutes };