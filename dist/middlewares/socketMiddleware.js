"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketMiddleware = void 0;
const SuporteRoutes_1 = require("../routes/SuporteRoutes");
const socketMiddleware = (routeName) => {
    return (data, callback) => {
        const req = { body: data };
        const res = {
            status: (statusCode) => ({
                json: (result) => {
                    if (callback) {
                        callback(result);
                    }
                }
            })
        };
        const routeHandler = SuporteRoutes_1.routeMap[routeName];
        if (routeHandler) {
            routeHandler(req, res);
        }
        else {
            console.error(`Rota ${routeName} não encontrada no mapa de rotas`);
        }
    };
};
exports.socketMiddleware = socketMiddleware;
