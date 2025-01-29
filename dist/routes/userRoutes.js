"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoute = exports.suporteRoutes = void 0;
const express_1 = __importDefault(require("express"));
const UserController_1 = require("../controllers/UserController");
const userController = new UserController_1.UserController();
const router = express_1.default.Router();
exports.suporteRoutes = router;
const userRoute = {
    login: (req, res) => userController.validacaoUsuario(req, res),
    create: (req, res) => userController.criarUsuario(req, res),
    update: (req, res) => userController.atualizarSenha(req, res),
    logoff: (req, res) => userController.deslogar(req, res),
    logados: (req, res) => userController.usuarioslogados(req, res),
};
exports.userRoute = userRoute;
