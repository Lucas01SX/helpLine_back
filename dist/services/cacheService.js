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
exports.getCachedData = exports.updateCache = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const db_1 = __importDefault(require("../database/db"));
const cache = new node_cache_1.default({ stdTTL: 3600, checkperiod: 120 });
exports.default = cache;
const updateCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield db_1.default.query(`SELECT a.matricula, a.login, a.nome, a.mat_gestor AS mat_super, b.nome AS nome_super, b.mat_gestor AS mat_coord, c.nome AS coordenador FROM cp_jorginho_empregados() a JOIN cp_jorginho_empregados() b ON a.mat_gestor = b.login JOIN cp_jorginho_empregados() c ON b.mat_gestor = c.login WHERE a.login IS NOT NULL`);
    cache.set('importantData', data.rows);
});
exports.updateCache = updateCache;
const getCachedData = () => __awaiter(void 0, void 0, void 0, function* () {
    const cachedData = cache.get('importantData');
    return cachedData ? cachedData : [];
});
exports.getCachedData = getCachedData;
