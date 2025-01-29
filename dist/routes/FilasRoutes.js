"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const FilasController_1 = require("../controllers/FilasController");
const filasController = new FilasController_1.FilasController();
const router = express_1.default.Router();
router.get('/gerais', (req, res) => filasController.filasGerais(req, res));
router.post('/consulta/skill', (req, res) => filasController.consultaSkill(req, res));
exports.default = router;
