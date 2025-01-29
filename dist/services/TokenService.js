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
exports.TokenService = void 0;
const UserService_1 = require("./UserService");
class TokenService {
    static atualizarToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            this.tokens[token] = Date.now();
        });
    }
    static verificarTokens() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            for (const token in this.tokens) {
                if (now - this.tokens[token] > 5 * 60 * 1000) {
                    delete this.tokens[token];
                    yield UserService_1.UserService.deslog_suporte(token);
                }
            }
        });
    }
}
exports.TokenService = TokenService;
TokenService.tokens = {};
