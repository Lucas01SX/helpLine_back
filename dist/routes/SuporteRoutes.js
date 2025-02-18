"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeMap = exports.suporteRoutes = void 0;
const express_1 = __importDefault(require("express"));
const SuporteController_1 = require("../controllers/SuporteController");
const suporteController = new SuporteController_1.SuporteController();
const router = express_1.default.Router();
exports.suporteRoutes = router;
const routeMap = {
    solicitarSuporte: (req, res) => suporteController.solicitarSuporte(req, res),
    atenderSuporte: (req, res) => suporteController.atenderSuporte(req, res),
    cancelarSuporte: (req, res) => suporteController.cancelarSuporte(req, res),
    consultarSuporte: (req, res) => suporteController.consultarSuporte(req, res),
    finalizarSuporte: (req, res) => suporteController.finalizarSuporte(req, res),
    atualizarSuporteManager: (req, res) => suporteController.consultarSuporteGestao(req, res),
    demandaSuporte: (req, res) => suporteController.cadastrarDemanda(req, res)
};
exports.routeMap = routeMap;
