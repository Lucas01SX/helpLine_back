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
const FilasRoutes_1 = __importDefault(require("./routes/FilasRoutes"));
const db_1 = __importDefault(require("./database/db"));
const socketMiddleware_1 = require("./middlewares/socketMiddleware");
const cacheService_1 = require("./services/cacheService");
const updateInterval = 60 * 60 * 1000;
const port = 3000;
const app = (0, express_1.default)();
exports.app = app;
const servidor = http_1.default.createServer(app);
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, cacheService_1.updateCache)();
        console.log('Cache atualizado com sucesso na inicialização');
    }
    catch (err) {
        console.error('Erro ao atualizar o cache na inicialização:', err);
    }
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, cacheService_1.updateCache)();
            console.log('Cache atualizado com sucesso');
        }
        catch (err) {
            console.error('Erro ao atualizar o cache:', err);
        }
    }), updateInterval);
    servidor.listen(port, '0.0.0.0', () => {
        console.log(`Servidor rodando na porta ${port}`);
    });
});
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
app.use('/api/filas', FilasRoutes_1.default);
// ROTA PARA TESTES
// app.use('/api/dash', testeRoutes);
app.get('/', (req, res) => {
    res.send(`Bem vindo à API`);
});
io.on('connection', (socket) => {
    socket.on('login_chamado', (data, callback) => {
        (0, socketMiddleware_1.socketMiddleware)('login')(data, (result) => {
            const { token, login, nome } = result;
            callback(Object.assign(Object.assign({}, result), { token }));
        });
    });
    socket.on('create', (data, callback) => {
        (0, socketMiddleware_1.socketMiddleware)('create')(data, (result) => {
            callback(result);
        });
    });
    socket.on('update', (data, callback) => {
        (0, socketMiddleware_1.socketMiddleware)('update')(data, (result) => {
            callback(result);
        });
    });
    socket.on('logoff', (data, callback) => {
        (0, socketMiddleware_1.socketMiddleware)('logoff')(data, (result) => {
            callback(result);
        });
    });
    socket.on('reset_senha', (data, callback) => {
        (0, socketMiddleware_1.socketMiddleware)('reset')(data, (result) => {
            callback(result);
        });
    });
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
    socket.on('atender_chamado', (data, callback) => {
        (0, socketMiddleware_1.socketMiddleware)('atenderSuporte')(data, (result) => {
            callback(result);
            io.emit('atualizar_suporte', { action: 'atender', chamado: result });
        });
    });
    socket.on('finalizar_chamado', (data) => {
        (0, socketMiddleware_1.socketMiddleware)('finalizarSuporte')(data, (result) => {
            io.emit('atualizar_suporte', { action: 'finalizar', chamado: result });
        });
    });
    socket.on('atualizar_manager', (callback) => {
        (0, socketMiddleware_1.socketMiddleware)('atualizarSuporteManager')('', (result) => {
            callback(result);
        });
    });
    socket.on('consultar_logados', (callback) => {
        (0, socketMiddleware_1.socketMiddleware)('logados')('', (result) => {
            callback(result);
        });
    });
    socket.on('atualizar_token', (data, callback) => {
        (0, socketMiddleware_1.socketMiddleware)('atualizarToken')(data, (result) => {
            callback(result);
        });
    });
    socket.on('cards_dashboard', (callback) => {
        (0, socketMiddleware_1.socketMiddleware)('dashboard')('', (result) => {
            callback(result);
        });
    });
    socket.on('demanda_suporte', (data, callback) => {
        (0, socketMiddleware_1.socketMiddleware)('demandaSuporte')(data, (result) => {
            callback(result);
        });
    });
    socket.on('disconnect', () => {
        //
    });
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            (0, socketMiddleware_1.socketMiddleware)('verificarToken')({}, (result) => {
                if (result.deslogados && result.deslogados.length > 0) {
                    io.emit('tokens_deslogados', { tokens: result.deslogados });
                }
            });
        }
        catch (err) {
            console.error('Erro ao verificar tokens:', err);
        }
    }), 90 * 60 * 1000);
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
startServer();
