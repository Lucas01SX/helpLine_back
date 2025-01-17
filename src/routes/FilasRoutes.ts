import express  from "express";
import { FilasController } from "../controllers/FilasController";

const filasController = new FilasController();
const router = express.Router();

router.get('/gerais', (req, res) => filasController.filasGerais(req, res));



export default router ;