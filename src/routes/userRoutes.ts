import express  from "express";
import { UserController } from "../controllers/UserController";

const userController = new UserController();
const router = express.Router();

router.post('/login', (req, res) => userController.validacaoUsuario(req, res));
router.post('/create', (req, res) => userController.criarUsuario(req, res));
router.post('/update', (req, res) => userController.atualizarSenha(req, res));


export default router ;