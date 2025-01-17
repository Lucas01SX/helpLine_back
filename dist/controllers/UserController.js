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
exports.UserController = void 0;
const UserService_1 = require("../services/UserService");
class UserController {
    validacaoUsuario(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { matricula, senha } = req.body;
            const mat = parseInt(matricula);
            try {
                const user = yield UserService_1.UserService.autenticacao(mat, senha);
                res.status(200).json({ message: 'Autenticação bem-sucedida!', user });
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
    criarUsuario(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { matricula, senha } = req.body;
            const mat = parseInt(matricula);
            try {
                yield UserService_1.UserService.criacaoUsuario(mat, senha);
                res.status(200).json({ message: 'Usuário cadastrado com sucesso!' });
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
    atualizarSenha(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { matricula, senha, confirmarSenha } = req.body;
            const mat = parseInt(matricula);
            try {
                if (senha === confirmarSenha) {
                    yield UserService_1.UserService.atualizacaoSenha(mat, senha);
                    res.status(200).json({ message: 'Senha cadastrada com sucesso!' });
                }
                else {
                    res.status(400).json({ message: 'As senhas não conferem, por gentileza verifique!' });
                }
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
exports.UserController = UserController;
