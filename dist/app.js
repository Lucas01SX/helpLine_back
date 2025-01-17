"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const FilasRoutes_1 = __importDefault(require("./routes/FilasRoutes"));
const db_1 = __importDefault(require("./database/db"));
const socketMiddleware_1 = require("./middlewares/socketMiddleware");
const app = (0, express_1.default)();
exports.app = app;
const servidor = http_1.default.createServer(app);
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));
const io = new socket_io_1.Server(servidor, {
    path: '/socket.io',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type'],
    }
});
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
let poolEnded = false;
app.use('/api/users', userRoutes_1.default);
app.use('/api/filas', FilasRoutes_1.default);
app.get('/', (req, res) => {
    res.send(`Bem vindo à API`);
});
const port = 3000;
servidor.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
});
io.on('connection', (socket) => {
    console.log('Novo cliente conectado');
    socket.on('abrir_chamado', (data, callback) => {
        (0, socketMiddleware_1.socketMiddleware)('solicitarSuporte')(data, (result) => {
            callback(result);
            io.emit('atualizar_suporte', { action: 'abrir', chamado: result });
        });
    });
    socket.on('cancelar_chamado', (data, callback) => {
        (0, socketMiddleware_1.socketMiddleware)('cancelarSuporte')(data, (result) => {
            callback(result);
            io.emit('atualizar_suporte', { action: 'cancelar', chamado: result });
        });
    });
    socket.on('consultar_suporte', (callback) => {
        if (typeof callback !== 'function') {
            console.error('Callback não é uma função');
            return;
        }
        (0, socketMiddleware_1.socketMiddleware)('consultarSuporte')('', (result) => {
            callback(result);
        });
    });
    socket.on('atender_chamado', (0, socketMiddleware_1.socketMiddleware)('atenderSuporte'));
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});
const shutdownPool = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!poolEnded) {
        try {
            yield db_1.default.end();
            poolEnded = true;
            console.log('Pool de conexões encerrado com sucesso.');
        }
        catch (err) {
            console.error('Erro ao encerrar o pool de conexões:', err);
        }
    }
});
const gracefulShutdown = () => {
    console.log('Iniciando encerramento gracioso...');
    servidor.close(() => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Servidor HTTP fechado');
        yield shutdownPool();
        process.exit(0);
    }));
    setTimeout(() => {
        console.error('Forçando encerramento...');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
