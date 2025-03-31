"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketMiddleware = void 0;
const SuporteRoutes_1 = require("../routes/SuporteRoutes");
const userRoutes_1 = require("../routes/userRoutes");
const TokenRoutes_1 = require("../routes/TokenRoutes");
const DashboardRoutes_1 = require("../routes/DashboardRoutes");
const RelatorioRoutes_1 = require("../routes/RelatorioRoutes");
const socketMiddleware = (routeName) => {
    return (data, callback) => {
        const req = { body: Object.assign({}, data) };
        const res = {
            status: (statusCode) => ({
                json: (result) => {
                    if (callback) {
                        callback(result);
                    }
                }
            })
        };
        const routeHandler = SuporteRoutes_1.routeMap[routeName] || userRoutes_1.userRoute[routeName] || TokenRoutes_1.tokenRoutes[routeName] || DashboardRoutes_1.dashboardRoutes[routeName] || RelatorioRoutes_1.relatorioRoutes[routeName];
        if (routeHandler) {
            routeHandler(req, res);
        }
        else {
            console.error(`Rota ${routeName} não encontrada no mapa de rotas`);
        }
    };
};
exports.socketMiddleware = socketMiddleware;
