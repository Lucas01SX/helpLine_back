import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import filasRoutes from './routes/FilasRoutes';
import pool from './database/db';
import { socketMiddleware } from './middlewares/socketMiddleware';

const app = express();
const servidor = http.createServer(app);

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
app.get('/', (req: Request, res: Response) => {
    res.send(`Bem vindo à API`);
});

const port = 3000;
servidor.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
});

io.on('connection', (socket) => {
    socket.on('login_chamado', (data, callback) => {
        socketMiddleware('login')(data, socket.id, (result) => {
            callback(result);
            io.emit('atualizar_dados', { action: 'logado', login: result });
        });
    });
    socket.on('create', (data, callback) => {
        socketMiddleware('create')(data, socket.id, (result) => {
            callback(result);
        });
    });
    socket.on('update', (data, callback) => {
        socketMiddleware('update')(data, socket.id, (result) => {
            callback(result);
        });
    });
    socket.on('logoff', (callback) => {
        socketMiddleware('logoff')('', socket.id, (result) => {
            callback(result);
            io.emit('atualizar_dados', { action: 'deslogado', login: result });
        });
    });
    socket.on('abrir_chamado', (data, callback) => {
        socketMiddleware('solicitarSuporte')(data, socket.id, (result) => {
            callback(result);
            io.emit('atualizar_suporte', { action: 'abrir', chamado: result });
        });
    });
    socket.on('cancelar_chamado', (data, callback) => {
        socketMiddleware('cancelarSuporte')(data, socket.id, (result) => {
            callback(result);
            io.emit('atualizar_suporte', { action: 'cancelar', chamado: result });
        });
    });
    socket.on('consultar_suporte', (callback) => {
        if (typeof callback !== 'function') {
            console.error('Callback não é uma função');
            return;
        }
        socketMiddleware('consultarSuporte')('', socket.id, (result) => {
            callback(result);
        });
    });
    socket.on('atender_chamado', (data, callback) => {
        socketMiddleware('atenderSuporte')(data, socket.id, (result) => {
            callback(result);
            io.emit('atualizar_suporte', { action: 'atender', chamado: result });
        });
    });
    socket.on('atualizar_manager', (callback) => {
        socketMiddleware('atualizarSuporteManager')('',socket.id, (result) => {
            callback(result);
            io.emit('atualizar_suporte', { action: 'consulta_manager', chamado: result });
        });
    });
    socket.on('finalizar_chamado', (data) => {
        socketMiddleware('finalizarSuporte')(data, socket.id, (result) => {
            io.emit('atualizar_suporte', { action: 'finalizar', chamado: result });
        });
    });
    socket.on('disconnect', () => {
        //
    });
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

export { app };