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
exports.TokenController = void 0;
const TokenService_1 = require("../services/TokenService");
class TokenController {
    atualizarToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token } = req.body;
            try {
                TokenService_1.TokenService.atualizarToken(token);
                res.status(200).json({ message: 'Token atualizado com sucesso!' });
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
    verificarTokens(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                TokenService_1.TokenService.verificarTokens();
                res.status(200).json({ message: 'Tokens atualizados com sucesso!' });
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
exports.TokenController = TokenController;
