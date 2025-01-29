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
exports.FilasService = void 0;
const db_1 = __importDefault(require("../database/db"));
class FilasService {
    static filasGerais() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield db_1.default.query(`select distinct segmento, mcdu, fila from trafego.tb_anexo1g where status <> 'Desativa' and current_date between data_inicio and data_fim and segmento not in('SERVICOS.CAIXA','DESCONEXAO') and fila not in ('2A_NIVEL','WHATSAPP') order by fila asc`);
                const filas = res.rows;
                return filas;
            }
            catch (e) {
                console.error('Erro na autenticação:', e);
                throw e;
            }
        });
    }
    static consultaSkill(matricula) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield db_1.default.query(`select matricula, login, string_agg(mcdu,',') mcdu, string_agg(fila,',') fila from suporte.tb_skills_staff where excluida <> true and matricula = $1 group by matricula, login`, [matricula]);
                if (res.rows.length === 0) {
                    throw new Error('Usuário não encontrado');
                }
                const skills = res.rows[0];
                return skills;
            }
            catch (e) {
                console.error('Erro na busca das skills:', e);
                throw e;
            }
        });
    }
}
exports.FilasService = FilasService;
