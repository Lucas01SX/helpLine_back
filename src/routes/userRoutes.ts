import express  from "express";
import { UserController } from "../controllers/UserController";

const userController = new UserController();
const router = express.Router();

const userRoute: { [key: string]: (req: express.Request, res: express.Response) => void } = {
    login: (req, res) => userController.validacaoUsuario(req, res),
    create: (req, res) => userController.criarUsuario(req, res),
    update: (req, res) => userController.atualizarSenha(req, res),
    logoff: (req, res) => userController.deslogar(req, res),
};


export { router as suporteRoutes, userRoute };