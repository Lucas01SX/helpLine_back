import express  from "express";
import { SuporteController } from "../controllers/SuporteController";

const suporteController = new SuporteController();
const router = express.Router();

router.post('/gerais', (req, res) => suporteController.cadastrarDemanda(req, res));



export default router ;