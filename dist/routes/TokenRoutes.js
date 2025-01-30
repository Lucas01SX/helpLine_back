"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenRoutes = exports.suporteRoutes = void 0;
const express_1 = __importDefault(require("express"));
const TokenController_1 = require("../controllers/TokenController");
const tokenController = new TokenController_1.TokenController();
const router = express_1.default.Router();
exports.suporteRoutes = router;
const tokenRoutes = {
    atualizarToken: (req, res) => tokenController.atualizarToken(req, res),
    verificarToken: (req, res) => tokenController.verificarTokens(req, res),
};
exports.tokenRoutes = tokenRoutes;
