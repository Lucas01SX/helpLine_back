import express  from "express";
import { FilasController } from "../controllers/FilasController";

const filasController = new FilasController();
const router = express.Router();

router.get('/gerais', (req, res) => filasController.filasGerais(req, res));
router.post('/consulta/skill', (req, res) => filasController.consultaSkill(req, res));



export default router ;