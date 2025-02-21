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
exports.RequestsSuport = void 0;
const axios_1 = __importDefault(require("axios"));
const tough_cookie_1 = __importDefault(require("tough-cookie"));
const https_1 = __importDefault(require("https"));
class RequestsSuport {
    static createClient() {
        const cookieJar = new tough_cookie_1.default.CookieJar();
        const client = axios_1.default.create({
            withCredentials: true,
            httpsAgent: new https_1.default.Agent({ rejectUnauthorized: false })
        });
        return { cookieJar, client };
    }
    static addCookiesToHeader(url, headers, cookieJar) {
        return new Promise((resolve, reject) => {
            cookieJar.getCookies(url, (err, cookies) => {
                if (err) {
                    return reject(err);
                }
                headers.Cookie = (cookies && cookies.map(cookie => cookie.cookieString()).join('; ')) || '';
                resolve(headers);
            });
        });
    }
    static saveCookiesFromResponse(url, response, cookieJar) {
        return new Promise((resolve, reject) => {
            const setCookieHeader = response.headers['set-cookie'];
            if (setCookieHeader) {
                setCookieHeader.forEach((cookie) => {
                    cookieJar.setCookie(cookie, url, err => {
                        if (err) {
                            return reject(err);
                        }
                    });
                });
            }
            resolve();
        });
    }
    static autenticar(cookieJar, client) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = 'http://10.0.229.63/manager/login.php?cmd=login';
                let headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
                headers = yield this.addCookiesToHeader(url, headers, cookieJar);
                const response = yield client.post(url, 'login=P566873&pass=123456&cpf=', { headers });
                yield this.saveCookiesFromResponse(url, response, cookieJar);
                if (response.data.tipo === 'success_login' && response.data.redirect) {
                    const redirectUrl = `http://10.0.229.63/manager/${response.data.redirect}`;
                    yield client.get(redirectUrl, { headers });
                    console.log('Autenticação bem-sucedida:', response.data);
                    return true;
                }
                else {
                    console.error('Falha na autenticação:', response.data);
                    return false;
                }
            }
            catch (error) {
                console.error('Erro na autenticação:', error);
                return false;
            }
        });
    }
    static obterUsuarios(login, cookieJar, client) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = `http://10.0.229.63/manager/rpc.php?module=panel&cmd=refresh&filas=1018,8754,8753,8268,1000,1001,1010,1011,1012,1013,1014,5101,5021,5040,5072,5098,5123,5143,5321,5371,5382,6268,8003,8012,8016,8017,8038,8043,8045,8046,8051,8053,8070,8071,8081,8083,8095,8100,8102,8116,8125,8127,8141,8142,8144,8146,8147,8152,8155,8168,8200,8201,8202,8204,8212,8214,8231,8241,8271,8272,8244,8273,8246,8247,8248,8249,8274,8251,8252,8253,8275,8255,8256,8257,8258,8259,8260,8261,8262,8263,8269,8284,8305,8306,8307,8308,8312,8314,8315,8316,8319,8321,8384,8405,8406,8407,8408,8412,8413,8414,8415,8416,8484,8750,8758,8759,8760,8761,8763,8764,8765,8768,8801,8804,8807,8808,8888,9000,9001,9002,9013,9095,&ocultar-filas-sem-agente=1&ocultar-filas-discador-parado=0&agentes_show=fila_1018,fila_8754,fila_8753,fila_8268,fila_5101,fila_5021,fila_5040,fila_5072,fila_5321,fila_6268,fila_8003,fila_8016,fila_8051,fila_8071,fila_8081,fila_8083,fila_8100,fila_8102,fila_8116,fila_8125,fila_8141,fila_8142,fila_8144,fila_8146,fila_8147,fila_8152,fila_8155,fila_8168,fila_8200,fila_8201,fila_8204,fila_8212,fila_8214,fila_8231,fila_8241,fila_8271,fila_8272,fila_8244,fila_8273,fila_8246,fila_8247,fila_8248,fila_8249,fila_8274,fila_8251,fila_8252,fila_8253,fila_8275,fila_8255,fila_8256,fila_8257,fila_8258,fila_8262,fila_8284,fila_8305,fila_8306,fila_8307,fila_8308,fila_8312,fila_8314,fila_8315,fila_8316,fila_8384,fila_8405,fila_8406,fila_8407,fila_8408,fila_8412,fila_8414,fila_8415,fila_8416,fila_8484,&orderby=&replay_time=&_=1710256344011manager/rpc.php?module=panel&cmd=refresh&filas=1018,8754,8753,8268,1000,1001,1010,1011,1012,1013,1014,5101,5021,5040,5072,5098,5123,5143,5321,5371,5382,6268,8003,8012,8016,8017,8038,8043,8045,8046,8051,8053,8070,8071,8081,8083,8095,8100,8102,8116,8125,8127,8141,8142,8144,8146,8147,8152,8155,8168,8200,8201,8202,8204,8212,8214,8231,8241,8271,8272,8244,8273,8246,8247,8248,8249,8274,8251,8252,8253,8275,8255,8256,8257,8258,8259,8260,8261,8262,8263,8269,8284,8305,8306,8307,8308,8312,8314,8315,8316,8319,8321,8384,8405,8406,8407,8408,8412,8413,8414,8415,8416,8484,8750,8758,8759,8760,8761,8763,8764,8765,8768,8801,8804,8807,8808,8888,9000,9001,9002,9013,9095&ocultar-filas-sem-agente=1&ocultar-filas-discador-parado=0&agentes_show=fila_1018,fila_8754,fila_8753,fila_8268,fila_8484,fila_8142,fila_8416,fila_1003,fila_8316,fila_8144,fila_8146,fila_8147,fila_1002,fila_8102,fila_5143,fila_8081,fila_8258,fila_8306,fila_1014,fila_8016,fila_1007,fila_8272,fila_8305,fila_1000,fila_8271,fila_8407,fila_8256,fila_8275,fila_8412,fila_8034,fila_8284,fila_8868,fila_8315,fila_8201,fila_1013,fila_6268,fila_8247,fila_8263,fila_8212,fila_8414,fila_8252,fila_1019,fila_1016,fila_8204,fila_5072,fila_8241,fila_8155,fila_8257,fila_8255,fila_8405,fila_8071,fila_1004,fila_8168,fila_1006,fila_8200,fila_1008,fila_8003,fila_8415,fila_8273,fila_5040,fila_8274,fila_8750,fila_8100,fila_5321,fila_8384,fila_8244,fila_1012,fila_8249,fila_1011,fila_1005,fila_1001,fila_8141,fila_8251,fila_8045,fila_8406,fila_8248,fila_1015,fila_5101,fila_5021,fila_0,fila_8125,fila_8046,fila_8246,fila_1017,fila_8408,fila_8314,fila_8083,fila_8038,fila_1009,fila_8307,fila_8116,fila_1010,fila_8231,fila_5098,fila_8312,fila_8051,fila_8262,fila_8253,fila_8308,fila_8870,fila_8043,fila_8152,&orderby=&replay_time=&_=1710256344011`;
                let headers = {};
                headers = yield this.addCookiesToHeader(url, headers, cookieJar);
                const response = yield client.get(url, { headers });
                yield this.saveCookiesFromResponse(url, response, cookieJar);
                const data = response.data;
                const operadores = Object.keys(data).map(key => {
                    const fila = data[key];
                    if (fila.a && typeof fila.a === 'object') {
                        return Object.values(fila.a).filter((agente) => agente[0] === "Em Uso" && agente[1] === "interna").map((agente) => ({
                            nome: agente[10],
                            telefone: agente[13],
                            uniqueId: agente[29]
                        }));
                    }
                    else {
                        return [];
                    }
                }).reduce((acc, val) => acc.concat(val), []);
                const operadoresTratados = operadores.map((operador) => {
                    const [codigo, ...nomeArray] = operador.nome.split(' ');
                    const nome = nomeArray.join(' ');
                    return {
                        codigo,
                        nome,
                        telefone: operador.telefone,
                        uniqueId: operador.uniqueId
                    };
                });
                const operadorFiltrado = operadoresTratados.find((operador) => operador.codigo === login);
                return operadorFiltrado;
            }
            catch (error) {
                console.error('Erro ao obter dados:', error);
            }
        });
    }
    static main(login) {
        return __awaiter(this, void 0, void 0, function* () {
            const { cookieJar, client } = this.createClient();
            const isAuthenticated = yield this.autenticar(cookieJar, client);
            if (isAuthenticated) {
                const dados = yield this.obterUsuarios(login, cookieJar, client);
                return dados;
            }
            else {
                console.error('Autenticação falhou. Não é possível continuar.');
            }
        });
    }
}
exports.RequestsSuport = RequestsSuport;
