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
exports.getCacheRel = exports.getCachedData = exports.cacheRelatorio = exports.updateCache = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const db_1 = __importDefault(require("../database/db"));
const cache = new node_cache_1.default({ stdTTL: 3600, checkperiod: 120 });
const cache_relatorio = new node_cache_1.default({ stdTTL: 3600, checkperiod: 120 });
exports.default = cache;
cache_relatorio;
const updateCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield db_1.default.query(`SELECT a.matricula, a.login, a.co_funcao::text as cod,a.nome, a.mat_gestor AS mat_super, b.nome AS nome_super, b.mat_gestor AS mat_coord, c.nome AS coordenador FROM cp_jorginho_empregados() a JOIN cp_jorginho_empregados() b ON a.mat_gestor = b.login JOIN cp_jorginho_empregados() c ON b.mat_gestor = c.login WHERE a.login IS NOT null`);
    cache.set('importantData', data.rows);
});
exports.updateCache = updateCache;
const cacheRelatorio = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield db_1.default.query(`WITH tb_cp AS (SELECT dt_historico::DATE AS data, matricula, login, nome, mat_gestor, co_funcao FROM pesquisa_cp_jorginho(current_date-40, current_date)), anexo AS (SELECT DISTINCT mcdu, fila, segmento FROM trafego.tb_anexo1g) SELECT f.data, a.dt_solicitacao_suporte as data, a.id_suporte as id, f.nome AS suporte, h.nome AS gestor, k.nome AS coordenador, b.fila, b.segmento, i.avaliacao, a.hora_inicio_suporte, a.hora_solicitacao_suporte, a.hora_fim_suporte FROM suporte.tb_chamado_suporte a JOIN anexo b ON a.mcdu = b.mcdu LEFT JOIN suporte.tb_login_suporte c ON a.pk_id_solicitante = c.id_usuario LEFT JOIN suporte.tb_login_suporte d ON a.pk_id_prestador_suporte = d.id_usuario LEFT JOIN tb_cp f ON d.login = f.login AND a.dt_solicitacao_suporte = f.data JOIN tb_cp g ON c.login = g.login AND a.dt_solicitacao_suporte = g.data AND g.login NOT IN ('14936') LEFT JOIN tb_cp h ON f.mat_gestor = h.login AND a.dt_solicitacao_suporte = h.data AND h.login NOT IN ('14936') LEFT JOIN suporte.tb_avaliacao_suporte i ON id_suporte = i.pk_id_suporte LEFT JOIN suporte.tb_descricao_suporte j ON id_suporte = j.pk_id_suporte LEFT JOIN tb_cp k ON h.mat_gestor = k.login  GROUP BY f.data, f.nome, b.fila, b.segmento, i.avaliacao, a.hora_inicio_suporte, a.hora_solicitacao_suporte, a.hora_fim_suporte, a.dt_solicitacao_suporte, a.id_suporte, h.nome, k.nome`);
    cache.set('relatorioData', data.rows);
});
exports.cacheRelatorio = cacheRelatorio;
const getCachedData = () => __awaiter(void 0, void 0, void 0, function* () {
    const cachedData = cache.get('importantData');
    return cachedData ? cachedData : [];
});
exports.getCachedData = getCachedData;
const getCacheRel = () => __awaiter(void 0, void 0, void 0, function* () {
    const cacheRelatorio = cache.get('relatorioData');
    return cacheRelatorio ? cacheRelatorio : [];
});
exports.getCacheRel = getCacheRel;
