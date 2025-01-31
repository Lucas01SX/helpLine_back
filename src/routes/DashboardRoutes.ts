import express  from "express";
import { DashboardController } from "../controllers/DashboardController";

const dashboardController = new DashboardController();
const router = express.Router();

const dashboardRoutes: { [key: string]: (req: express.Request, res: express.Response) => void } = {
    dashboard: (req, res) => dashboardController.consultaDash(req, res),
};


export { router as suporteRoutes, dashboardRoutes };