import { Request, Response } from 'express';
import { routeMap } from '../routes/SuporteRoutes';
import { userRoute } from '../routes/userRoutes';
import { tokenRoutes } from '../routes/TokenRoutes';
import { dashboardRoutes } from '../routes/DashboardRoutes';
import { relatorioRoutes } from '../routes/RelatorioRoutes';

export const socketMiddleware = (routeName: string) => {
    return (data: any, callback: (result: any) => void) => {
        const req = { body: { ...data } } as Request;
        const res = {
            status: (statusCode: number) => ({
                json: (result: any) => {
                    if (callback) {
                        callback(result);
                    }
                }
            })
        } as Response;
        const routeHandler = routeMap[routeName] || userRoute[routeName] || tokenRoutes[routeName] || dashboardRoutes[routeName] || relatorioRoutes[routeName];
        if (routeHandler) {
            routeHandler(req, res);
        } else {
            console.error(`Rota ${routeName} não encontrada no mapa de rotas`);
        }
    };
};