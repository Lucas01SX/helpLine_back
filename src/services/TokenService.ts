import { UserService } from "./UserService";

export class TokenService {
    private static tokens: { [key: string]: number } = {};

    public static async atualizarToken(token: string): Promise<string> {
        try {
            this.tokens[token] = Date.now();
            return "Token atualizado!";
        } catch (error) {
            return "Token não atualizado"
        }
    }

    public static async verificarTokens(): Promise<any> {
        const now = Date.now();
        const deslogados: string[] = [];
        for (const token in this.tokens) {
            if (now - this.tokens[token] > 5 * 60 * 1000) { 
                delete this.tokens[token];
                await UserService.deslog_suporte(token);
                deslogados.push(token);
            }
        }
        return deslogados;
    }
}