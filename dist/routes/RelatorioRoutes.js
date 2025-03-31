"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.relatorioRoutes = exports.suporteRoutes = void 0;
const express_1 = __importDefault(require("express"));
const RelatorioController_1 = require("../controllers/RelatorioController");
const relatorioController = new RelatorioController_1.RelatorioController();
const router = express_1.default.Router();
exports.suporteRoutes = router;
const relatorioRoutes = {
    relatorio: (req, res) => relatorioController.relatorioSuporte(req, res),
    relatorioCP: (req, res) => relatorioController.relatorioCP(req, res),
};
exports.relatorioRoutes = relatorioRoutes;
