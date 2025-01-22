import { Request, Response } from 'express';
import { routeMap } from '../routes/SuporteRoutes';
import { userRoute } from '../routes/userRoutes';

export const socketMiddleware = (routeName: string) => {
    return (data: any, socketId: string, callback: (result: any) => void) => {
        const req = { body: { ...data, socketId } } as Request;
        const res = {
            status: (statusCode: number) => ({
                json: (result: any) => {
                    if (callback) {
                        callback(result);
                    }
                }
            })
        } as Response;
        const routeHandler = routeMap[routeName] || userRoute[routeName];
        if (routeHandler) {
            routeHandler(req, res);
        } else {
            console.error(`Rota ${routeName} não encontrada no mapa de rotas`);
        }
    };
};