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
exports.SuporteController = void 0;
const SuporteServices_1 = require("../services/SuporteServices");
class SuporteController {
    solicitarSuporte(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { matricula, mcdu, date, hora } = req.body;
            const mat = parseInt(matricula);
            try {
                const gerarSuporte = yield SuporteServices_1.SuporteServices.solicitar(mat, mcdu, date, hora);
                res.status(200).json({ message: 'Suporte registrado com sucesso', gerarSuporte });
            }
            catch (error) {
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message });
                }
                else {
                    res.status(500).json({ message: 'Erro desconhecido na controller', error });
                }
            }
        });
    }
    cancelarSuporte(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { idCancelamento } = req.body;
            const id_cancelamento = parseInt(idCancelamento);
            try {
                const cancelar = yield SuporteServices_1.SuporteServices.cancelar(id_cancelamento);
                res.status(200).json({ cancelar });
            }
            catch (error) {
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message });
                }
                else {
                    res.status(500).json({ message: 'Erro desconhecido na controller', error });
                }
            }
        });
    }
    atenderSuporte(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { idSuporte, idOperador } = req.body;
            try {
                const atendimento = yield SuporteServices_1.SuporteServices.atenderSuporte(idSuporte, idOperador);
                res.status(200).json({ message: 'Suporte atendido com sucesso', atendimento });
            }
            catch (error) {
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message });
                }
                else {
                    res.status(500).json({ message: 'Erro desconhecido na controller', error });
                }
            }
        });
    }
    consultarSuporte(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const consulta = yield SuporteServices_1.SuporteServices.consultaSuporte();
                res.status(200).json({ message: 'Dados de consulta atualizados', consulta });
            }
            catch (error) {
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message });
                }
                else {
                    res.status(500).json({ message: 'Erro desconhecido na controller', error });
                }
            }
        });
    }
}
exports.SuporteController = SuporteController;
