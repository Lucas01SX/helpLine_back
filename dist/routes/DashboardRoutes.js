"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = exports.suporteRoutes = void 0;
const express_1 = __importDefault(require("express"));
const DashboardController_1 = require("../controllers/DashboardController");
const dashboardController = new DashboardController_1.DashboardController();
const router = express_1.default.Router();
exports.suporteRoutes = router;
const dashboardRoutes = {
    dashboard: (req, res) => dashboardController.consultaDash(req, res),
};
exports.dashboardRoutes = dashboardRoutes;
