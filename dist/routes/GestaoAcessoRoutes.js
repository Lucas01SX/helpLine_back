"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeGestao = exports.suporteRoutes = void 0;
const express_1 = __importDefault(require("express"));
const GestaoAcessoController_1 = require("../controllers/GestaoAcessoController");
const gestaoAcesso = new GestaoAcessoController_1.GestaoAcessoController();
const router = express_1.default.Router();
exports.suporteRoutes = router;
const routeGestao = {
    cargos: (req, res) => gestaoAcesso.cargosGerais(req, res),
    perfis: (req, res) => gestaoAcesso.PerfisGerais(req, res),
    atualizarPerfil: (req, res) => gestaoAcesso.atualizarPerfil(req, res),
};
exports.routeGestao = routeGestao;
