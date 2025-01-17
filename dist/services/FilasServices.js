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
                const res = yield db_1.default.query(`select distinct segmento, mcdu, fila from trafego.tb_anexo1g where status  <> 'Desativa' order by fila asc`);
                const filas = res.rows;
                return filas;
            }
            catch (e) {
                console.error('Erro na autenticação:', e);
                throw e;
            }
        });
    }
}
exports.FilasService = FilasService;
