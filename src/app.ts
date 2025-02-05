import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import filasRoutes from './routes/FilasRoutes';
import testeRoutes from './routes/TesteRoutes';
import pool from './database/db';
import { socketMiddleware } from './middlewares/socketMiddleware';
import { updateCache } from './services/cacheService';

const updateInterval = 60 * 60 * 1000;
const port = 3000;
const app = express();
const servidor = http.createServer(app);

const startServer = async () => {
    try {
        await updateCache();
        console.log('Cache atualizado com sucesso na inicialização');
    } catch (err) {
        console.error('Erro ao atualizar o cache na inicialização:', err);
    }
    setInterval(async () => {
        try {
            await updateCache();
            console.log('Cache atualizado com sucesso');
        } catch (err) {
            console.error('Erro ao atualizar o cache:', err);
        }
    }, updateInterval);
    servidor.listen(port, '0.0.0.0', () => {
        console.log(`Servidor rodando na porta ${port}`);
    });
};

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

const io = new SocketIOServer(servidor, {
    path:'/socket.io',
    cors: {
        origin: '*', 
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type'],
    }
});

app.use(express.json());
app.use(bodyParser.json());
let poolEnded = false;

app.use('/api/filas', filasRoutes);
// ROTA PARA TESTES
// app.use('/api/dash', testeRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send(`Bem vindo à API`);
});

io.on('connection', (socket) => {
    socket.on('login_chamado', (data, callback) => {
        socketMiddleware('login')(data, (result) => {
            const { token, login, nome  } = result; 
            callback({...result, token});
        });
    });
    socket.on('create', (data, callback) => {
        socketMiddleware('create')(data, (result) => {
            callback(result);
        });
    });
    socket.on('update', (data, callback) => {
        socketMiddleware('update')(data, (result) => {
            callback(result);
        });
    });
    socket.on('logoff', (data, callback) => {
        socketMiddleware('logoff')(data, (result) => {
            callback(result);
        });
    });
    socket.on('reset_senha', (data, callback) => {
        socketMiddleware('reset')(data, (result) => {
            callback(result);
        });
    });
    socket.on('abrir_chamado', (data, callback) => {
        socketMiddleware('solicitarSuporte')(data, (result) => {
            callback(result);
            io.emit('atualizar_suporte', { action: 'abrir', chamado: result });
        });
    });
    socket.on('cancelar_chamado', (data, callback) => {
        socketMiddleware('cancelarSuporte')(data, (result) => {
            callback(result);
            io.emit('atualizar_suporte', { action: 'cancelar', chamado: result });
        });
    });
    socket.on('consultar_suporte', (callback) => {
        if (typeof callback !== 'function') {
            console.error('Callback não é uma função');
            return;
        }
        socketMiddleware('consultarSuporte')('', (result) => {
            callback(result);
        });
    });
    socket.on('atender_chamado', (data, callback) => {
        socketMiddleware('atenderSuporte')(data, (result) => {
            callback(result);
            io.emit('atualizar_suporte', { action: 'atender', chamado: result });
        });
    });
    socket.on('finalizar_chamado', (data) => {
        socketMiddleware('finalizarSuporte')(data, (result) => {
            io.emit('atualizar_suporte', { action: 'finalizar', chamado: result });
        });
    });
    socket.on('atualizar_manager', (callback) => {
        socketMiddleware('atualizarSuporteManager')('',(result) => {
            callback(result);
        });
    });
    socket.on('consultar_logados', (callback) => {
        socketMiddleware('logados')('', (result) => {
            callback(result);
        });
    });
    socket.on('atualizar_token', (data, callback) => {
        socketMiddleware('atualizarToken')(data, (result) => {
            callback(result);
        });
    });
    socket.on('cards_dashboard', (callback) => {
        socketMiddleware('dashboard')('', (result) => {
            callback(result);
        });
    });
    socket.on('disconnect', () => {
        //
    });
    setInterval(async () => {
        try {
            socketMiddleware('verificarToken')({}, (result) => {
                if (result.deslogados && result.deslogados.length > 0) {
                    io.emit('tokens_deslogados', { tokens: result.deslogados });
                }
            });
        } catch (err) {
            console.error('Erro ao verificar tokens:', err);
        }
    }, 90 * 60 * 1000);
});

const shutdownPool = async () => {
    if (!poolEnded) {
        try {
            await pool.end();
            poolEnded = true;
            console.log('Pool de conexões encerrado com sucesso.');
        } catch (err) {
            console.error('Erro ao encerrar o pool de conexões:', err);
        }
    }
};

const gracefulShutdown = () => {
    console.log('Iniciando encerramento gracioso...');
    servidor.close(async () => {
        console.log('Servidor HTTP fechado');
        await shutdownPool();
        process.exit(0);
    });
    setTimeout(() => {
        console.error('Forçando encerramento...');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();

export { app };