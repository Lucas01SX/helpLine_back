import express  from "express";
import { UserController } from "../controllers/UserController";

const userController = new UserController();
const router = express.Router();

// router.get('/gerais', (req, res) => userController.consultaDash(req, res));



export default router ;