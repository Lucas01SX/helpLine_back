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
exports.GestaoAcessoController = void 0;
const GestaoAcessoService_1 = require("../services/GestaoAcessoService");
class GestaoAcessoController {
    cargosGerais(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cargos = yield GestaoAcessoService_1.GestaoAcessoService.cargosGerais();
                res.status(200).json({ cargos });
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
    PerfisGerais(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const perfis = yield GestaoAcessoService_1.GestaoAcessoService.perfisAcesso();
                res.status(200).json({ perfis });
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
    atualizarPerfil(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { idUsuario, matriculaLocal, novoPerfilId, perfilSelecionado } = req.body;
                yield GestaoAcessoService_1.GestaoAcessoService.atualizarPerfil(idUsuario, novoPerfilId, matriculaLocal, perfilSelecionado);
                res.status(200).json({ message: 'Perfil alterado com sucesso. Gentileza solicitar ao colaborador que relogue na ferramenta para refletir a alteração!' });
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
exports.GestaoAcessoController = GestaoAcessoController;
