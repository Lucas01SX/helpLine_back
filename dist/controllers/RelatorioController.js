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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioController = void 0;
const RelatorioService_1 = require("../services/RelatorioService");
class RelatorioController {
    relatorioSuporte(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { suporte, gestor, coordenador, fila, segmento, dataInicio, dataFim, agruparPor } = req.body;
            //console.log("resultad0 controller: ",req.body)
            try {
                const dadosRelatorio = yield RelatorioService_1.RelatorioService.relatorioSuporte(suporte, gestor, coordenador, fila, segmento, dataInicio, dataFim, agruparPor);
                res.status(200).json({ dadosRelatorio });
            }
            catch (e) {
                if (e instanceof Error) {
                    res.status(400).json({ message: e.message });
                }
                else {
                    res.status(500).json({ message: 'Erro na controller', e });
                }
            }
        });
    }
    relatorioCP(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dadosCP = yield RelatorioService_1.RelatorioService.relatorioCP();
                res.status(200).json({ dadosCP });
            }
            catch (e) {
                if (e instanceof Error) {
                    res.status(400).json({ message: e.message });
                }
                else {
                    res.status(500).json({ message: 'Erro na controller Cp', e });
                }
            }
        });
    }
}
exports.RelatorioController = RelatorioController;
